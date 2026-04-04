import pytest
import msgpack
import json
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from fastapi_app import app

client = TestClient(app)

@pytest.fixture
def mock_redis():
    with patch("fastapi_app.redis_client", new_callable=AsyncMock) as redis_mock:
        yield redis_mock

def test_websocket_telemetry(mock_redis):
    payload = {
        "features": { "hold_time_mean": 100.5, "velocity_mean": 2.1 },
        "timestamp": 123456789
    }
    binary_payload = msgpack.packb(payload)

    with client.websocket_connect("/ws/telemetry?session_id=test_session") as websocket:
        websocket.send_bytes(binary_payload)
        
    assert mock_redis.xadd.called
    args, kwargs = mock_redis.xadd.call_args
    assert args[0] == "telemetry:stream"
    
    redis_data = args[1]
    assert redis_data[b"session_id"] == b"test_session"
    unpacked_redis_payload = msgpack.unpackb(redis_data[b"payload"])
    assert unpacked_redis_payload == payload

@pytest.mark.asyncio
async def test_sse_endpoint_ping(mock_redis):
    mock_pubsub = AsyncMock()
    mock_pubsub.subscribe = AsyncMock()
    mock_pubsub.unsubscribe = AsyncMock()
    # First next() yields ping (None message), second raises exception to break loop
    mock_pubsub.get_message.side_effect = [None, Exception("Stop loop")]
    mock_redis.pubsub.return_value = mock_pubsub

    # Since it's a streaming response, we can just consume one item
    with client.stream("GET", "/api/risk-stream") as response:
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
        lines = list(response.iter_lines())
        # The generator will yield 'event: ping' and 'data: keepalive' initially, 
        # then error out and close the stream.
        assert "event: ping" in lines
        assert "data: keepalive" in lines
