# Arkviz

**Architecture Visualizer** — An interactive, browser-based distributed systems
simulator. Watch events flow through a resilient telemetry pipeline in real
time. Introduce failures and see the system react — circuit breakers open,
data reroutes to fallback storage, and a self-healing daemon replays everything
once order is restored.

**No installation. No backend. Just a URL.**

---

## The 30-Second Hook

1. Open the page. 100 clients fire events through the pipeline.
2. Packets flow: **Client → Gateway → Redis → Worker → PostgreSQL**.
3. Click **Database Failure** — a 3-second countdown builds anticipation.
4. PostgreSQL goes dark. The Circuit Breaker opens.
5. Packets **drop downward** to MongoDB. The fallback path lights up.
6. Click **Restore** — the Healer replays every buffered packet.
7. The Circuit Breaker closes. Normal flow resumes.

You understand system resilience without reading documentation.

---

## Architecture

```
                ┌──────────────┐
                │  PostgreSQL   │   ← normal path: upward
                └──────▲───────┘
                       │
Client → Gateway → Redis → Worker
                       │
                  ┌────▼───────┐   ← failure path: downward
                  │   MongoDB   │
                  └────┬───────┘
                       │
                  ┌────▼───────┐
                  │   Healer   │──→ replays back to PostgreSQL
                  └────────────┘
```

The layout is the interface. Packets flowing upward = normal operation. Packets
flowing downward = failure mode. The spatial shift tells the story without
words.

---

## What It Demonstrates

| Concept | How Arkviz Shows It |
|---------|-------------------|
| **Queue-based decoupling** | Gateway returns immediately. Redis buffers. Workers consume at their own pace. Watch queue depth grow when workers slow down. |
| **Circuit Breaker** | 3 consecutive failures → CB opens. 10-second timeout → half-open probe. Success → closes. All 3 states are color-coded and animated. |
| **Fallback store** | When PostgreSQL fails, packets route to MongoDB. The visual fork makes this obvious without labels. |
| **Dead Letter Queue** | Malformed packets (poison messages) route to DLQ. The pipeline keeps running — bad data doesn't block good data. |
| **Self-healing replay** | The Healer polls MongoDB, replays to PostgreSQL once it's healthy. Watch the pending count drain. |
| **Idempotency** | Duplicate packet scenario tests at-least-once delivery semantics. |
| **Backpressure** | Queue depth grows visibly when downstream slows. No crash — just slower ingestion. |

---

## Failure Scenarios

| Scenario | What Happens | What to Watch |
|----------|-------------|---------------|
| Database Failure | PG rejects connections → CB opens → packets reroute to Mongo | The downward fork. Queue depth stabilizes. |
| Slow Worker | Worker latency spikes → Redis queue grows | Queue number climbing. Packets accumulating. |
| Worker Crash | Worker stops consuming → Redis fills | Queue grows unbounded. Worker node dark. |
| Duplicate Packet | Same packet emitted twice | Both processed. No double-counting. |
| Poison Message | Bad data enters pipeline → Worker rejects → DLQ | One packet diverts to DLQ. Rest continue. |

---

## Related Project: Arise

[Arise](https://github.com/gauravag3000/arise) is the real implementation of this
architecture — a Python-based telemetry ingestion pipeline with FastAPI, Redis
Streams, PostgreSQL, Circuit Breaker, MongoDB fallback, and a self-healing
Healer daemon.

Arkviz is the teaching companion. Same architecture, same failure modes, same
recovery patterns — in the browser, interactive, no installation required.

