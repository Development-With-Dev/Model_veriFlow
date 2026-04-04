import pytest
import asyncio
import msgpack
import json
from unittest.mock import AsyncMock, patch
from inference_worker import process_telemetry

async def run_worker_with_payload(payload_features):
    mock_redis = AsyncMock()
    raw_payload = msgpack.packb({"features": payload_features})
    
    mock_stream_data = [(b"telemetry:stream", [(b"1", {b"session_id": b"test_session", b"payload": raw_payload})])]
    mock_redis.xread = AsyncMock(side_effect=[mock_stream_data, asyncio.CancelledError("Stop loop")])
    mock_redis.publish = AsyncMock()
    
    with patch("inference_worker.redis.from_url", return_value=mock_redis):
        await process_telemetry()
        
    assert mock_redis.publish.called
    args, _ = mock_redis.publish.call_args
    return json.loads(args[1])

@pytest.mark.asyncio
async def test_normal_behavior():
    # Regular typing speed and smooth mouse tracking -> ALLOW (Base Risk 10)
    report = await run_worker_with_payload({"typing_speed_wpm": 65.0, "velocity_mean": 0.8})
    assert report["risk_score"] == 10
    assert report["tier"] == "ALLOW"

@pytest.mark.asyncio
async def test_abnormal_typing_bot():
    # Typing 300 WPM with exactly zero flight time variance (scripted bot) -> BLOCK
    report = await run_worker_with_payload({"typing_speed_wpm": 310.0, "flight_time_variance": 0.0})
    assert report["risk_score"] >= 70 # Base 10 + 60
    assert report["tier"] == "BLOCK"

@pytest.mark.asyncio
async def test_abnormal_erratic_mouse():
    # Mouse sweeping violently across screen and high typing variance -> BLOCK
    report = await run_worker_with_payload({"velocity_mean": 3.5, "flight_time_variance": 150.0})
    assert report["risk_score"] >= 95 # Base 10 + 50 + 35
    assert report["tier"] == "BLOCK"
