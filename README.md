<p align="center">
  <img src="./public/logo.png" alt="Beam logo" width="120" height="120" />
</p>

<h1 align="center">Beam</h1>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="WebRTC" src="https://img.shields.io/badge/WebRTC-P2P-0F172A?style=flat-square" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-0F172A?style=flat-square&logo=tailwindcss&logoColor=38BDF8" />
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-111827?style=flat-square" />
</p>

<p align="center">
  Beam is a fast, account-free WebRTC calling app with host controls, screen sharing, and a dark claymorphic interface.
</p>

## Features

- Create or join a six-character room in seconds with no account flow.
- Keep display names in `sessionStorage` for frictionless room entry.
- Establish direct peer-to-peer video and audio calls through WebRTC.
- Provide host controls for mute, remove, transfer host, and stopping screen share.
- Support single-presenter screen sharing with a yield-request flow.
- Handle full AV, audio-only, video-only, and no-media permission fallbacks.
- Include a responsive participant panel, creator attribution, and copy-link flow.

## Architecture

Beam is split into two runtime pieces:

- A Next.js App Router frontend in `src/` for the landing page, room UI, media handling, and peer management.
- A standalone `ws` signaling server in `server/signaling.js` that manages room membership, relays SDP/ICE messages, validates host authority, and keeps room state entirely in memory.

The signaling layer never stores media, user records, or session history. Audio, video, and screen-share traffic flows directly between browsers over WebRTC.

## Getting Started

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
NEXT_PUBLIC_SIGNALING_URL=ws://localhost:4511
PORT=4511
```

4. Run the app and signaling server together:

```bash
npm run dev
```

5. Or run them separately:

```bash
npm run dev:app
npm run dev:signal
```

6. Open `http://localhost:3000`.

## Scripts

- `npm run dev` starts the Next.js app and the signaling server together.
- `npm run dev:app` starts only the Next.js app.
- `npm run dev:signal` starts only the signaling server.
- `npm run build` creates a production build of the app.
- `npm run signal` runs the signaling server without watch mode.
- `npm run lint` runs ESLint across the project.
- `npm run test` runs the Vitest suite.

## Deployment

Deploy the frontend to Vercel and the signaling server to a persistent Node host such as Render or Railway.

- Frontend env: `NEXT_PUBLIC_SIGNALING_URL=wss://your-signal-host`
- Signaling env: `PORT=4511` locally, or your hosted service port in production

Because the signaling server holds active WebSocket connections, it should run as a persistent service rather than a serverless function.

## Creator

Created by **Samin Yeasar**

- GitHub: [github.com/solez-ai](https://github.com/solez-ai)
- X: [x.com/Solez_None](https://x.com/Solez_None)
- Portfolio: [solez.vercel.app](https://solez.vercel.app)
- Project Repository: [github.com/Solez-ai/process-story](https://github.com/Solez-ai/process-story)

## License

Beam is licensed under the [MIT License](./LICENSE).
