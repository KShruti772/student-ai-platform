from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Set, Optional
import asyncio
import json
import time
from utils.logger import get_logger

router = APIRouter()
_LOG = get_logger(__name__)


class ConnectionManager:
    """Manage websocket connections globally and per-session with basic metrics and safe send."""
    def __init__(self):
        self.global_clients: Set[WebSocket] = set()
        self.session_clients: Dict[str, Set[WebSocket]] = {}
        # metrics
        self.total_connections: int = 0
        self.disconnect_count: int = 0
        self.failed_send_count: int = 0

    async def connect(self, websocket: WebSocket, session_id: str | None = None):
        # Accept and register socket. Avoid duplicate registrations.
        await websocket.accept()
        self.total_connections += 1
        if session_id:
            s = self.session_clients.setdefault(session_id, set())
            if websocket in s:
                _LOG.debug("WebSocket already registered for session=%s: %s", session_id, websocket.client)
            else:
                s.add(websocket)
                _LOG.info("WS CONNECT session=%s client=%s session_count=%d", session_id, websocket.client, len(s))
        else:
            if websocket in self.global_clients:
                _LOG.debug("WebSocket already registered (global): %s", websocket.client)
            else:
                self.global_clients.add(websocket)
                _LOG.info("WS CONNECT global client=%s global_count=%d", websocket.client, len(self.global_clients))

    def disconnect(self, websocket: WebSocket):
        removed = False
        # Remove from sessions
        for session_id, s in list(self.session_clients.items()):
            if websocket in s:
                try:
                    s.remove(websocket)
                except KeyError:
                    pass
                removed = True
                self.disconnect_count += 1
                _LOG.info("WS DISCONNECT session=%s client=%s session_count=%d", session_id, websocket.client, len(s))
                if not s:
                    del self.session_clients[session_id]
        # Remove from global
        if websocket in self.global_clients:
            try:
                self.global_clients.remove(websocket)
            except KeyError:
                pass
            removed = True
            self.disconnect_count += 1
            _LOG.info("WS DISCONNECT global client=%s global_count=%d", websocket.client, len(self.global_clients))
        if not removed:
            _LOG.debug("WS DISCONNECT unknown socket: %s", getattr(websocket, 'client', None))

    async def broadcast(self, message: dict):
        targets = list(self.global_clients)
        _LOG.debug("Broadcasting message to %d global clients", len(targets))
        dead: List[WebSocket] = []
        for ws in targets:
            ok = await self.safe_send(ws, message)
            if not ok:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def send_to_session(self, session_id: str, message: dict):
        clients = list(self.session_clients.get(session_id, []))
        _LOG.debug("Sending message to session %s (%d clients)", session_id, len(clients))
        dead: List[WebSocket] = []
        for ws in clients:
            ok = await self.safe_send(ws, message)
            if not ok:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def safe_send(self, websocket: WebSocket, payload: dict) -> bool:
        """Send JSON payload, returning True on success, False on failure.
        Records metrics and avoids raising for common disconnects.
        """
        try:
            await websocket.send_json(payload)
            return True
        except WebSocketDisconnect:
            self.failed_send_count += 1
            _LOG.debug("WS SEND FAILED WebSocketDisconnect client=%s", getattr(websocket, 'client', None))
            return False
        except (RuntimeError, ConnectionResetError, asyncio.CancelledError) as e:
            self.failed_send_count += 1
            _LOG.debug("WS SEND FAILED %s client=%s", type(e).__name__, getattr(websocket, 'client', None))
            return False
        except Exception:
            self.failed_send_count += 1
            _LOG.exception("WS SEND FAILED unexpected error for client=%s", getattr(websocket, 'client', None))
            return False

    def get_stats(self) -> dict:
        return {
            "active_global": len(self.global_clients),
            "active_sessions": {k: len(v) for k, v in self.session_clients.items()},
            "total_connections": self.total_connections,
            "disconnect_count": self.disconnect_count,
            "failed_send_count": self.failed_send_count,
        }


manager = ConnectionManager()


async def _heartbeat_loop(ws: WebSocket, interval: int = 2):
    try:
        while True:
            payload = {"type": "heartbeat", "ts": time.time()}
            try:
                ok = await manager.safe_send(ws, payload)
                if not ok:
                    _LOG.debug("Heartbeat send failed, terminating heartbeat for client=%s", getattr(ws, 'client', None))
                    break
            except Exception:
                _LOG.debug("Heartbeat encountered exception for client=%s", getattr(ws, 'client', None))
                break
            await asyncio.sleep(interval)
    except Exception:
        # caller handles disconnect
        pass


@router.websocket("/ws/research")
async def websocket_research(websocket: WebSocket):
    _LOG.info('WS HANDLER /ws/research invoked for client: %s', getattr(websocket, 'client', None))
    await manager.connect(websocket)
    hb: Optional[asyncio.Task] = None
    try:
        hb = asyncio.create_task(_heartbeat_loop(websocket))
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                await websocket.send_text(f"ack: {data}")
            except asyncio.TimeoutError:
                # loop and let heartbeat task keep connection alive
                continue
    except WebSocketDisconnect:
        _LOG.info("WS DISCONNECT research client=%s", getattr(websocket, 'client', None))
    except Exception:
        _LOG.exception("Exception in /ws/research handler")
    finally:
        if hb:
            hb.cancel()
        manager.disconnect(websocket)


@router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    """Clients connect to receive broadcast events from the orchestrator/event bus."""
    _LOG.info('WS HANDLER /ws/events invoked for client: %s', getattr(websocket, 'client', None))
    await manager.connect(websocket)
    hb: Optional[asyncio.Task] = None
    try:
        # on connect send initial handshake and start heartbeat
        try:
            ok = await manager.safe_send(websocket, {"type": "handshake", "status": "ok"})
            if not ok:
                _LOG.info("Handshake send failed; disconnecting client=%s", getattr(websocket, 'client', None))
                return
        except Exception:
            _LOG.exception("Failed sending handshake to %s", getattr(websocket, 'client', None))
        hb = asyncio.create_task(_heartbeat_loop(websocket))
        # keep open; broadcaster will push events via manager.broadcast
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                _LOG.debug("events ws received from %s: %s", getattr(websocket, 'client', None), msg)
            except asyncio.TimeoutError:
                # no messages, loop
                continue
    except WebSocketDisconnect:
        _LOG.info("WS DISCONNECT events client=%s", getattr(websocket, 'client', None))
    except Exception:
        _LOG.exception("Exception in /ws/events handler")
    finally:
        if hb:
            hb.cancel()
        manager.disconnect(websocket)


@router.websocket("/ws/session/{session_id}")
async def websocket_session(websocket: WebSocket, session_id: str):
    """Session-scoped websocket: on connect, replay persisted session events,
    then remain connected to receive live broadcasts from the global broadcaster.
    """
    print('WS HANDLER /ws/session invoked for session:', session_id, 'client:', getattr(websocket, 'client', None))
    _LOG.info('WS HANDLER /ws/session invoked for session: %s client: %s', session_id, getattr(websocket, 'client', None))
    await manager.connect(websocket, session_id=session_id)
    hb: Optional[asyncio.Task] = None
    try:
        # replay persisted events safely
        try:
            pm = getattr(websocket.app.state, "persistent_memory", None)
            if pm is not None:
                data = pm.get_session(session_id) or {}
                events = data.get("events", []) if isinstance(data, dict) else []
                for ev in events:
                    ok = await manager.safe_send(websocket, ev)
                    if not ok:
                        _LOG.info("Client disconnected while replaying session=%s client=%s", session_id, getattr(websocket, 'client', None))
                        return
        except Exception:
            _LOG.exception("Failed to replay session events for %s", session_id)

        # send session snapshot
        try:
            ok = await manager.safe_send(websocket, {"type": "session", "session": session_id, "status": "active"})
            if not ok:
                _LOG.info("Initial session state send failed for session=%s client=%s", session_id, getattr(websocket, 'client', None))
                return
        except Exception:
            _LOG.exception("Failed to send session state to %s", session_id)
            return

        # start heartbeat loop
        hb = asyncio.create_task(_heartbeat_loop(websocket))

        # keep connection open; read to detect client messages or disconnects
        while True:
            try:
                _ = await asyncio.wait_for(websocket.receive_text(), timeout=60)
            except asyncio.TimeoutError:
                continue
            except WebSocketDisconnect:
                _LOG.info("WS DISCONNECT session=%s client=%s (receive loop)", session_id, getattr(websocket, 'client', None))
                return
            except Exception as e:
                _LOG.debug("Receive loop exception for session=%s client=%s: %s", session_id, getattr(websocket, 'client', None), e)
                return
    except WebSocketDisconnect:
        _LOG.info("WS DISCONNECT session=%s client=%s (outer)", session_id, getattr(websocket, 'client', None))
    except Exception:
        _LOG.exception("Unhandled exception in session handler for %s", session_id)
    finally:
        if hb:
            hb.cancel()
        manager.disconnect(websocket)


async def start_broadcaster(event_bus: asyncio.Queue):
    """Background broadcaster that sends heartbeats and forwards events from the internal event queue to connected websockets."""
    _LOG.info("Starting websocket broadcaster")
    while True:
        try:
            # send periodic heartbeat to all clients
            await manager.broadcast({"type": "heartbeat", "ts": time.time()})
            # forward any queued events (non-blocking)
            try:
                event = await asyncio.wait_for(event_bus.get(), timeout=1.0)
                # normalize event to dict
                if isinstance(event, str):
                    try:
                        ev = json.loads(event)
                    except Exception:
                        ev = {"raw": event}
                else:
                    ev = event
                await manager.broadcast(ev)
            except asyncio.TimeoutError:
                # no events, continue
                pass
        except Exception:
            _LOG.exception("Websocket broadcaster encountered an error; continuing loop")
        await asyncio.sleep(2)


def get_ws_stats() -> dict:
    return manager.get_stats()
