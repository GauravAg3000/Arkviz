# Arkviz

**Architecture Visualizer** — An interactive, browser-based distributed systems
simulator. Watch events flow through a resilient telemetry pipeline in real
time. Inject failures and see the system react — circuit breakers open, data
reroutes to fallback storage, and a self-healing daemon replays everything
once order is restored.

**No installation. No backend. Just a URL.**

---

## The 30-Second Hook

1. Open the page. A client fires events through the pipeline every few ticks.
2. Packets flow: **Client → Gateway → Redis → Worker → DB Router → PostgreSQL**.
3. Click **Fail PG** — a 3-second countdown builds anticipation.
4. PostgreSQL rejects connections. The Circuit Breaker opens after 3 failures.
5. The DB Router diverts packets to MongoDB. Queue depth grows on Mongo.
6. Click **Restore PG** — the Healer replays every buffered packet from Mongo.
7. The Circuit Breaker closes. Normal flow resumes.

---

## Layout

```
Client → Gateway → Redis → Worker → DB Router ──┬──→ PostgreSQL       (normal)
                                                  │
                                                  ├──→ MongoDB ──→ Healer ──→ PostgreSQL  (fallback)
                                                  │
                                                  └──→ DLQ            (poison)
```

The DB Router sits at the fork: normal operation routes to PostgreSQL, failure
routes to MongoDB. Poison messages bypass both and go straight to the Dead
Letter Queue. The Healer replays buffered packets from MongoDB back to
PostgreSQL once the database recovers.

---

## What It Demonstrates

| Concept | How Arkviz Shows It |
|---------|-------------------|
| **Queue-based decoupling** | Gateway returns immediately. Redis buffers. Workers consume at their own pace. Watch queue depth grow when downstream is down. |
| **Circuit Breaker** | 3 consecutive failures → CB opens. 100-tick timeout (10 s at 1× speed) → half-open probe. Success → closes. All 3 states are color-coded and animated. |
| **Fallback store** | When PostgreSQL fails, packets route to MongoDB. Queue depth on Mongo tells the story. |
| **Dead Letter Queue** | Malformed packets (poison messages) route to DLQ. The pipeline keeps running — bad data doesn't block good data. |
| **Self-healing replay** | The Healer polls MongoDB, replays to PostgreSQL once it's healthy. Watch the pending count drain. |
| **Backpressure** | Queue depth grows visibly when downstream stalls. No crash — just slower ingestion. |

---

## Failure Scenarios

| Scenario | What Happens | What to Watch |
|----------|-------------|---------------|
| Database Failure (`Fail PG`) | PG rejects connections → CB opens → packets reroute to Mongo | Mongo queue grows. CB state cycles closed → open → half_open → closed. |
| Worker Crash (`Crash Worker`) | Worker stops consuming → Redis queue grows unbounded | Redis queue number climbing. Worker node dark. |
| Poison Message (`Poison Msg`) | Bad data enters pipeline → DB Router detects → DLQ | One packet diverts to DLQ. Rest of pipeline unaffected. |

---

## Related Project: Arise

[Arise](https://github.com/gauravag3000/arise) is the real implementation of this
architecture — a Python-based telemetry ingestion pipeline with FastAPI, Redis
Streams, PostgreSQL, Circuit Breaker, MongoDB fallback, and a self-healing
Healer daemon.

Arkviz is the teaching companion. Same architecture, same failure modes, same
recovery patterns — in the browser, interactive, no installation required.
