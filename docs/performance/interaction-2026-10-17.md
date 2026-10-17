# Interaction performance, 17 October 2026

Whole-build selection repeatedly traversed the same connected component for every selected part. With the 1,700-part Aircraft grid test this one calculation took seconds. It now uses one multi-source graph traversal. Highlight materials are retained when the hovered part changes, and simulation transform synchronization uses an ID map instead of repeatedly searching the parts array.

Rigid rod and connector render geometries share picking BVHs. Hover and snap previews sample the latest pointer position once per animation frame and skip camera/manipulation drags, whose own handlers remain active. Hidden parts are excluded from hover picking. Static shadows are reused during camera movement and refreshed when geometry, visibility or simulated poses change. Geometry detail and physical collision checks are retained.

Example factories and their validation run in module workers. The gallery stays interactive while models are prepared; closing it cancels unfinished requests. Four serialized examples are retained in an LRU cache. Every load parses a fresh model, so edits cannot affect later loads. Thumbnail mesh preparation and GPU drawing still run on the main thread.

## Local measurements

Command: `node scripts/benchmarks/interaction.mjs`, Node 26.7.0 on the development Mac. These are individual CPU workload measurements, not end-to-end interaction latency or browser FPS. Timings vary with concurrent system load. Each picking run uses the same 300 rays aimed at part centers, with the first 50 excluded from timing statistics.

| Workload | Before | After |
| --- | ---: | ---: |
| 317-part selection closure | 72.6 ms | 0.2 ms |
| 1,700-part selection closure | 4,082.2 ms | 0.8 ms |
| 317-part picking, median | 0.475 ms | 0.091 ms |
| 317-part picking, p95 | 3.376 ms | 0.403 ms |
| 1,700-part picking, median | 1.692 ms | 0.393 ms |
| 1,700-part picking, p95 | 4.632 ms | 1.580 ms |

The before/after ray-hit counts match: 283 for the swept plane and 296 for the grid aircraft. BVH construction adds a one-time cost per cached geometry; this is not a reduction in model generation time. Large builds still require per-part rendering, and simulation cost depends on the mechanism and contact count. The 2,500-part limit is unchanged.

## Verification

Regression coverage includes graph changes and disconnected selections, selected-material retention and disposal, nearest mesh hits under transforms and near/far clipping, real worker-generated examples, independent cache copies, worker cancellation and startup failures.

Local browser checks: load the 1,700-part example, select all 1,700 parts, orbit while selected, hide its 290-part right-wing layer and observe 1,410 selected parts, restore the layer, load/play/pause the ball track, and cancel an unfinished plane load while retaining the ball track. No browser errors were logged during these checks.
