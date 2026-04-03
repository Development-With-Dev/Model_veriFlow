import json
import hashlib
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
import os
import logging
from pymongo import MongoClient, DESCENDING
from bson import ObjectId

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages all database operations using MongoDB Atlas for the continuous authentication system"""

    def __init__(self, mongo_uri: str, db_name: str = "veriflow_auth"):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self._init_collections()
        logger.info(f"MongoDB connected: {db_name}")

    def _init_collections(self):
        """Initialize MongoDB collections and indexes"""
        # Users collection
        self.users = self.db["users"]
        self.users.create_index("username", unique=True)
        self.users.create_index("email", unique=True)

        # Sessions collection
        self.sessions = self.db["sessions"]
        self.sessions.create_index("session_id", unique=True)
        self.sessions.create_index("user_id")
        self.sessions.create_index("is_active")

        # Behavioral data collection
        self.behavioral_data = self.db["behavioral_data"]
        self.behavioral_data.create_index([("user_id", 1), ("data_type", 1)])
        self.behavioral_data.create_index("timestamp")

        # Auth events collection
        self.auth_events = self.db["auth_events"]
        self.auth_events.create_index([("user_id", 1), ("event_type", 1)])
        self.auth_events.create_index("timestamp")

        # Model metadata collection
        self.model_metadata = self.db["model_metadata"]
        self.model_metadata.create_index("user_id", unique=True)

        # Counter collection for auto-increment user_id
        self.counters = self.db["counters"]
        if self.counters.find_one({"_id": "user_id"}) is None:
            self.counters.insert_one({"_id": "user_id", "seq": 0})

    def _get_next_user_id(self) -> int:
        """Get next auto-increment user_id"""
        result = self.counters.find_one_and_update(
            {"_id": "user_id"},
            {"$inc": {"seq": 1}},
            return_document=True
        )
        return result["seq"]

    def create_user(self, username: str, email: str, password: str) -> Optional[int]:
        """Create a new user"""
        try:
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)

            user_id = self._get_next_user_id()

            user_doc = {
                "user_id": user_id,
                "username": username,
                "email": email,
                "password_hash": password_hash,
                "salt": salt,
                "created_at": datetime.utcnow(),
                "last_login": None,
                "is_active": True,
                "failed_attempts": 0,
                "locked_until": None,
                "calibration_complete": False
            }

            self.users.insert_one(user_doc)

            # Initialize model metadata
            self.model_metadata.insert_one({
                "user_id": user_id,
                "model_version": 1,
                "last_trained": datetime.utcnow(),
                "training_samples": 0,
                "model_accuracy": None,
                "drift_detected": False,
                "drift_timestamp": None
            })

            return user_id

        except Exception as e:
            if "duplicate key" in str(e).lower():
                return None  # User already exists
            logger.error(f"Error creating user: {e}")
            return None

    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user credentials"""
        user = self.users.find_one({"username": username, "is_active": True})

        if not user:
            return None

        # Check if account is locked
        if user.get("locked_until") and user["locked_until"] > datetime.utcnow():
            return None

        # Verify password
        stored_hash = user["password_hash"]
        if isinstance(stored_hash, str):
            stored_hash = stored_hash.encode('utf-8')

        if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
            # Reset failed attempts and update last login
            self.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {
                    "failed_attempts": 0,
                    "last_login": datetime.utcnow(),
                    "locked_until": None
                }}
            )

            # Return user dict (convert ObjectId to string)
            result = {
                "user_id": user["user_id"],
                "username": user["username"],
                "email": user["email"],
                "calibration_complete": user.get("calibration_complete", False),
                "is_active": user["is_active"]
            }
            return result
        else:
            # Increment failed attempts
            failed_attempts = user.get("failed_attempts", 0) + 1
            locked_until = None

            if failed_attempts >= 5:
                locked_until = datetime.utcnow() + timedelta(minutes=15)

            self.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {
                    "failed_attempts": failed_attempts,
                    "locked_until": locked_until
                }}
            )
            return None

    def create_session(self, user_id: int, ip_address: str, user_agent: str) -> str:
        """Create a new session"""
        session_id = hashlib.sha256(
            f"{user_id}{datetime.utcnow()}{ip_address}".encode()
        ).hexdigest()

        session_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "is_active": True,
            "ip_address": ip_address,
            "user_agent": user_agent
        }

        self.sessions.insert_one(session_doc)
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session information with user data"""
        pipeline = [
            {"$match": {"session_id": session_id, "is_active": True}},
            {"$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "user_id",
                "as": "user"
            }},
            {"$unwind": "$user"},
            {"$project": {
                "_id": 0,
                "session_id": 1,
                "user_id": 1,
                "created_at": 1,
                "last_activity": 1,
                "is_active": 1,
                "ip_address": 1,
                "user_agent": 1,
                "username": "$user.username",
                "calibration_complete": "$user.calibration_complete"
            }}
        ]

        results = list(self.sessions.aggregate(pipeline))
        return results[0] if results else None

    def update_session_activity(self, session_id: str):
        """Update last activity timestamp for session"""
        self.sessions.update_one(
            {"session_id": session_id, "is_active": True},
            {"$set": {"last_activity": datetime.utcnow()}}
        )

    def end_session(self, session_id: str):
        """End an active session"""
        self.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"is_active": False}}
        )

    def store_behavioral_data(self, user_id: int, session_id: str, data_type: str,
                              features: Dict, raw_data: Dict = None,
                              confidence_score: float = None, anomaly_score: float = None):
        """Store behavioral biometric data"""
        doc = {
            "user_id": user_id,
            "session_id": session_id,
            "timestamp": datetime.utcnow(),
            "data_type": data_type,
            "features": features,
            "raw_data": raw_data,
            "confidence_score": confidence_score,
            "anomaly_score": anomaly_score
        }
        self.behavioral_data.insert_one(doc)

    def get_user_behavioral_data(self, user_id: int, data_type: str = None,
                                  limit: int = 1000) -> List[Dict]:
        """Get behavioral data for a user"""
        query = {"user_id": user_id}
        if data_type:
            query["data_type"] = data_type

        cursor = self.behavioral_data.find(
            query,
            {"_id": 0}
        ).sort("timestamp", DESCENDING).limit(limit)

        results = []
        for doc in cursor:
            results.append(doc)

        return results

    def log_auth_event(self, user_id: int, session_id: str, event_type: str,
                       event_data: Dict, ip_address: str = None):
        """Log authentication events"""
        doc = {
            "user_id": user_id,
            "session_id": session_id,
            "event_type": event_type,
            "event_data": event_data,
            "timestamp": datetime.utcnow(),
            "ip_address": ip_address
        }
        self.auth_events.insert_one(doc)

    def update_calibration_status(self, user_id: int, is_complete: bool):
        """Update user calibration status"""
        self.users.update_one(
            {"user_id": user_id},
            {"$set": {"calibration_complete": is_complete}}
        )

    def update_model_metadata(self, user_id: int, accuracy: float = None,
                              training_samples: int = None, drift_detected: bool = None):
        """Update model metadata"""
        update_fields = {}

        if accuracy is not None:
            update_fields["model_accuracy"] = accuracy
            update_fields["last_trained"] = datetime.utcnow()

        if training_samples is not None:
            update_fields["training_samples"] = training_samples

        if drift_detected is not None:
            update_fields["drift_detected"] = drift_detected
            if drift_detected:
                update_fields["drift_timestamp"] = datetime.utcnow()

        if update_fields:
            self.model_metadata.update_one(
                {"user_id": user_id},
                {"$set": update_fields},
                upsert=True
            )

    def get_model_metadata(self, user_id: int) -> Optional[Dict]:
        """Get model metadata for user"""
        result = self.model_metadata.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        return result

    def cleanup_old_sessions(self, timeout_hours: int = 24):
        """Clean up old inactive sessions"""
        cutoff_time = datetime.utcnow() - timedelta(hours=timeout_hours)
        self.sessions.update_many(
            {"last_activity": {"$lt": cutoff_time}, "is_active": True},
            {"$set": {"is_active": False}}
        )

    def get_user_stats(self, user_id: int) -> Dict:
        """Get user statistics"""
        # Get behavioral data counts
        total_samples = self.behavioral_data.count_documents({"user_id": user_id})
        keystroke_samples = self.behavioral_data.count_documents(
            {"user_id": user_id, "data_type": "keystroke"}
        )
        mouse_samples = self.behavioral_data.count_documents(
            {"user_id": user_id, "data_type": "mouse"}
        )

        # Get session counts
        total_sessions = self.sessions.count_documents({"user_id": user_id})
        active_sessions = self.sessions.count_documents(
            {"user_id": user_id, "is_active": True}
        )

        # Get recent anomalies (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_anomalies = self.auth_events.count_documents({
            "user_id": user_id,
            "event_type": "anomaly",
            "timestamp": {"$gt": seven_days_ago}
        })

        return {
            "total_samples": total_samples,
            "keystroke_samples": keystroke_samples,
            "mouse_samples": mouse_samples,
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "recent_anomalies": recent_anomalies
        }

    def delete_user_data(self, user_id: int) -> int:
        """Delete all data for a user. Returns total rows deleted."""
        deleted = 0
        deleted += self.behavioral_data.delete_many({"user_id": user_id}).deleted_count
        deleted += self.auth_events.delete_many({"user_id": user_id}).deleted_count
        deleted += self.sessions.delete_many({"user_id": user_id}).deleted_count
        deleted += self.model_metadata.delete_many({"user_id": user_id}).deleted_count
        deleted += self.users.delete_many({"user_id": user_id}).deleted_count
        return deleted

    def get_all_users(self) -> List[Dict]:
        """Get all users for admin panel"""
        cursor = self.users.find(
            {},
            {"_id": 0, "password_hash": 0, "salt": 0}
        ).sort("created_at", DESCENDING)
        return list(cursor)

    def get_recent_auth_events(self, limit: int = 50) -> List[Dict]:
        """Get recent auth events for admin panel"""
        cursor = self.auth_events.find(
            {},
            {"_id": 0}
        ).sort("timestamp", DESCENDING).limit(limit)
        return list(cursor)