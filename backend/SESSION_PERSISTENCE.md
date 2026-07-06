# Session Persistence & Streaming Architecture

This document describes the session persistence, event streaming, and replay features added to the backend.

Storage
- Files: `backend/storage/sessions/{session_id}.json`
- Structure: JSON object with `session_id`, `messages`, `events`, `workflow_history`, `token_usage`, `metrics`, `agent_logs`, `created_ts`.
- Writes use atomic tmp -> rename and per-session `asyncio.Lock` to avoid races.

Event Bus
- `backend/core/event_bus.py` provides `EventBus.publish(event)` and `get()`.
- `publish()` timestamps events, persists to session file (if `session_id` present), and enqueues to an internal asyncio.Queue.
- `replay(session_id)` returns persisted events for a session.

Chat streaming
- `backend/api/services/chat.py` now persists every streamed chunk via `PersistentMemory.append_stream_chunk()` and stores final responses via `finalize_response()`.
- Each chunk is emitted as `token_stream` events and persisted in the session file.

APIs
- GET `/api/session/{session_id}` — full session JSON
- GET `/api/session/{session_id}/timeline` — events + messages + workflow snapshot
- GET `/api/session/{session_id}/metrics` — session metrics
- GET `/api/session/{session_id}/workflow` — node state history
- GET `/api/session/{session_id}/replay` — events + messages for replay

WebSocket
- `/ws/events` — global broadcaster (existing)
- `/ws/session/{session_id}` — session-scoped websocket which replays persisted session events on connect then remains open for live events.

Notes
- Persistence is intentionally simple (JSON files) for local-first and educational purposes. For production, swap in a DB (Redis/SQLite/Postgres) via `PersistentMemory` interface.
