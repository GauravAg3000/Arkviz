# Arkviz — Architecture

Arkviz is a browser-based distributed systems simulator. It visualizes how
events flow through a resilient telemetry pipeline and how the system reacts
to failures — all in real time, no backend.

It is the teaching companion to **Arise**, a real Python implementation of the
same architecture.

---

## Core Philosophy

- **Composition over inheritance.** A Node only represents a stage in the pipeline. Its behavior is provided separately, making it easy to reuse Nodes and add new behaviors without creating deep inheritance hierarchies.
- **Events over method calls.** Nodes do not call or know about other Nodes. They simply report the result of their work. The Simulation Engine decides what happens next.
- **Visual over technical.** The UI should explain the architecture by itself. Watching packets move through the pipeline should be enough to understand how the system works.
- **Separation of concerns.** Time, simulation, rendering, and UI state each have a single responsibility. Every layer focuses on one job and does not depend on the internals of the others.

---

## Core Abstractions

### Clock

The Clock is the only source of time in the simulation.

Every tick, it tells the Simulation Engine to advance the simulation by one step.
Nothing in the system updates on its own.

The Clock is responsible for:

- Emitting a tick every 100ms (configurable)
- Controlling simulation speed (0.5x, 1x, 2x, 5x)
- Supporting pause, resume, and replay through a single timer

The Clock does not know about Nodes, Packets, or routing. It only emits ticks.

### Node

A Node represents one stage in the pipeline, such as the Client, Redis, Worker, or PostgreSQL.

Every Node owns three things:

1. **State** — its current status (`Idle`, `Processing`, `Failed`, `Recovering`)
2. **Input Queue** — packets waiting to be processed
3. **Behavior** — the logic that runs on every Clock tick

A Node is only responsible for its own state and queue.

It never communicates directly with other Nodes. Instead, it performs its work and returns the result to the Simulation Engine, which decides where packets go next.

### Packet

A Packet represents a single event moving through the pipeline.

Every Packet carries:

- **Unique ID** — identifies the packet
- **Route History** — every Node it has visited with timestamps
- **Creation Timestamp** — when the packet was created
- **Status** — `in_flight`, `queued`, `processed`, or `failed`

The route history makes it possible to inspect a packet at any time.

Example:

```text
Packet #1042
Route: Client → Gateway → Redis
```

### InsertResult

`InsertResult` is the outcome returned by a Worker after processing a packet.

A Worker can return one of three results:

- `Success` — packet was stored successfully
- `ConnectionFailure` — destination could not be reached
- `InvalidData` — packet contains malformed data

The Worker does **not** decide where the packet goes next.

It simply reports the result of its work. The Simulation Engine receives the `InsertResult` and decides whether the packet should continue to PostgreSQL, be routed to MongoDB, or move to the Dead Letter Queue (DLQ).

This keeps the Worker independent of the rest of the pipeline and centralizes all routing decisions in one place.

### Event

An Event records something important that happened during the simulation.

Examples include:

- A Node changing state
- A Packet being processed
- The Circuit Breaker opening or closing
- A failure being injected

Each Event contains:

```text
time: 12:03:15
node: PostgreSQL
type: failure
message: PostgreSQL unreachable — Circuit Breaker OPEN
```

Events are displayed in the Event Log, allowing users to follow the simulation as it runs.

---

## Architecture Layers

The application is split into independent layers. Each layer has one responsibility and only communicates with the layer directly above or below it.

```
┌──────────────────────────────┐
│  React Components            │  ← draws UI
├──────────────────────────────┤
│  React Bridge (Context)      │  ← passes snapshots to React
├──────────────────────────────┤
│  Simulation Engine           │  ← runs the simulation
├──────────────────────────────┤
│  Clock                       │  ← controls time
└──────────────────────────────┘
```

### Layer 1 — Clock

The Clock is the foundation of the simulation.

Its only responsibility is to emit a tick at a fixed interval. Every other layer reacts to these ticks.

### Layer 2 — Simulation Engine (Pure TypeScript)

owns the entire simulation. On every Clock tick it:

1. Runs each Node's behavior
2. Routes packets based on `InsertResult`
3. Records events
4. Updates the simulation state
5. Produces a snapshot of the current world - `getSnapshot()`

### Layer 3 — React Bridge (Context / useSyncExternalStore)

After every simulation tick, it calls `engine.getSnapshot()` and exposes the latest snapshot through React Context (`useSyncExternalStore`).

This allows React components to render the current simulation without knowing
how the simulation works internally.

### Layer 4 — Redux (UI State Only)

Redux stores only user interface state.

Examples include:

- Selected scenario
- Simulation speed
- Selected or hovered Node
- Open or closed panels

Simulation state does **not** belong in Redux because it changes every tick,
while UI state only changes when the user interacts with the application.

### Layer 5 — React Components

React Components are responsible only for rendering the UI.

They receive data from the React Bridge and display it without containing
simulation logic.

Main components include:

- **Pipeline** — renders Nodes and connections
- **PipelineNode** — displays a single Node
- **PacketLayer** — renders moving packets
- **EventLog** — displays simulation events
- **ControlPanel** — simulation controls and failure injection
- **StatsPanel** — simulation metrics and KPIs

---

## Node Behaviors

### Client
Emits packets at a configured rate. Controls load on the system.

### Gateway
Receives from Client. Attaches metadata. Pushes to Redis. Returns immediately
— decouples ingestion from persistence.

### Redis
A queue. Does not process — holds packets. Tracks depth to visualize
backpressure.

### Worker
Consumes from Redis. Processes one packet per tick. Returns `InsertResult`.
Has configurable latency (simulates slow processing). Knows nothing about
MongoDB or DLQ.

### PostgreSQL
Accepts packets (normal path). Can be toggled to reject (simulates outage).

### MongoDB
Stores packets during PG outage, marked `pending`. Healer queries these.

### Healer
Polls MongoDB for pending packets. Inserts each into PostgreSQL. Skips
poison packets (marks `failed`) so one bad row doesn't block replay.

### Dead Letter Queue
Collects `InvalidData` packets. Count visible as a KPI.

---

## The Layout

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
                  │   Healer   │──→ replays back to PG
                  └────────────┘
```

Normal operation: packets flow left-to-right, then **up** to PostgreSQL.

Failure: packets divert **down** to MongoDB.

The spatial shift communicates "something changed" without a label.

---

## Failure Scenarios

### Database Failure
PG rejects connections. Worker returns `ConnectionFailure`. After 3 failures,
Circuit Breaker opens. Packets route to MongoDB. Restore PG → CB closes →
Healer replays.

### Slow Worker
Worker latency increases. Redis queue grows visibly. No data loss.

### Worker Crash
Worker stops consuming. Redis fills indefinitely.

### Duplicate Packet
Same packet emitted twice. Tests idempotency — not double-counted.

### Poison Message
Worker returns `InvalidData`. Packet routes to DLQ. Pipeline continues.

---

## Failure Injection

Clicking a failure button does not fail instantly. A 3-second countdown
appears:

```
Injecting...  3...  2...  1...
⚠ PostgreSQL unreachable
```

This builds anticipation — the user leans forward waiting for the impact.

---

## The Emotional Hook

On page load, one packet glows:

```
✨ Follow Packet #1042
```

It travels with a subtle glow. Hover any packet:

```
Packet #1042
Status: Queued
Current Stage: Redis
Created: 2.4s ago
Route: Client → Gateway → Redis
```

After intro, a "Track Packet" button highlights the next emitted packet.

---

## State Boundaries

| Data | Stored In | Why |
|------|-----------|-----|
| Node states, packets, events | Engine → Context | Changes 60/sec. Not for Redux |
| Scenario, speed, panels | Redux | Changes only on user click |
| Packet positions | CSS transforms | No React re-render per pixel |

---

## Guiding Principles

- Clarity first, correctness second, extensibility third, performance last.
- Don't optimize what you haven't measured.
- If you can't trace a packet through the code in one minute, the abstraction
  is wrong.

---

## Relationship to Arise

| Arise (real) | Arkviz (simulation) |
|---|---|
| FastAPI Gateway | Gateway Node |
| Redis Streams | Redis Node |
| Worker Pool + Consumer | Worker Node (InsertResult) |
| CircuitBreaker class | Same 3-state machine in TS |
| DatabaseRouter | Engine routes via InsertResult |
| PostgreSQL + asyncpg | PostgreSQL Node |
| MongoDB + MongoRepository | MongoDB Node |
| Healer daemon | Healer Node |
| DLQ stream | DLQ Node |
| DatabaseConnectionError | InsertResult.ConnectionFailure |
| InvalidDataError | InsertResult.InvalidData |
| W3C traceparent | Packet route history |
| ADR-008 backpressure | Visual queue growth |

Arkviz simplifies the teaching model: Worker returns a result, Engine routes.
Different from Arise where DatabaseRouter manages PG/CB/Mongo/DLQ directly —
teaching and implementation have different priorities.
