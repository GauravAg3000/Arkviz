The Clock is the single source of time for the entire simulation.
It uses the Observer (Publisher–Subscriber) pattern so multiple systems can react to the same tick.
start(), stop(), pause(), resume(), and setSpeed() all manage one underlying setInterval.
Set is used to avoid duplicate subscribers and make unsubscribe efficient.
The Clock knows nothing about packets, nodes, or routing—it only emits { tick, dt }.