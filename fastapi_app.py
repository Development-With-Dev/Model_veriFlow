import os
import time
import msgpack
import json
import logging
import asyncio
from typing import Optional, Dict, Any, AsyncGenerator
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from sse_starlette.sse import EventSourceResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="VeriFlow Modern Telemetry Gateway (Local Demo Mode)")

# Allow CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's local dev, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import motor.motor_asyncio

# Initialize MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://vinayvaja2276_db_user:hQUK8VwcE6ONavbx@cluster0.ucvbuyy.mongodb.net/?appName=Cluster0")
try:
    # Attempt to read from shared .env space
    _env_p = r"c:\Projects\VeriFlow\Veriflow_app\.env.local"
    if os.path.exists(_env_p):
        with open(_env_p, "r") as f:
            for line in f:
                if line.startswith("MONGO_URL="):
                    MONGO_URL = line.split("=", 1)[1].strip()
except: pass

mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = mongo_client.veriflow_behavioral
collection = db.logs

# For local testing without Redis, we use an asyncio Queue to pass data
# from the websocket directly to the SSE stream.
risk_queue = asyncio.Queue()

@app.get("/api/stats")
async def get_historical_stats():
    try:
        # Count total sessions (docs)
        total_sessions = await collection.count_documents({})
        
        # Calculate Risk Interceptions (tier == 'BLOCK')
        risk_count = await collection.count_documents({"tier": "BLOCK"})
        
        # Calculate Average Integrity (Authenticity Score)
        pipeline = [{"$group": {"_id": None, "avg_integrity": {"$avg": "$authenticity_score"}}}]
        cursor = collection.aggregate(pipeline)
        avg_integrity = 0
        async for doc in cursor:
            avg_integrity = doc.get("avg_integrity", 0)
            
        return {
            "total_sessions": total_sessions,
            "avg_integrity": round(avg_integrity * 100, 2),
            "risk_interceptions": risk_count,
            "global_nodes": 2
        }
    except Exception as e:
        logger.error(f"Failed to fetch stats: {e}")
        return {"total_sessions": 0, "avg_integrity": 100, "risk_interceptions": 0, "global_nodes": 1}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    session_id = websocket.query_params.get("session_id", "anonymous")
    logger.info(f"WebSocket Client Connected: {session_id}")
    
    try:
        while True:
            # Expecting binary payload from client
            data = await websocket.receive_bytes()
            
            try:
                # Unpack MessagePack binary to dict
                payload = msgpack.unpackb(data, raw=False)
                logger.info(f"Unpacked Telemetry Payload Keys: {list(payload.keys())}")
                features = payload.get("features", {})
                
                # Inline Inference logic (usually handled by inference_worker.py via Redis)
                risk_score = 10 # Base clean score
                
                if "typing_speed_wpm" in features and features["typing_speed_wpm"] > 250:
                    risk_score += 60 
                if "flight_time_variance" in features and features["flight_time_variance"] > 100:
                    risk_score += 35 
                if "velocity_mean" in features and features["velocity_mean"] > 2.0:
                    risk_score += 50
                if "curvature_mean" in features and features["curvature_mean"] > 0.1:
                    risk_score += 45
                    
                risk_score = min(risk_score, 99)
                
                
                ua = payload.get("user_agent", "")
                device_type = "Desktop"
                if "iPhone" in ua or "iPad" in ua or "Mac" in ua:
                    device_type = "Apple Device"
                elif "Windows" in ua:
                    device_type = "Windows PC"
                elif "Android" in ua:
                    device_type = "Android Device"
                elif "Linux" in ua:
                    device_type = "Linux Node"
                
                # Realistic IP Mapping (Mock for demo)
                ip_prefixes = ["192.168.1.", "10.0.0.", "172.16.0.", "203.0.113."]
                import random
                mock_ip = f"{random.choice(ip_prefixes)}{random.randint(10, 250)}"
                
                # Dynamic factors based on telemetry type
                factors = []
                if "keystroke" in payload.get("sensor", ""):
                     factors = ["Flight Time", "Dwell Time", "Key Variance", "Velocity"]
                else:
                     factors = ["Curvature", "Velocity", "Smoothness", "Jitter"]
                
                # ---------------------------------- #
                # IDENTITY RESOLUTION
                user_name = payload.get("username", "Anonymous User")
                user_email = payload.get("email", "anonymous@veriflow.io")
                # ---------------------------------- #
                
                report = {
                    "id": f"evt_{random.randint(1000,9999)}",
                    "session_id": session_id,
                    "user": user_name,
                    "email": user_email,
                    "authenticity_score": (100 - risk_score) / 100.0,
                    "score": 100 - risk_score, # For backward compat in UI
                    "confidence": 0.95,
                    "risk_score": risk_score,
                    "tier": "ALLOW" if risk_score < 40 else "BLOCK",
                    "device": f"{device_type} (Verified)" if risk_score < 40 else f"{device_type} (Anomalous)",
                    "network_ip": mock_ip,
                    "factors": factors,
                    "timestamp": time.time()
                }
                
                # Put it into memory queue for the SSE endpoint
                logger.info(f"Generated Risk Report for {session_id}: {report}")
                await risk_queue.put(report)
                
                # PERSIST TO MONGODB ASYNCHRONOUSLY
                try:
                    await collection.insert_one(report.copy())
                except Exception as e:
                    logger.error(f"MongoDB Archive Failed: {e}")
                    
            except msgpack.exceptions.UnpackException:
                logger.error("Failed to unpack MessagePack payload")
            except Exception as e:
                logger.error(f"Error processing telemetry: {e}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket Client Disconnected: {session_id}")

async def local_queue_generator() -> AsyncGenerator[Dict[str, Any], None]:
    """Generator for Server-Sent Events consuming local asyncio Queue"""
    while True:
        try:
            # Wait for item with a timeout so we can still send pings
            report = await asyncio.wait_for(risk_queue.get(), timeout=1.5)
            yield {"event": "security_alert", "data": json.dumps(report)}
        except asyncio.TimeoutError:
            yield {"event": "ping", "data": "keepalive"}
        except Exception as e:
            logger.error(f"Error yielding SSE: {str(e)}")

@app.get("/api/risk-stream")
async def risk_stream(request: Request):
    """Admin SSE endpoint for pushing risk scores instantly"""
    return EventSourceResponse(local_queue_generator())

# If run directly
if __name__ == "__main__":
    import uvicorn
    # Start on 5001 to avoid hitting the Flask app running on 5000
    uvicorn.run(app, host="0.0.0.0", port=5001)
