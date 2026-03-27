Rate limiter is in-memory — resets on restart, no cross-instance awareness. Fine for a single server, breaks if you ever run multiple instances
Semaphore is per-process — same issue. Two instances = 2x the concurrent load on one box
No job queue — goroutines are fire-and-forget. If the server crashes mid-judge, that submission is stuck compiling/running forever with no retry