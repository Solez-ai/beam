# Beam — Technical & Product Specification

**Version:** 1.0.0  
**Project URL:** https://beam-call.vercel.app  
**Repository:** github.com/Solez-ai/process-story  
**License:** MIT  
**Created by:** Samin Yeasar  
— GitHub: github.com/solez-ai  
— X (Twitter): x.com/Solez_None  
— Portfolio: https://solez.vercel.app

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Philosophy](#2-core-philosophy)
3. [Feature Specification](#3-feature-specification)
4. [User Flows](#4-user-flows)
5. [Architecture Overview](#5-architecture-overview)
6. [WebRTC & Signaling Design](#6-webrtc--signaling-design)
7. [Frontend Architecture (Next.js)](#7-frontend-architecture-nextjs)
8. [Component Specification](#8-component-specification)
9. [UI & Design System](#9-ui--design-system)
10. [State Management](#10-state-management)
11. [Room & Session Logic](#11-room--session-logic)
12. [Host Controls](#12-host-controls)
13. [Media Controls](#13-media-controls)
14. [Screen Sharing](#14-screen-sharing)
15. [Responsive Design](#15-responsive-design)
16. [Performance Targets](#16-performance-targets)
17. [Security Considerations](#17-security-considerations)
18. [Deployment](#18-deployment)
19. [Repository Structure](#19-repository-structure)
20. [README & Branding](#20-readme--branding)
21. [License](#21-license)
22. [Creator Attribution](#22-creator-attribution)

---

## 1. Project Overview

Beam is a minimal, lightning-fast, browser-based video conferencing platform. It is purpose-built to eliminate every point of friction present in conventional meeting tools. There are no accounts, no logins, no dashboards, no recurring charges, and no feature bloat. A user arrives at the homepage, types their name, and either generates a new six-digit room code or types an existing one. That is the entire onboarding experience.

Once inside a room, Beam establishes direct peer-to-peer audio and video connections between all participants using the WebRTC protocol via PeerJS. The public PeerServer acts as the signaling layer — it exists purely to coordinate connection setup (offer/answer exchange and ICE candidate relay) and never stores any media data, user records, or session history. All real-time communication happens directly between browsers.

Beam is hosted on Vercel at **https://beam-call.vercel.app** and is entirely free to use. It is optimised for both desktop and mobile browsers and requires only a modern Chromium or Firefox-based engine to function.

---

## 2. Core Philosophy

Beam is guided by a small set of non-negotiable principles that inform every technical and design decision:

**Zero Friction.** A user must be able to go from landing page to live video call in under fifteen seconds. No account creation, no email verification, no permission wall — just a name and a code.

**No Unnecessary State.** Beam retains zero user data beyond the lifespan of a session. There is no database, no analytics event store, no user profile, no session log. When a room closes, it is gone.

**Peer-First.** All audio, video, and screen-sharing data flows directly between participants via WebRTC data channels managed by PeerJS. The signaling server is a temporary matchmaker that exits the communication path the moment a connection is established.

**Essential Features Only.** Beam provides camera, microphone, and screen sharing controls, a clean participant video grid, a copyable room link, and host controls. It does not provide in-call chat, reactions, whiteboards, polls, recording, virtual backgrounds, or any other feature that adds complexity without proportional value for a minimal conferencing tool.

**Performance as a Feature.** The application shell must load instantly. WebRTC connections must be established within two to three seconds on a typical broadband connection. The video grid must render without layout thrash as participants join and leave.

---

## 3. Feature Specification

### 3.1 Landing Page — Room Entry

The landing page is the sole entry point to the application. It renders a single, centred card-style interface containing:

- The Beam wordmark and logo (loaded from `/public/` — see Section 20).
- A text input field for the user's display name.
- A "Create Room" button that generates a new cryptographically random six-digit alphanumeric room code, then navigates the user to `/room/[CODE]`.
- A "Join Room" section containing a six-character code input field and a "Join" button that navigates to the corresponding room route.
- A small footer crediting the creator: Samin Yeasar, with links to the GitHub repository (github.com/Solez-ai/process-story) and the creator's personal portfolio (https://solez.vercel.app).

The display name is stored in component state and passed to the room via `sessionStorage` so it survives the client-side navigation without requiring a URL parameter or server round-trip.

### 3.2 Room Code Generation

Room codes are six characters long and composed of uppercase letters and digits (A–Z, 0–9), giving a keyspace of 36^6 = approximately 2.18 billion unique codes. Codes are generated client-side using `crypto.getRandomValues` for cryptographic randomness. The format is visually friendly — no characters that can be confused with each other (no O/0 or I/1 ambiguity — these pairs are excluded from the character set).

The resulting room URL takes the form: `https://beam-call.vercel.app/room/XXXXXX`

This URL is the shareable invite link. Participants who visit it are prompted for their name on arrival and then placed directly into the room.

### 3.3 Join Room by Code

From the landing page, any user can type a six-digit code they received from a host and press "Join" to navigate directly to `/room/[CODE]`. On the room page, if the user has not yet entered a name (i.e., no display name is found in `sessionStorage`), a pre-room name-entry modal overlay is shown before media negotiation begins.

### 3.4 Camera and Microphone Access

On entering a room, Beam calls `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`. The browser's native permission prompt appears. If the user grants access, both tracks are started immediately and their local video stream is displayed in a self-view tile. If the user denies camera or microphone access, Beam degrades gracefully: a placeholder avatar tile is shown with the user's name initial, and audio/video toggle buttons are shown in a disabled state with a tooltip explaining the permission was denied.

### 3.5 Video Grid

The video grid is the central UI element of the room view. It is a CSS Grid-based layout that dynamically reconfigures itself as participants join and leave:

- 1 participant: Full-width single tile (self-view), centred.
- 2 participants: Two equal columns.
- 3–4 participants: 2×2 grid.
- 5–6 participants: 2×3 grid.
- 7–9 participants: 3×3 grid.
- 10+ participants: 4-column grid with overflow scrolling.

Each tile in the grid contains:
- The participant's live `<video>` element, object-fit: cover, filling the tile.
- A name label pinned to the bottom-left corner of the tile.
- A small microphone-muted indicator icon (shown when the participant's audio track is muted).
- A subtle "host" badge for the room host.
- A hover overlay (desktop) or long-press overlay (mobile) that reveals per-participant host controls if the viewing user is the host.

The local participant's own tile is always positioned in the bottom-right corner of the grid, regardless of grid size — matching the familiar conventions of Google Meet, Zoom, and similar platforms.

### 3.6 Microphone Toggle

A microphone toggle button in the bottom control bar enables the local participant to mute and unmute their audio track at any time. Toggling mute calls `track.enabled = false/true` on the local `MediaStreamTrack` — this is a hard mute that prevents audio from being transmitted to peers at the track level, not just at the mixing level. The button icon changes between a filled microphone and a crossed-out microphone, and the participant's tile displays a muted indicator to all other participants.

### 3.7 Camera Toggle

A camera toggle button mirrors the microphone toggle. Disabling the camera calls `track.enabled = false` on the local video `MediaStreamTrack`. Other participants see a black tile or a placeholder avatar tile (dependent on implementation preference) with the participant's name instead of their video.

### 3.8 Screen Sharing

Screen sharing is triggered by a dedicated "Share Screen" button in the control bar. Beam calls `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })` to acquire a screen capture stream. The screen track is then sent to all connected peers by replacing the existing video sender track via `RTCRtpSender.replaceTrack()`. While screen sharing is active:

- The sharer's tile in the grid expands to take up the majority of the grid layout (a "presentation mode" layout switch).
- All other participants' tiles shrink to a sidebar strip.
- The "Share Screen" button changes to "Stop Sharing" — clicking it replaces the screen track back with the camera track.
- If the user closes the screen share via the browser's native "Stop sharing" bar, Beam detects the `ended` event on the display media track and automatically reverts to camera.

At any given time, only one participant may be actively sharing their screen. If a second participant attempts to share while another share is already active, Beam shows a modal confirmation asking the first sharer if they want to yield the screen. Host can forcibly stop a participant's screen share (see Host Controls).

### 3.9 Copy Room Link

A "Copy Link" button in the control bar (or the room header) copies the full room URL (`https://beam-call.vercel.app/room/XXXXXX`) to the clipboard using the Clipboard API (`navigator.clipboard.writeText`). A brief inline toast notification confirms the copy ("Link copied!"). On browsers or contexts where the Clipboard API is unavailable, a text input field pre-populated with the URL is shown for manual copying.

### 3.10 Leave Room

A "Leave" button (styled prominently in red) disconnects the local participant from all peers, stops all local media tracks, and navigates back to the landing page. If the leaving participant is the host, host privileges are automatically transferred to the next connected participant (in join-order). If the host is the last participant, the room simply closes with no transfer needed.

### 3.11 Host System

The first participant to connect to a room is designated the host. Host status is tracked in the signaling server during the lifespan of the session. When a participant joins, the signaling server informs them whether they are the host and communicates host identity to all existing participants.

Host privileges include:

- **Mute Participant:** The host can mute any participant's microphone. This sends a control message via the signaling channel instructing the target client to set `audioTrack.enabled = false`. The muted participant receives a brief in-call notification ("You were muted by the host"). The muted participant can still unmute themselves — Beam does not implement a permanent forced-mute, as this creates a poor UX.
- **Remove Participant:** The host can remove (kick) any participant. This sends a control message to the target client instructing it to disconnect and navigate to a dedicated "You were removed from this room" page. All other participants are notified that the participant was removed.
- **Stop Screen Share:** If a participant is sharing their screen, the host can send a stop-share control message that triggers the screen share to end on the participant's device.
- **Transfer Host:** The host can designate any other participant as the new host. This sends a control message via signaling, the server updates its host record, and all clients receive a host-changed notification that updates badge displays in the grid.

Host controls are accessible via the per-participant hover/long-press overlay on each video tile, and also via a compact "Participants" panel that can be toggled from the control bar.

### 3.12 Participants Panel

A collapsible participants panel (toggled by a button in the control bar) slides in from the right side of the screen. It lists all connected participants with their names, host badge (if applicable), microphone status icon, and (for the host) action buttons: Mute, Remove, Make Host. The panel does not include a chat function. It is purely a participant management surface.

---

## 4. User Flows

### 4.1 Create and Host a Room

1. User arrives at `https://beam-call.vercel.app`.
2. User types their display name into the name input field.
3. User clicks "Create Room."
4. A six-digit room code is generated client-side (e.g., `A3K7PQ`).
5. The display name is stored in `sessionStorage`.
6. The browser navigates to `/room/A3K7PQ`.
7. The room page mounts, reads the display name from `sessionStorage`.
8. The room page connects to the PeerJS server, announces the room code and display name.
9. The first participant to connect becomes the host of room `A3K7PQ`.
10. `getUserMedia` is called; the user's camera and microphone begin streaming.
11. The user's self-view appears in the video grid.
12. The user copies the room link and shares it with others.

### 4.2 Join an Existing Room

**Via landing page code input:**
1. User arrives at the landing page.
2. User types their display name.
3. User types the six-digit code `A3K7PQ` into the "Join Room" input.
4. User clicks "Join."
5. Display name is stored in `sessionStorage`.
6. Browser navigates to `/room/A3K7PQ`.
7. Room page mounts, initializes a PeerJS connection.
8. The client connects to the existing room host via a PeerJS data connection.
9. The host responds with the list of existing peer IDs in the room.
10. The new participant initiates a PeerJS media call with each existing peer.

**Via shared link:**
1. User receives the URL `https://beam-call.vercel.app/room/A3K7PQ`.
2. User opens the URL. If no display name is in `sessionStorage`, a name-entry modal overlays the room page.
3. User types their name, clicks "Join." Flow continues from step 7 above.

### 4.3 Host Removes a Participant

1. Host hovers over (or long-presses on mobile) the target participant's tile.
2. A control overlay appears with "Mute," "Remove," and "Make Host" options.
3. Host clicks "Remove."
4. A confirmation dialog appears: "Remove [Name] from this room?"
5. Host confirms.
6. Signaling server is notified, sends a remove control message to the target client.
7. The target client disconnects, all its peer connections are closed, and it navigates to the removal notice page.
8. The target's tile disappears from all remaining participants' grids.

---

## 5. Architecture Overview

Beam consists of two distinct runtime components:

### 5.1 Next.js Application (Client + Server)

The Next.js application handles:
- Static page rendering for the landing page (`/`) and the room page (`/room/[code]`).
- Client-side WebRTC peer management via PeerJS.
- Media device access (`getUserMedia`, `getDisplayMedia`).
- All UI rendering and interaction.

The application is deployed to Vercel as a static-first Next.js app. The room route (`/room/[code]`) is a fully client-rendered page.

### 5.2 PeerJS Signaling

Instead of a custom backend, Beam uses the default public PeerServer via the `peerjs` library. Its responsibilities are implicitly handled by the P2P data connections:

- The first user to join a room becomes the "Host" by claiming a deterministic Peer ID (`beam-room-[CODE]`).
- Subsequent users join as guests with random Peer IDs and connect their data channels to the Host.
- The Host manages the room membership and relays control messages (mute, remove, transfer host) via data channels.
- PeerJS abstracts away the raw SDP and ICE candidate relaying.

### 5.3 STUN Servers

NAT traversal uses public STUN servers. Beam's ICE configuration includes:

```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
stun:stun2.l.google.com:19302
```

These are free, reliable, and sufficient for the vast majority of consumer network configurations. No TURN relay server is provisioned in the initial version — this is a known limitation for users behind highly restrictive NAT (corporate firewalls, symmetric NAT). A TURN server can be added in a future version via a free-tier Metered.ca or Twilio allocation.

---

## 6. WebRTC & Signaling Design

### 6.1 Peer Connection Lifecycle

Beam implements a full mesh WebRTC topology: every participant maintains a direct `RTCPeerConnection` to every other participant. For small meetings (under ten people) this is the most efficient approach — it avoids the latency and infrastructure cost of a centralised media server (SFU).

The peer connection lifecycle for a new joiner follows this sequence:

1. Joiner connects to signaling server and sends `join` with room code and display name.
2. Server responds with `room-info`, including the list of existing peer IDs.
3. Joiner creates one `RTCPeerConnection` instance per existing peer.
4. Joiner adds its local media tracks to each peer connection via `addTrack`.
5. Joiner creates an SDP offer for each existing peer and sends it through the signaling server.
6. Each existing peer receives the offer, creates a peer connection for the joiner, adds its own tracks, generates an SDP answer, and sends it back.
7. Both sides exchange ICE candidates as they are discovered.
8. Once ICE negotiation completes and the DTLS handshake succeeds, the `RTCPeerConnection` enters the `connected` state.
9. Remote track events (`ontrack`) fire on both sides, and the remote video streams are attached to `<video>` elements in the grid.

### 6.2 Track Replacement for Screen Sharing

When a user initiates screen sharing, Beam does not create a new peer connection. Instead, it uses `RTCRtpSender.replaceTrack(newTrack)` to swap the video track on all existing sender objects. This is seamless — remote peers receive the new track without renegotiation in most modern browsers.

### 6.3 Renegotiation Handling

In scenarios where renegotiation is required (e.g., adding a new track type mid-call), Beam handles the `negotiationneeded` event on each `RTCPeerConnection` by creating a new offer and restarting the signaling flow for that specific peer pair.

### 6.4 Connection State Monitoring

Each `RTCPeerConnection` is monitored via its `connectionstatechange` and `iceconnectionstatechange` events. If a connection drops to `failed` or `disconnected`, Beam attempts an ICE restart by calling `restartIce()` and triggering a new offer. If the reconnection attempt fails after a timeout (five seconds), the peer is marked as disconnected and their tile is removed from the grid.

---

## 7. Frontend Architecture (Next.js)

### 7.1 Next.js Version and Configuration

Beam is built on **Next.js 14** using the **App Router**. The app uses:

- `app/page.tsx` — landing page (server component for metadata, client component for interactivity).
- `app/room/[code]/page.tsx` — room page (fully client-side via `"use client"` directive).
- `app/layout.tsx` — root layout with global fonts, metadata, and the Beam theme.
- `app/globals.css` — global CSS custom properties (design tokens) and base resets.

### 7.2 TypeScript

The entire codebase is written in TypeScript with strict mode enabled. All WebRTC types, signaling message shapes, participant models, and component props are fully typed.

### 7.3 Key Dependencies

| Package | Purpose |
|---|---|
| `next` | Framework |
| `react` / `react-dom` | UI rendering |
| `typescript` | Type safety |
| `ws` | WebSocket server (signaling) |
| `zustand` | Lightweight client-side state management |
| `tailwindcss` | Utility-first CSS framework for layout and design tokens |
| `clsx` | Conditional class string composition |
| `@radix-ui/react-dialog` | Accessible modal dialogs (name entry, confirmations) |
| `@radix-ui/react-tooltip` | Accessible tooltips on control buttons |
| `lucide-react` | Icon library (microphone, camera, screen share, etc.) |

No heavyweight UI libraries (no MUI, no Chakra, no Ant Design). The component set is hand-built on top of Tailwind and Radix primitives.

---

## 8. Component Specification

### 8.1 `LandingPage` (`app/page.tsx`)

**Responsibilities:**
- Render the Beam logo (from `/public/logo.png` or `/public/logo.svg`).
- Render the name input field.
- Render the "Create Room" button with code generation logic.
- Render the "Join Room" code input and "Join" button.
- Store the display name in `sessionStorage` before navigation.
- Render the creator attribution footer.

**State:**
- `displayName: string` — controlled input value.
- `joinCode: string` — controlled input value for the join field.
- `nameError: boolean` — whether a name validation error should be shown.

### 8.2 `RoomPage` (`app/room/[code]/page.tsx`)

**Responsibilities:**
- Read the room code from the URL parameter.
- Read the display name from `sessionStorage`; if absent, render the `NameEntryModal`.
- Initialise and manage the `useRoom` hook.
- Render the `VideoGrid`, `ControlBar`, and `ParticipantsPanel`.

### 8.3 `VideoGrid`

**Responsibilities:**
- Accept a list of participant objects (each with a peer ID, display name, video stream reference, audio muted status, and host status).
- Render one `VideoTile` per participant.
- Apply dynamic CSS Grid layout based on participant count.
- Position the local participant's tile in the last grid cell.

**Props:**
```typescript
interface VideoGridProps {
  participants: Participant[];
  localPeerId: string;
  hostPeerId: string;
  isLocalHost: boolean;
  onMutePeer: (peerId: string) => void;
  onRemovePeer: (peerId: string) => void;
  onMakeHostPeer: (peerId: string) => void;
}
```

### 8.4 `VideoTile`

**Responsibilities:**
- Render a `<video>` element with the participant's stream.
- Show a placeholder avatar if the stream is absent or video is disabled.
- Overlay the participant's name label.
- Overlay a mute indicator icon.
- Overlay a host badge.
- Show host control actions on hover (desktop) or long-press (mobile) if the viewer is the host and the tile is not the local tile.

### 8.5 `ControlBar`

**Responsibilities:**
- Render the microphone toggle button.
- Render the camera toggle button.
- Render the screen share toggle button.
- Render the copy link button.
- Render the participants panel toggle button.
- Render the leave room button.

**Props:**
```typescript
interface ControlBarProps {
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onCopyLink: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
  participantCount: number;
}
```

### 8.6 `ParticipantsPanel`

**Responsibilities:**
- Slide in/out from the right side of the screen.
- List all participants with name, host badge, and mute status icon.
- For each non-local participant, if the viewer is the host, show Mute / Remove / Make Host buttons.

### 8.7 `NameEntryModal`

**Responsibilities:**
- Overlay the room page when no display name is found in `sessionStorage`.
- Accept name input and "Join" button.
- On submit, store the name in `sessionStorage` and dismiss the modal, unblocking room initialisation.

### 8.8 `useRoom` (Custom Hook)

This is the central hook that encapsulates all WebRTC and signaling logic. It returns the full room state and action handlers consumed by `RoomPage` and its children.

**Returns:**
```typescript
interface UseRoomReturn {
  participants: Participant[];
  localPeerId: string;
  hostPeerId: string;
  isLocalHost: boolean;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  copyRoomLink: () => void;
  leaveRoom: () => void;
  mutePeer: (peerId: string) => void;
  removePeer: (peerId: string) => void;
  makeHostPeer: (peerId: string) => void;
}
```

**Internal responsibilities:**
- Open and maintain the PeerJS connection.
- Call `getUserMedia` and manage local stream tracks.
- Maintain a list of remote participants.
- Handle all signaling message dispatch and reception via `usePeerNetwork`.
- Manage screen share track replacement.
- Handle incoming control messages (mute, remove, stop-share).

### 8.9 `usePeerNetwork` (Custom Hook)

A lower-level hook that wraps the PeerJS setup. Provides `send(message)` for data signaling and `callPeer(peerId)` for media. It handles the deterministic host discovery process, manages the `Peer` instance, and surfaces media streams and data signals back to `useRoom`.

---

## 9. UI & Design System

### 9.1 Design Direction

Beam's visual identity is built around the concept of **focused clarity** — a dark, high-contrast interface that puts video content front and centre and keeps all chrome at the absolute minimum. The palette is near-monochrome with a single vivid accent used sparingly for active states and calls to action.

### 9.2 Colour Palette

```css
:root {
  --bg-primary: #0a0a0a;        /* Main background — near black */
  --bg-surface: #141414;        /* Cards, panels, tile backgrounds */
  --bg-elevated: #1e1e1e;       /* Hover states, tooltips */
  --border-subtle: #2a2a2a;     /* Dividers and tile borders */
  --text-primary: #f0f0f0;      /* Primary text */
  --text-secondary: #888888;    /* Labels, placeholders */
  --accent: #3b82f6;            /* Blue — CTAs, active states, host badge */
  --accent-hover: #2563eb;      /* Darker blue on hover */
  --danger: #ef4444;            /* Red — Leave button, remove action */
  --danger-hover: #dc2626;
  --success: #22c55e;           /* Green — copy confirmation toast */
  --muted-indicator: #f59e0b;   /* Amber — mute icon on video tiles */
}
```

### 9.3 Typography

- **Display / Wordmark:** `Syne` (Google Fonts) — geometric, contemporary, distinctive at large sizes.
- **UI Text / Labels / Buttons:** `DM Sans` (Google Fonts) — clean, legible, slightly humanist, pairs well with Syne.
- **Monospace (room codes):** `JetBrains Mono` (Google Fonts) — the room code display uses a monospace font for visual clarity and to prevent character ambiguity.

Font weights used: 400 (body), 500 (labels), 600 (button text), 700 (headings).

### 9.4 Spacing Scale

Beam uses a base-4 spacing scale aligned with Tailwind's default: `4, 8, 12, 16, 20, 24, 32, 48, 64` pixels.

### 9.5 Border Radius

- Input fields, buttons: `8px`
- Video tiles: `12px`
- Modals, panels: `16px`
- Toast notifications: `8px`

### 9.6 Shadows

Video tiles use a subtle `box-shadow: 0 2px 12px rgba(0,0,0,0.5)` to lift them from the background. The control bar uses a `backdrop-filter: blur(12px)` glassy effect over the video grid for a premium feel without adding visual noise.

### 9.7 Animation

- Tile appearance/disappearance: `transform: scale(0.95) → scale(1)` with `opacity: 0 → 1`, duration `200ms`, `ease-out`.
- Panel slide-in: `transform: translateX(100%) → translateX(0)`, duration `250ms`, `ease-out`.
- Button press: `transform: scale(0.96)` on `active`, duration `100ms`.
- Toast notification: fade-in from bottom, auto-dismiss after 2.5 seconds with fade-out.
- Grid layout reconfiguration: CSS Grid's implicit transition on `grid-template-columns` change for smooth reflow.

### 9.8 Landing Page Layout

The landing page centres a card (`max-width: 420px`, `padding: 40px`) on a dark background. Above the card sits the Beam logo (from `/public/`) at `120px` width, centred. Below it is the wordmark in Syne. The card itself contains the name input, then the Create Room button (full width, accent blue), then a subtle horizontal divider with the text "or", then the join code input and join button side by side.

The footer at the bottom of the page contains a single line of small text: "Built by Samin Yeasar" linking to the GitHub repository and portfolio.

### 9.9 Room Page Layout

The room page is a full-viewport dark surface. The video grid occupies the full viewport minus the control bar height at the bottom (`~72px`). The control bar is fixed to the bottom of the viewport, with a blurred semi-transparent background so video content shows through it slightly. The participants panel, when open, overlays from the right as a sidebar (`320px` wide on desktop, full-width on mobile).

---

## 10. State Management

Beam uses **Zustand** for global client-side state. A single store (`useBeamStore`) holds:

```typescript
interface BeamStore {
  displayName: string;
  setDisplayName: (name: string) => void;
  isParticipantsPanelOpen: boolean;
  toggleParticipantsPanel: () => void;
  copyLinkStatus: 'idle' | 'copied';
  setCopyLinkStatus: (status: 'idle' | 'copied') => void;
}
```

All WebRTC and signaling state (participants list, peer connections, media streams, host status) is managed within the `useRoom` hook using React `useRef` and `useState` rather than a global store, because this state is scoped entirely to the room page lifecycle and does not need to be shared across the component tree beyond what props drilling can handle.

---

## 11. Room & Session Logic

### 11.1 Room Code Validation

When a user navigates to `/room/[code]`, the room page immediately validates the code format: it must be exactly six characters, composed only of the allowed character set (A–Z, 0–9, minus O and I). If the code is invalid, the page renders an error state ("Invalid room code") with a link back to the landing page.

### 11.2 Empty Room Behaviour

If a participant joins a room where the signaling server has no record (no other peers), the participant simply waits in the room with only their own self-view. The room remains open indefinitely. The participant can copy the link and share it.

### 11.3 Room Closure

There is no explicit "end room for everyone" action (a deliberate simplification). When a participant leaves, the room continues for remaining participants. The last participant to leave effectively closes the room — the signaling server purges its in-memory record after the last WebSocket connection from that room closes. If someone subsequently navigates to the same room code, they start a fresh, empty room.

### 11.4 Reconnection

If a participant's WebSocket connection to the signaling server drops briefly (e.g., a momentary network hiccup), `useSignaling` attempts to reconnect with exponential backoff. On successful reconnect, the participant re-announces themselves with `join` and the signaling server re-establishes their room membership. Existing peer-to-peer WebRTC connections are not affected by a brief signaling server disconnection once they are in the `connected` state — only the control channel is interrupted.

---

## 12. Host Controls

Host controls are a first-class feature of Beam. The host system is designed with the following constraints:

- There is always exactly one host per room.
- Host status is server-authoritative — the signaling server tracks who the host is and validates that control messages originate from the declared host before relaying them.
- Host status transfers automatically when the current host leaves.
- The host cannot be removed by anyone else (there is no "remove host" action — the host must voluntarily transfer or leave).

### 12.1 Host Transfer on Leave

When the host's WebSocket connection closes (via intentional leave or disconnect), the signaling server immediately selects the next participant in connection-order as the new host and broadcasts a `host-changed` message to all remaining participants.

### 12.2 Forced Mute UX

When a participant is muted by the host, they see an in-call notification banner: "The host muted your microphone." Their microphone button state updates to reflect the muted status. Critically, they retain the ability to unmute themselves — Beam intentionally avoids a "hard lock" mute that participants cannot escape, as this creates an unnecessarily coercive UX. The host can re-mute if needed.

---

## 13. Media Controls

### 13.1 Initial Permissions Handling

On room entry, Beam calls `getUserMedia` with both audio and video requested simultaneously. The following outcomes are handled:

- **Both granted:** Full AV experience.
- **Only audio granted (camera denied/unavailable):** User joins audio-only. Camera toggle button shows as permanently disabled with a tooltip.
- **Only video granted (microphone denied/unavailable):** User joins video-only (no audio transmitted). Mic toggle shows as permanently disabled.
- **Both denied:** User joins with no media. A persistent banner informs them that others cannot see or hear them, with a link to browser permission settings.
- **No media devices found:** Same as both-denied flow with a different error message.

### 13.2 Device Labels and Selection

In the initial version, Beam does not provide an in-call device picker (no "switch camera" or "switch microphone" UI). Device selection is delegated to the browser. This is a deliberate simplicity decision. A device picker can be added in a future version.

---

## 14. Screen Sharing

### 14.1 Display Media Constraints

```javascript
{
  video: {
    displaySurface: 'monitor',
    logicalSurface: true,
    cursor: 'always',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 }
  },
  audio: {
    suppressLocalAudioPlayback: false
  }
}
```

### 14.2 Presentation Layout

When any participant begins screen sharing, the grid transitions to a "presentation mode" layout:

- The sharer's tile expands to fill roughly 80% of the viewport width.
- All other participants' tiles shrink to a horizontal strip along the bottom of the screen (or a vertical strip on the right side on wider screens).
- The sharer's tile does not display the name label prominently during screen share — instead, a small pill badge shows "Sharing screen" in the top-left of their tile.

### 14.3 Revert on Share End

When screen sharing ends (via the Stop Sharing button, the browser's native stop bar, or a host stop-share command), the grid reverts to the standard participant-count-based layout and the camera track is restored to all peer connections.

---

## 15. Responsive Design

Beam is designed mobile-first. All layout, typography, and control sizing adapt to viewport dimensions.

### 15.1 Breakpoints

| Breakpoint | Target |
|---|---|
| Default (0px+) | Mobile portrait |
| `sm` (640px+) | Mobile landscape / small tablet |
| `md` (768px+) | Tablet portrait |
| `lg` (1024px+) | Tablet landscape / small desktop |
| `xl` (1280px+) | Standard desktop |

### 15.2 Mobile Adaptations

- Control bar icons are larger on mobile (`48px` tap targets).
- The participants panel opens as a full-screen overlay on mobile rather than a sidebar.
- Video tile name labels are always visible on mobile (no hover state needed).
- Host controls on mobile are accessed via a long-press gesture on a video tile, which opens a bottom sheet action menu.
- The landing page card spans full viewport width on mobile with appropriate horizontal padding.

---

## 16. Performance Targets

- **Time to Interactive (landing page):** Under 1 second on a 4G connection.
- **Time to first local video frame (room entry):** Under 2 seconds after permissions are granted.
- **Time to first remote peer video frame:** Under 3 seconds after the peer joins, on a typical broadband connection.
- **Grid re-render on participant join/leave:** No visible layout thrash; CSS Grid handles the transition smoothly.
- **Bundle size (JS, gzipped):** Under 150 kB for the initial route. The room page chunk may be larger due to WebRTC handling code but is code-split from the landing page.

Next.js App Router's built-in code splitting ensures the room page logic is not loaded until the user navigates to a room route.

---

## 17. Security Considerations

### 17.1 No Sensitive Data Storage

Beam stores nothing server-side. No user data, no recordings, no logs. There is no attack surface for a database breach because there is no database.

### 17.2 Room Code Entropy

Six-character codes from a 34-character set (A–Z minus O and I, 0–9 minus 0 and 1, then reconsidering — practically, the character set should be defined precisely and documented) provide sufficient entropy that brute-force room discovery is not a practical concern for short-lived meetings.

### 17.3 WebRTC Encryption

All WebRTC media and data channel traffic is mandatorily encrypted via DTLS-SRTP. This is enforced by the WebRTC specification itself and is not configurable — media cannot flow without encryption.

### 17.4 Signaling Server Validation

The signaling server validates that:
- Room codes are the correct format before processing join messages.
- Control messages (mute, remove, transfer host) only come from the declared host's WebSocket connection.
- Peer ID spoofing is mitigated by assigning server-generated UUIDs to connections rather than accepting client-provided IDs.

### 17.5 HTTPS Enforcement

The application is served exclusively over HTTPS via Vercel's automatic TLS. `getUserMedia` and `getDisplayMedia` are only available in secure contexts (HTTPS or localhost), which Vercel satisfies automatically.

---

## 18. Deployment

### 18.1 Next.js App — Vercel

The Next.js application is deployed to Vercel with zero-configuration. The `vercel.json` (if needed) specifies:

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

Environment variables required:
- `NEXT_PUBLIC_SIGNALING_URL` — the WebSocket URL of the signaling server (e.g., `wss://beam-signal.onrender.com`).

### 18.2 PeerJS Infrastructure

Because Beam uses PeerJS, it no longer requires a custom persistent Node.js service. The application relies entirely on the public `peerjs.com` servers to broker connections. All hosting is handled through the static frontend on Vercel.

### 18.3 Environment Configuration

There are no required environment variables. The app defaults to public PeerJS servers.

---

## 19. Repository Structure

```
beam/
├── public/
│   ├── logo.png          # Beam logo (used in landing page and README)
│   ├── logo.svg          # SVG variant of the logo
│   └── favicon.ico
├── app/
│   ├── layout.tsx         # Root layout (fonts, metadata, theme)
│   ├── globals.css        # CSS custom properties, base reset
│   ├── page.tsx           # Landing page
│   └── room/
│       └── [code]/
│           └── page.tsx   # Room page
├── components/
│   ├── landing/
│   │   ├── LandingCard.tsx
│   │   └── JoinForm.tsx
│   ├── room/
│   │   ├── VideoGrid.tsx
│   │   ├── VideoTile.tsx
│   │   ├── ControlBar.tsx
│   │   ├── ParticipantsPanel.tsx
│   │   └── NameEntryModal.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Toast.tsx
│       └── Badge.tsx
├── hooks/
│   ├── useRoom.ts
│   ├── useSignaling.ts
│   └── usePeerConnection.ts
├── lib/
│   ├── generateRoomCode.ts
│   ├── signalingMessages.ts
│   └── webrtcConfig.ts
├── store/
│   └── useBeamStore.ts
├── types/
│   └── index.ts
├── server/
│   └── signaling.js       # Standalone WebSocket signaling server
├── SPEC.md                # This document
├── README.md
├── LICENSE
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 20. README & Branding

The project README (`README.md`) is a professional, emoji-free document. It is structured as follows:

- **Header:** The Beam logo (from `/public/logo.png` or `/public/logo.svg`) centred at a moderate size using an HTML `<img>` tag with `align="center"`.
- **Badges row:** Technology and status badges using `shields.io` — including badges for Next.js, TypeScript, WebRTC, Tailwind CSS, Vercel deployment status, and the MIT license. These are displayed as a centred row of inline image links.
- **Tagline:** A single sentence describing Beam.
- **Features section:** A clean bulleted list of Beam's core capabilities.
- **Getting Started:** Step-by-step instructions for cloning the repository, installing dependencies, configuring environment variables, running the development server, and deploying.
- **Architecture section:** A brief prose description of the signaling and WebRTC architecture, with a reference to this SPEC document for full technical detail.
- **Creator section:** A dedicated "Created by" section that names **Samin Yeasar** and links to:
  - GitHub: github.com/solez-ai
  - X (Twitter): x.com/Solez_None
  - Portfolio: https://solez.vercel.app
- **License section:** States that the project is licensed under the MIT License with a link to the `LICENSE` file.

The logo used in the README and in the application UI is the asset located in `/public/` in the repository. It should be referenced in the README using a relative path: `./public/logo.png` (or `.svg`).

---

## 21. License

Beam is released under the **MIT License**.

```
MIT License

Copyright (c) 2024 Samin Yeasar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The full license text is stored in `LICENSE` at the repository root.

---

## 22. Creator Attribution

**Samin Yeasar** is the sole creator of Beam.

| Platform | Link |
|---|---|
| GitHub | github.com/solez-ai |
| X (Twitter) | x.com/Solez_None |
| Portfolio | https://solez.vercel.app |
| Project Repository | github.com/Solez-ai/process-story |

Creator attribution appears in two locations within the application:

1. **Landing page footer:** A small, understated line of text — "Built by Samin Yeasar" — with the name linked to the GitHub profile and the project repository icon linked separately.

2. **Room page footer (or About modal):** An even smaller attribution line, visible but unobtrusive, present at the bottom of the room view or accessible via a small info icon that opens a brief modal. This ensures the creator is credited in the primary-use surface of the application, not just the landing page.

---

*This specification is the authoritative source of truth for Beam's design, implementation, and behaviour. All implementation decisions should be reconciled against this document. If a discrepancy exists between this document and implemented code, this document defines the intended behaviour.*
