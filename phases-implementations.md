# Arkviz — Phased Implementation

A browser-based distributed systems simulator built incrementally.

---

## Phase 1 — Project Skeleton

- Scaffold Vite + React + TypeScript
- Define core data models (`Packet`, `Node`, `NodeState`, `InsertResult`)
- Build the static pipeline layout
- Render Nodes and SVG connections

---

## Phase 2 — Clock

- Implement the simulation Clock
- Add play/pause and speed controls
- Drive the simulation through ticks
- Display simulation time

---

## Phase 3 — Packets

- Generate packets from the Client
- Animate packet movement through the pipeline
- Track packet route history
- Visualize packet lifecycle

---

## Phase 4 — Simulation Core

- Build the Simulation Engine
- Implement Node behaviors
- Add packet queues and routing
- Integrate Engine with React snapshots

---

## Phase 5 — Failure Injection

- Build the Chaos Controller
- Inject PostgreSQL and Worker failures
- Simulate latency and crashes
- Add countdown-based failure injection

---

## Phase 6 — Circuit Breaker

- Implement the Circuit Breaker state machine
- Track consecutive failures
- Support Closed → Open → Half-Open transitions
- Visualize breaker state

---

## Phase 7 — MongoDB & Healer

- Implement MongoDB fallback storage
- Build the Healer replay loop
- Replay pending packets after recovery
- Visualize replay progress

---

## Phase 8 — Dead Letter Queue

- Add the DLQ
- Route poison packets
- Isolate invalid data
- Track DLQ metrics

---

## Phase 9 — Observability & UX

- Build the Event Log
- Add Stats Panel and KPIs
- Implement packet tracking and tooltips
- Polish animations and visual feedback

---

## Phase 10 — Performance

- Profile rendering and simulation
- Reduce unnecessary React re-renders
- Optimize packet animations
- Add FPS and debugging tools

--- 

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "transparent",
    "primaryColor": "#1E293B",
    "primaryTextColor": "#E2E8F0",
    "primaryBorderColor": "#38BDF8",
    "lineColor": "#60A5FA",
    "secondaryColor": "#312E81",
    "tertiaryColor": "#111827",
    "clusterBkg": "#111827",
    "clusterBorder": "#7C3AED",
    "edgeLabelBackground": "#0B1020",
    "fontFamily": "Inter, Arial"
  }
}}%%

flowchart LR

subgraph Phase1
A[Pipeline UI]
end

subgraph Phase2
A --> B[Clock]
end

subgraph Phase3
B --> C[Packets]
end

subgraph Phase4
C --> D[Simulation Engine]
D --> E[Nodes]
end

subgraph Phase5
E --> F[Chaos Controller]
end

subgraph Phase6
F --> G[Circuit Breaker]
end

subgraph Phase7
G --> H[MongoDB]
H --> I[Healer]
end

subgraph Phase8
G --> J[DLQ]
end

subgraph Phase9
D --> K[Event Log]
D --> L[Stats]
end

subgraph Phase10
L --> M[Performance Tuning]
end

style A fill:#0F172A,stroke:#38BDF8,stroke-width:3px,color:#F8FAFC
style B fill:#0F172A,stroke:#38BDF8,stroke-width:3px,color:#F8FAFC
style C fill:#0F172A,stroke:#38BDF8,stroke-width:3px,color:#F8FAFC
style D fill:#312E81,stroke:#8B5CF6,stroke-width:4px,color:#FFFFFF
style E fill:#0F172A,stroke:#38BDF8,stroke-width:3px,color:#F8FAFC
style F fill:#111827,stroke:#A855F7,stroke-width:3px,color:#FFFFFF
style G fill:#111827,stroke:#EC4899,stroke-width:4px,color:#FFFFFF
style H fill:#064E3B,stroke:#10B981,stroke-width:3px,color:#FFFFFF
style I fill:#14532D,stroke:#22C55E,stroke-width:3px,color:#FFFFFF
style J fill:#3F1D1D,stroke:#EF4444,stroke-width:3px,color:#FFFFFF
style K fill:#1F2937,stroke:#60A5FA,stroke-width:3px,color:#FFFFFF
style L fill:#1F2937,stroke:#60A5FA,stroke-width:3px,color:#FFFFFF
style M fill:#4C1D95,stroke:#A855F7,stroke-width:4px,color:#FFFFFF
```