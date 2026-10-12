# Performance benchmark, 12 October 2026

Local Codex in-app browser, 800 × 500 WebGL canvas, default pixel ratio 1. Synthetic flat blue-rod/white-connector grids. Median of ten rendered frames after two warm-up frames; WebGL `finish()` includes GPU completion. These are single-device measurements, not FPS guarantees. The test omits editor UI and shadow passes. Both versions use the same geometry and camera framing.

| Parts | Draw calls before → after | Render median ms before → after | Box selection ms before → after |
|---:|---:|---:|---:|
| 81 | 1,841 → 81 | 1.9 → 0.3 | 0.9 → 0.2 |
| 441 | 9,449 → 441 | 8.4 → 0.6 | 2.3 → 0.5 |
| 1,681 | 35,249 → 1,681 | 41.7 → 1.5 | 6.7 → 1.3 |
| 2,401 | 50,161 → 2,401 | 42.0 → 2.2 | 9.8 → 1.9 |

The change merges each rigid rod/connector's meshes by material and caches the result. It preserves every triangle, material, socket profile and part identity. Automated tests compare precise bounds, triangle counts and representative ray hits for every rod/connector catalog entry. Specialty parts retain their existing geometry.

Physics uses primitive collision proxies instead of every rendered triangle. The 20-part ball ramp uses 192 proxies, compared with approximately 242,000 triangles in the previous ball test. In browser playback the solver reported about 0.2 ms per display frame on this machine. This excludes rendering and is not a benchmark of many moving assemblies.

Batch shape attachment reduced a separate Node measurement of 1,681-part grid setup from approximately 5.7 seconds to tens of milliseconds. The browser measured 43.5 ms after batching, with 9,178 collision shapes. Its one-second **fully locked** simulation measured 4.7 ms total; locked bodies have little solver work, so this must not be interpreted as dynamic-structure performance. The 2,401-part grid reached the 12,000-shape physics guard. The editor part cap therefore stays at 2,500.

Reproduce the current version with `npm run dev`, then open `/benchmark.html` and press **Run benchmark**. The benchmark does not read or modify saved models. More representative moving-mechanism, contact-heavy, mobile and memory testing is required before raising limits.

Architecture: the bundled [Cannon documentation](https://pmndrs.github.io/cannon-es/docs/) describes shared worlds, rigid bodies and supported shape contacts. Compound primitive proxies support structure-to-structure contact that the previous static triangle-mesh ball test did not provide. Render detail and approximate physics geometry are intentionally separate.
