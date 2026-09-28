# Take — CLAUDE.md

REC on the Home hero. A visitor records up to 6 seconds of play on the grid
(pointer path, clicks, discipline hover) and gets a 1080×1350, 60 fps H.264
clip of it, rendered and encoded on their device, ready for the share sheet.

## How it works

1. **Record input, not pixels** (`useTakeRecorder`). Pointer samples in NDC,
   click pulses, focus changes, all timestamped from REC, plus the scene clock
   at REC (`TakeDirector.now()`). Recording costs nothing per frame.
2. **Develop offline** (`ImmersiveScene` → `DirectorBridge`). The canvas's
   `frameloop` prop goes `'never'` (via `setDeveloping`, because the Canvas
   re-applies that prop on every render), the renderer takes the export size
   at DPR 1, the R3F clock is held stopped (`autoStart = false`, or its first
   `getDelta()` restarts it and pollutes `advance()` timestamps), and each
   frame is stepped by hand with `advance()` at exactly 1/60 s. A 1 s pre-roll
   settles trails and ripples before frame 0. Recorded input goes in through
   `state.pointer` and `SceneMotion.focusOverride` / `pulseOverride`.
   Afterwards size, DPR, pointer, events and the scene clock are restored, so
   the live hero resumes exactly where the visitor left it.
3. **Composite + encode** (`develop.ts`, lazy chunk with mediabunny). Each
   rendered frame is copied to a 2D master canvas *in the same task* (the
   WebGL buffer is not preserved), the DOM layers the canvas lacks are drawn
   on (hero fades, CODE / VISION / DESIGN with the page's focus behaviour, a
   slate with take number, timecode and `2XEB.ME`), and `CanvasSource.add`
   encodes it. MP4 with fast start; codec falls back avc → vp9 → av1.
4. **Darkroom** (`TakeOverlay`). The master canvas is shown while it develops,
   then the clip loops with Share (Web Share with files, straight to IG/X on
   phones) or Save .mp4.

## Rules

- Frame-rate independence (see `src/3d/CLAUDE.md`) is what makes this work:
  every rate in the scene is per second and reads `SceneMotion`, so stepping
  at a locked 1/60 s is a faithful replay. Don't add motion that reads
  `state.clock` or assumes a frame is 1/60 s.
- Phones render bloom while developing (offline, so cost doesn't matter).
- Feature-gated on `VideoEncoder` + `VideoFrame` (`canDevelop`). No fallback
  path: if WebCodecs isn't there, REC isn't shown.
- mediabunny stays in the lazy `TakeOverlay` chunk. Home imports only
  `types.ts`, the hook and `TakeControl`.
- The red REC dot is the one colour outside the site palette: the universal
  "recording" signifier, and this is a filmmaker's site.
