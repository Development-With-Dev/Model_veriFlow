import json
import msgpack
import time
import logging
import asyncio
import redis.asyncio as redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REDIS_URL = "redis://localhost:6379"

async def process_telemetry():
    """Runs a continuous loop reading from redis streams and doing ML evaluation"""
    redis_client = redis.from_url(REDIS_URL, decode_responses=False)
    logger.info("Inference Worker Started, waiting for telemetry...")
    
    last_id = '$' # Read only new messages
    
    try:
        while True:
            # Block for up to 1 second
            streams = await redis_client.xread({"telemetry:stream": last_id}, count=10, block=1000)
            
            for stream, messages in streams:
                for message_id, message_data in messages:
                    last_id = message_id
                    try:
                        session_id = message_data[b"session_id"].decode("utf-8")
                        raw_payload = message_data[b"payload"]
                        payload = msgpack.unpackb(raw_payload, raw=False)
                        
                        logger.info(f"Processing telemetry for session {session_id}")
                        
                        # Simulate ML inference processing time
                        # await asyncio.sleep(0.01)
                        
                        # Dummy risk generation evaluating realistic anomalies
                        features = payload.get("features", {})
                        
                        risk_score = 10 # Base clean score
                        
                        # 1. Abnormal Keystroke Speed / Bot-like typing
                        if "typing_speed_wpm" in features and features["typing_speed_wpm"] > 250:
                            risk_score += 60 # Way too fast, almost certainly a bot or script
                            
                        # 2. Abnormal Keystroke Variance (Erratic typing or zero variance meaning macro)
                        if "flight_time_variance" in features and features["flight_time_variance"] > 100:
                            risk_score += 35 
                            
                        # 3. Abnormal Mouse Velocity or Curvature (Jitter/Bot)
                        if "velocity_mean" in features and features["velocity_mean"] > 2.0:
                            risk_score += 50
                            
                        if "curvature_mean" in features and features["curvature_mean"] > 0.1:
                            risk_score += 45
                            
                        # Cap at 99
                        risk_score = min(risk_score, 99)
                        
                        report = {
                            "session_id": session_id,
                            "authenticity_score": (100 - risk_score) / 100.0,
                            "confidence": 0.95,
                            "risk_score": risk_score,
                            "tier": "ALLOW" if risk_score < 40 else "BLOCK",
                            "timestamp": time.time()
                        }
                        
                        # Publish back to fast pubsub for Admin Dashboard
                        await redis_client.publish("risk_scores", json.dumps(report))
                        
                    except Exception as e:
                        logger.error(f"Error processing message {message_id}: {e}")
                        
    except asyncio.CancelledError:
        logger.info("Worker shutting down")
    finally:
        await redis_client.close()

if __name__ == "__main__":
    try:
        asyncio.run(process_telemetry())
    except KeyboardInterrupt:
        pass
