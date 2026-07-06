# Frontend Timeline & Replay UI

Files added:
- `frontend/components/timeline/Timeline.tsx` — Timeline component with token playback, scrubber, logs and a basic latency/tokens visual.

How it works:
- On mount the component calls `/api/session/{sessionId}/timeline` to load persisted events and messages.
- The component also opens a websocket at `/ws/session/{sessionId}` to receive live token and node events. Persisted events are replayed by the server after connect.
- Playback is implemented by advancing an index which controls how many tokens are shown from the assembled token stream.

Next steps:
- Add richer agent visualization using `reactflow` for workflow node execution.
- Add interactive playback controls and speed selection.
- Integrate metrics panel and charts (Recharts already in dependencies).
