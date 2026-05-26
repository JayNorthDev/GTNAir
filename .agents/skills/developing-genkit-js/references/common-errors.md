# Common Errors & Pitfalls

## When Typecheck Fails

**Before searching source code or docs**, check the sections below. Many type errors are caused by deprecated APIs or incorrect imports.

## Genkit v1.x vs Pre-1.0 Migration

Genkit v1.x introduced significant API changes. This section covers critical syntax updates.

### Package Imports

- **Correct (v1.x)**: Import core functionality (zod, genkit) from the main `genkit` package and plugins from their specific packages.
  ```ts
  import { z, genkit } from 'genkit';
  import { googleAI } from '@genkit-ai/google-genai';
  ```

- **Incorrect (Pre-1.0)**: Importing from `@genkit-ai/ai`, `@genkit-ai/core`, or `@genkit-ai/flow`. These packages are internal/deprecated for direct use.
  ```ts
  import { genkit } from "@genkit-ai/core"; // INCORRECT
  import { defineFlow } from "@genkit-ai/flow"; // INCORRECT
  ```

### Model References

- **Correct**: Use plugin-specific model factories or string identifiers (prefaced by plugin name).
  ```ts
  // Using model factory (v1.x - Preferred)
  await ai.generate({ model: googleAI.model('gemini-2.5-flash'), ... });

  // Using string identifier
  await ai.generate({ model: 'googleai/gemini-2.5-flash', ...});
  // Or
  await ai.generate({ model: 'vertexai/gemini-2.5-flash', ...});
  ```
- **Incorrect**: Using imported model objects directly or string identifiers without plugin name.
  ```ts
  await ai.generate({ model: gemini15Pro, ... }); // INCORRECT (Pre-1.0)
  await ai.generate({ model: 'gemini-2.5-flash', ... }); // INCORRECT (No plugin prefix)
  ```

### Model Selection (Gemini)

- **Preferred**: Use `gemini-2.5-*` models for best performance and features.
  ```ts
  model: googleAI.model('gemini-2.5-flash') // PREFERRED
  ```
- **DEPRECATED**: `gemini-1.5-*` models are deprecated and will throw errors.
  ```ts
  model: googleAI.model('gemini-1.5-flash') // ERROR (Deprecated)
  ```

### Response Access

- **Correct (v1.x)**: Access properties directly.
  ```ts
  response.text; // CORRECT
  response.output; // CORRECT
  ```
- **Incorrect (Pre-1.0)**: Calling as methods.
  ```ts
  response.text(); // INCORRECT
  response.output(); // INCORRECT
  ```

### Streaming Generation

- **Correct (v1.x)**: Do NOT await `generateStream`. Iterate over `stream` directly. Await `response` property for final result.
  ```ts
  const {stream, response} = ai.generateStream(...); // NO await here
  for await (const chunk of stream) { ... }          // Iterate stream
  const finalResponse = await response;              // Await response property
  ```
- **Incorrect (Pre-1.0)**: Calling stream as a function or awaiting the generator incorrectly.
  ```ts
  for await (const chunk of stream()) { ... } // INCORRECT
  await response();                           // INCORRECT
  ```

### Initialization

- **Correct (v1.x)**: Instantiate `genkit`.
  ```ts
  const ai = genkit({ plugins: [...] });
  ```
- **Incorrect (Pre-1.0)**: Global configuration.
  ```ts
  configureGenkit({ plugins: [...] }); // INCORRECT
  ```

### Flow Definitions

- **Correct (v1.x)**: Define flows on the `ai` instance.
  ```ts
  ai.defineFlow({...}, (input) => {...});
  ```
- **Incorrect (Pre-1.0)**: Importing `defineFlow` globally.
  ```ts
  import { defineFlow } from "@genkit-ai/flow"; // INCORRECT

You should never import `@genkit-ai/flow`, `@genkit-ai/ai` or `@genkit-ai/core` packages directly.

## Zod & Schema Errors

- **Import Source**: ALWAYS use `import { z } from "genkit"`.
  - Using `zod` directly from `zod` package may cause instance mismatches or compatibility issues.
- **Supported Types**: Stick to basic types: scalar (`string`, `number`, `boolean`), `object`, and `array`.
  - Avoid complex Zod features unless strictly necessary and verified.
- **Descriptions**: Always use `.describe('...')` for fields in output schemas to guide the LLM.

## Tool Usage

- **Tool Not Found**: Ensure tools are registered in the `tools` array of `generate` or provided via plugins.
- **MCP Tools**: Use the `ServerName:tool_name` format when referencing MCP tools.

## Multimodal & Image Generation

- **Missing responseModalities**: When using image generation models (like `gemini-2.5-flash-image`), you **MUST** specify the response modalities in the config.
  ```ts
  config: {
    responseModalities: ["TEXT", "IMAGE"]
  }
  ```
  Failure to do so will result in errors or incorrect output format.

## Audio & Speech Generation

- **Raw PCM Data vs MP3**: Some providers (e.g., Google GenAI) return raw PCM data, while others (e.g., OpenAI) return MP3.
  - **DO NOT assume MP3 format.**
  - **DO NOT embed raw PCM in HTML audio tags.**
  - **Action**: Run `genkit docs:search "speech audio"` to find provider-specific conversion steps (e.g., PCM to WAV).

---

# GTNPlay Application — Resolved Bugs & Prevention Patterns

> **Purpose**: This section documents specific, non-obvious bugs encountered during development of the GTNPlay IPTV streaming app — particularly around the video player lifecycle, PIP mode, proxy architecture, and React state management. Each entry describes the **symptom**, the **root cause**, and the **exact solution** implemented. Agents MUST consult these before modifying the related areas.

---

## BUG-001: Background Audio Continues After Component Unmount / Channel Switch

### Symptom
When switching channels or closing the player, audio from the **previous** stream would continue playing in the background, resulting in overlapping audio from two different streams.

### Root Cause
The `video.js` player instance was not being properly disposed when the React component unmounted or when the `useEffect` that creates the player re-ran due to a channel URL change. Video.js maintains internal media elements and event listeners that persist beyond React's DOM lifecycle — simply removing the `<video>` DOM element does NOT stop playback.

### Solution
The player initialization `useEffect` (keyed on `channel?.url`) MUST include a cleanup function that explicitly disposes the video.js player:

```tsx
// src/components/player/VideoPlayer.tsx — the channel effect
useEffect(() => {
  if (!channel?.url || !containerRef.current) return;

  // ... player creation code ...
  const player = videojs(videoElement, options);
  playerRef.current = player;

  // CRITICAL: cleanup on unmount or channel change
  return () => {
    if (player && !player.isDisposed()) {
      player.dispose(); // Stops playback, removes elements, unbinds events
    }
    // Also clean up all timers
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    if (channelWheelTimerRef.current) clearTimeout(channelWheelTimerRef.current);
    if (volumeOsdTimerRef.current) clearTimeout(volumeOsdTimerRef.current);
  };
}, [channel?.url, /* other deps */]);
```

### Prevention Rules
1. **ALWAYS** call `player.dispose()` in cleanup — never rely on DOM removal alone.
2. **ALWAYS** guard with `!player.isDisposed()` to prevent double-dispose errors.
3. **ALWAYS** clear ALL `setTimeout`/`setInterval` refs in the same cleanup function.
4. The `handleRetry` function also disposes before recreating — ensure that path does the same.

---

## BUG-002: Datacenter IP Blocking Due to Server-Side `/api/proxy` Route

### Symptom
When the app was deployed to Vercel/Firebase App Hosting, many IPTV streams that worked locally would fail with HTTP 403 or simply time out. The same streams worked perfectly in VLC on the user's local machine.

### Root Cause
The original architecture routed all HLS stream requests through a Next.js API route (`/api/proxy/route.ts`) that acted as a server-side relay:
```
Browser → /api/proxy?url=http://stream.example.com/live.m3u8 → Server fetches → returns to client
```
This caused the stream provider to see requests coming from **datacenter IPs** (Vercel/GCP edge nodes) instead of residential IPs. Many IPTV providers actively block datacenter IP ranges using GeoIP databases (MaxMind, IP2Location) that flag cloud provider ASNs.

Additional problems with the proxy approach:
- `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'` — globally disabled SSL validation, a security hazard.
- The proxy buffered entire responses via `response.arrayBuffer()` instead of streaming, causing high memory usage and latency.
- Each `.ts` video segment required a separate proxy round-trip, multiplying latency.

### Solution
**Remove the proxy entirely.** Let the browser's native HLS engine (via video.js + VHS) fetch stream segments directly:

```tsx
// CORRECT: Direct URL to the HLS manifest
sources: [{ src: channel.url, type: 'application/x-mpegURL' }]

// INCORRECT: Routing through server-side proxy
sources: [{ src: `/api/proxy?url=${encodeURIComponent(channel.url)}`, type: 'application/x-mpegURL' }]
```

The `/api/proxy/route.ts` file still exists in the codebase but is **orphaned** — no code references it. It should be deleted.

### Prevention Rules
1. **NEVER** proxy IPTV/HLS streams through the deployment server. Always use direct URLs.
2. The browser fetches from the user's residential IP, which is accepted by stream providers.
3. CORS is not an issue for HLS because video.js VHS uses `<video>` element src which is not subject to CORS.
4. If a stream truly needs CORS headers, the fix belongs on the stream provider side, not a proxy.

---

## BUG-003: State Resets Unmounting the PIP Player (View Change Causes Full Remount)

### Symptom
When the user navigated away from the "player" view to "home", "favorites", or "categories", the video player would completely restart — losing the current playback position, reloading the stream, and causing a visible flash/interruption. The PIP (Picture-in-Picture) mini-player was supposed to keep playing seamlessly.

### Root Cause (Earlier Architecture)
The `VideoPlayer` component was conditionally rendered inside a `{view === 'player' && <VideoPlayer ... />}` block. When `view` changed, React unmounted the entire component, destroying the video.js instance and all its state. On navigating back, a brand-new component was mounted and the stream was re-fetched from scratch.

### Solution
**Keep `VideoPlayer` always mounted.** Control its visual mode via a prop, not conditional rendering:

```tsx
// src/app/page.tsx — CORRECT: Always mounted, prop controls PIP vs full
<VideoPlayer 
  channel={selectedChannel}
  isPip={view !== 'player'}  // PIP when not on the player view
  onExpand={() => setView('player')}
  onClose={() => setSelectedChannel(null)}
  // ... other props
/>
```

The component internally switches between full-screen layout and a fixed-position PIP window based on `isPip`:

```tsx
// src/components/player/VideoPlayer.tsx
const pipStyle: React.CSSProperties = (isPip && !isFullscreen)
  ? {
      position: 'fixed',
      right: `${position.x}px`,
      bottom: `${position.y}px`,
      width: isMinimized ? '220px' : `${pipWidth}px`,
      height: isMinimized ? '48px' : `${pipWidth / (16 / 9)}px`,
      zIndex: 100,
    }
  : {};
```

### Prevention Rules
1. **NEVER** conditionally render `<VideoPlayer>` based on view/route state. It must be always-mounted.
2. Use `isPip` prop to toggle visual presentation — the video.js instance stays alive.
3. Closing the player is done by setting `selectedChannel` to `null`, which causes `if (!channel) return null;` inside the component — this IS an intentional unmount that triggers proper cleanup via the `useEffect` return.
4. The `channel?.url` key on the main `useEffect` means the player only re-creates when the actual stream URL changes, NOT when PIP mode toggles.

---

## BUG-004: Stale Closures in Window Event Handlers (Drag/Resize/Seek)

### Symptom
Progress bar seeking and PIP window dragging/resizing would use outdated values. For example:
- Seeking would jump to a stale position.
- The "is locked" check during keyboard shortcuts would use an old `isLocked` value.
- PIP drag would use outdated position coordinates.

### Root Cause
Event handlers attached to `window` (via `addEventListener` in `useEffect`) capture the state values at the time the effect ran. If React state updates, the handler still has the stale closure value unless the effect re-runs and re-attaches.

### Solution
Use **refs** (not state) for values that window event handlers need to read. Update both the ref and the state simultaneously:

```tsx
// Declare both ref and state
const isDraggingRef = useRef(false);
const [isDragging, setIsDragging] = useState(false);
const isLockedRef = useRef(false);

// When updating, set BOTH:
const handleToggleLock = (e: React.MouseEvent) => {
  e.stopPropagation();
  const newLocked = !isLocked;
  isLockedRef.current = newLocked;  // ref for event handlers
  setIsLocked(newLocked);           // state for rendering
};

// In the window event handler, read the REF, not state:
useEffect(() => {
  const onMouseMove = (e: MouseEvent) => {
    if (isDraggingRef.current) seekToPosition(e.clientX); // ✅ ref
  };
  window.addEventListener('mousemove', onMouseMove);
  return () => window.removeEventListener('mousemove', onMouseMove);
}, [seekToPosition]);

// For keyboard shortcuts that check locked state:
if (!isLockedRef.current && playerRef.current) { ... }
```

The same pattern is applied to PIP drag (`pipDraggingRef`) and PIP resize (`pipResizeDirRef`).

### Prevention Rules
1. **NEVER** read React state directly inside `window.addEventListener` handlers. Use refs.
2. Use `useRef` for any value that window-level handlers need: `isDraggingRef`, `isLockedRef`, `pipDraggingRef`, `pipResizeDirRef`.
3. Keep React state (`useState`) for values that trigger re-renders (UI display).
4. When a value needs both, update both the ref and state together.

---

## BUG-005: Video.js Player `isDisposed()` Check Is Mandatory Before Any Operation

### Symptom
Random `TypeError: Cannot read properties of null` or `this.el_ is null` errors thrown from video.js internal code, particularly during fast channel switching or when the retry function fires after the component has already unmounted.

### Root Cause
Video.js operations (`.play()`, `.pause()`, `.currentTime()`, `.dispose()`, etc.) throw if called on a disposed player instance. During fast channel switching, the cleanup function disposes the old player, but async callbacks (timers in `handleRetry`, the auto-skip countdown) may still hold a reference to the disposed player and try to call methods on it.

### Solution
Always guard video.js calls:

```tsx
// Before disposal:
if (player && !player.isDisposed()) {
  player.dispose();
}

// Before any method call on playerRef:
if (playerRef.current && !playerRef.current.isDisposed()) {
  playerRef.current.currentTime(newTime);
}

// In the retry handler, dispose THEN null the ref:
if (playerRef.current && !playerRef.current.isDisposed()) {
  playerRef.current.dispose();
  playerRef.current = null;
}
```

### Prevention Rules
1. **ALWAYS** check `!player.isDisposed()` before calling any video.js method.
2. After calling `.dispose()`, immediately set `playerRef.current = null`.
3. In async callbacks (setTimeout, setInterval), re-check the ref is not null before proceeding.

---

## BUG-006: Video.js Player Creation — `innerHTML = ''` Before Appending New Video Element

### Symptom
After channel switching, two `<video>` elements would stack on top of each other inside the player container, causing double audio and visual glitching.

### Root Cause
When the `useEffect` re-runs for a new channel URL, the cleanup disposes the old video.js player (which removes its managed elements), but the raw `<video>` element created by `document.createElement` might not be fully removed. Additionally, if `video.js` fails to dispose cleanly, orphan elements remain.

### Solution
Always clear the container before appending the new video element:

```tsx
const playerContainer = containerRef.current.querySelector('.video-container');
if (playerContainer) {
  playerContainer.innerHTML = '';  // Nuclear clear — removes all children
  playerContainer.appendChild(videoElement);
}
```

### Prevention Rules
1. **ALWAYS** clear the container div with `innerHTML = ''` before appending a new `<video>` element.
2. This is a defense-in-depth measure — even if `dispose()` works correctly, the clear ensures no orphans.

---

## BUG-007: `selectedChannel` State Updates Causing Unnecessary Player Remounts

### Symptom
Changing unrelated state in `page.tsx` (like toggling settings, opening sidebar, filtering channels) would cause the video player to restart.

### Root Cause
If the `useEffect` dependency array in `VideoPlayer.tsx` included `channel` (the object) instead of `channel?.url` (the primitive string), any time the parent re-rendered with a new object reference (even with the same URL), the effect would re-run and recreate the player.

### Solution
Key the player creation effect on `channel?.url`, NOT `channel`:

```tsx
// CORRECT: Only recreate when the URL actually changes
useEffect(() => {
  // ... player setup ...
}, [channel?.url, autoSkip, onStreamError, resetControlsTimer, startErrorCountdown]);

// INCORRECT: Recreates on any object reference change
useEffect(() => {
  // ... player setup ...
}, [channel, /* ... */]); // ❌ channel is an object, new ref every render
```

### Prevention Rules
1. **ALWAYS** use primitive values (`channel?.url`) in effect dependency arrays for expensive operations like player creation.
2. Non-primitive dependencies cause effects to re-run on every render if the parent doesn't memoize the object.

---

## BUG-008: `displayChannelsRef` — Preventing Stale Channel Lists in Navigation Callbacks

### Symptom
Pressing CH+ / CH- (next/previous channel) would navigate to the wrong channel or fail to find the current channel in the list, especially after filtering or searching.

### Root Cause
The `handleManualNextChannel` / `handleManualPrevChannel` callbacks in `page.tsx` were defined with `useCallback` and captured `displayChannels` in their closure at creation time. When `displayChannels` updated (due to search/filter), the callbacks still used the old list.

### Solution
Maintain a ref that always mirrors the latest `displayChannels`:

```tsx
// page.tsx
const displayChannelsRef = useRef(displayChannels);
useEffect(() => {
  displayChannelsRef.current = displayChannels;
}, [displayChannels]);

// In callbacks, read from the ref:
const handleManualNextChannel = useCallback(() => {
  if (!selectedChannel) return;
  const channels = displayChannelsRef.current; // Always fresh
  const currentIndex = channels.findIndex(c => c.url === selectedChannel.url);
  if (currentIndex !== -1) {
    const nextIndex = (currentIndex + 1) % channels.length;
    setSelectedChannel(channels[nextIndex]);
  }
}, [selectedChannel]); // No need for displayChannels in deps
```

### Prevention Rules
1. When a `useCallback` needs to access a frequently-changing array/object but you don't want it in the dependency array (to avoid re-creating the callback), use a ref pattern.
2. **ALWAYS** sync the ref in a separate `useEffect` that watches the source state.
3. This is essential for any callback passed down to deeply nested components (like `VideoPlayer`) where unnecessary callback identity changes would trigger re-renders.

## BUG-009: Unmounted Video Container Causing Invisible Player (Black Screen + Audio)

### Symptom
When returning to a channel after an error (or hitting "Try Again"), the player would show a black screen but the channel's audio could be heard playing in the background. Changing channels and returning sometimes fixed it.

### Root Cause
The `<div className="video-container">` was conditionally rendered using a ternary (`error ? <ErrorUI/> : <div className="video-container"/>`). When an error cleared and the `video.js` initialization `useEffect` ran, it tried to find `.video-container` using `querySelector`. Due to a race condition with React's render cycle, the container was not yet added back to the DOM. The video element was created and `video.js` started playing the stream (which is why audio worked), but it was never appended to the document (resulting in a black screen).

### Solution
Never conditionally unmount the video container. Instead, persistently mount it, attach a `useRef` directly to it, and hide it using CSS when an error is displayed.

```tsx
// 1. Create a dedicated ref
const videoContainerRef = useRef<HTMLDivElement>(null);

// 2. In the JSX, use CSS to hide it, do NOT unmount it
{error && <ErrorUI />}
<div 
  ref={videoContainerRef} 
  className={cn("video-container w-full h-full", error ? "hidden" : "block")} 
/>

// 3. In the useEffect / handleRetry, use the ref directly
const playerContainer = videoContainerRef.current;
if (playerContainer) {
  playerContainer.innerHTML = '';
  playerContainer.appendChild(videoElement);
}
```

### Prevention Rules
1. **NEVER** conditionally unmount the video container div.
2. **ALWAYS** use a `useRef` for the video container instead of `querySelector('.video-container')` to avoid race conditions.
3. Toggle visibility using CSS (`hidden` vs `block`) when showing error overlays.

## BUG-010: Severe Browser Lag when navigating to Home Page after removing Channel Limits

### Symptom
After removing the 100-channel limit from `useChannels.ts` to show all channels in the virtualized Sidebar, clicking the "Home" button caused the browser to freeze and severely lag for several seconds. 

### Root Cause
While the `Sidebar` component successfully utilized `@tanstack/react-virtual` to smoothly render 5,000+ channels by only mounting what is visible, the `HomeView`'s `<HomeGrid>` component relied on standard React rendering. Removing the pagination limit caused `<HomeGrid>` to attempt to instantly mount 5,000+ heavy DOM elements (channel cards) when the view switched to "home", resulting in a massive DOM overload that stalled the main thread.

### Solution
Decouple the data streams. The `useChannels` hook must provide two separate array streams:
1. `filteredChannels`: The complete, un-sliced array (passed to the virtualized `Sidebar`).
2. `displayChannels`: A chunked array using traditional pagination (passed to the un-virtualized `HomeView`).

```tsx
// Inside useChannels.ts
const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE); // e.g. 100

const displayChannels = useMemo(() => {
  return filteredChannels.slice(0, visibleCount);
}, [filteredChannels, visibleCount]);

return { 
  filteredChannels, // Full list for Sidebar
  displayChannels,  // Sliced list for Home
  loadMore // Pagination trigger
};
```

### Prevention Rules
1. **NEVER** pass an unbounded array of thousands of items to a standard React mapping function (`items.map()`).
2. If a component does not use list virtualization, it **MUST** use a chunked/paginated data stream.
3. Keep the Sidebar and Home views cleanly separated in their data requirements.

---

## Summary: Critical Architectural Rules for This Project

| Rule | Description |
|------|-------------|
| **Always-mounted player** | `<VideoPlayer>` must never be conditionally rendered based on view state. Use `isPip` prop. |
| **Persistently-mounted container**| The `.video-container` div inside `VideoPlayer` must never be conditionally unmounted. Use `hidden` CSS instead. |
| **Direct stream URLs** | Never proxy HLS streams through the deployment server. Use the raw M3U8 URL directly. |
| **Dispose before recreate** | Always `player.dispose()` + clear container before creating a new video.js instance. |
| **Refs for window handlers** | Any value read inside `window.addEventListener` handlers must be a `useRef`, not `useState`. |
| **Primitive effect keys** | Use `channel?.url` (string), not `channel` (object), in `useEffect` dependency arrays. |
| **Ref-mirrored arrays** | Use `displayChannelsRef.current` pattern for callbacks that need the latest list without re-creation. |
| **Guard disposed players** | Every call to `playerRef.current.*()` must first check `playerRef.current && !playerRef.current.isDisposed()`. |
| **Clean all timers** | Every `useEffect` cleanup must clear ALL `setTimeout`/`setInterval` refs it owns. |
| **Responsive Grid Virtualization** | The Sidebar uses `@tanstack/react-virtual` with a `ResizeObserver` to calculate columns for `isExpanded`. Never use native CSS Grid to handle layout of thousands of elements. Always virtualize row-by-row. |
| **Paginate Unvirtualized Grids** | The Home page (`HomeView` & `HomeGrid`) does not use list virtualization. It MUST receive a sliced `displayChannels` array with a `loadMore` trigger to prevent DOM overload and browser crashes. |
