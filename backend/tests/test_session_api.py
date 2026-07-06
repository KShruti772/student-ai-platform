from fastapi.testclient import TestClient
from app import app


def test_session_endpoint():
    client = TestClient(app)
    r = client.get('/api/session/default')
    assert r.status_code == 200
    data = r.json()
    assert 'session_id' in data


def test_timeline_endpoint():
    client = TestClient(app)
    r = client.get('/api/session/default/timeline')
    assert r.status_code == 200
    data = r.json()
    assert 'events' in data and 'messages' in data
