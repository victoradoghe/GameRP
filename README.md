# Lagos Life 3D — Next-Gen Lagos Life Simulator

A full 3D interactive remix and reimagining of the viral Nigerian life-simulation game (*lagoslife.app*), built from scratch with **Next.js 15, React 19, Three.js, Tailwind CSS, Web Audio API, and TypeScript** using `pnpm`.

---

## 🌟 How This Remix is 100% Better Than The Original

| Feature | Original Lagos Life (`lagoslife.app`) | Lagos Life 3D (`Project 1`) |
| :--- | :--- | :--- |
| **Graphics Engine** | 2D / Text-hybrid static pages | **Full 3D Real-time WebGL World** with Three.js (dynamic camera, animated avatar, moving danfo buses, water reflections, neon nightlights). |
| **World Navigation** | Static button clicks & page redirects | **Free-roaming 3D character movement** (WASD, Arrow keys, click-to-walk raycaster, and mobile virtual D-Pad). |
| **Iconic Landmarks** | Static text cards | **Fully rendered 3D landmarks**: Amala Shitta (steaming pot particles), Club Quilox (rotating neon searchlights), Yaba Tech Towers, Lekki luxury villas, and Third Mainland Bridge. |
| **Audio & SFX** | Silent | **Native Web Audio API procedural synthesizer**: Real Afrobeats drum groove, Danfo horn ("PEEP PEEP!"), Generator chug, "Up NEPA!" cheer, and cash chimes with **zero external mp3 assets required**. |
| **Mini-Games** | Passive click-to-work counters | **3 Interactive Mini-Games**: <br>1. *Danfo Conductor Rush* (collect fares, dodge Agbero park taxes)<br>2. *Tech Bro Sprint* (code against bugs, keep laptop alive during NEPA outages with generator pull-cord)<br>3. *Afrobeats Hit Maker Studio* (soundboard, log drums, vocal ad-libs, streaming royalties). |
| **NEPA System** | Basic timer status | **Dynamic Grid Simulation**: Spontaneous power cuts, flickering transformer station sparks, generator fuel management, and "I-pass-my-neighbor" pull-cord starter. |
| **Smartphone OS** | Static menu | **EkoPhone OS**: Kuda Bank transfers & LAPO microloans, HustleHQ job board, Lagos X (Twitter) social feed, ChopChop food delivery, and Lagos Haven real estate. |
| **Character Customizer** | Pre-set roll | **Nepo Baby vs. Lapo Hustler** starter origin, custom name, fabric colors, hats (sunglasses/cap), and fashion styles (Ankara, Senator, Tech Bro, Drip). |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- `pnpm` (v9 or v10)

### 1. Run the Development Server
```bash
cd "Project 1"
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
pnpm build
pnpm start
```

---

## 🎮 Controls & Gameplay Guide

- **Walk & Move:** `W`, `A`, `S`, `D` or `Arrow Keys` (or Click/Tap anywhere on the ground)
- **Interact / Enter Building:** `E` or `Spacebar` (or tap the floating on-screen prompt)
- **EkoPhone:** Click the yellow **EkoPhone** icon at the top right to access:
  - **Kuda Bank:** Manage cash, savings, and LAPO micro-loans
  - **Hustle HQ:** Apply for jobs or start mini-game work shifts
  - **Lagos X:** Read and post to the live Lagos social media feed
  - **ChopChop:** Order street foods and chilled drinks
  - **Lagos Haven:** Upgrade your living situation from Bariga to Banana Island
  - **NEPA & Gen:** Monitor grid power and purchase petrol fuel
- **Afrobeats Music:** Click the **Beat** toggle button on the top HUD to activate procedural Afrobeats rhythms.
- **Fast Travel:** Click any district pill at the bottom dock to instantly jump between Amala Shitta, Club Quilox, Yaba Tech Corridor, Lekki Phase 1, and Computer Village.

---

## 🛠️ Project Architecture

```
Project 1/
├── src/
│   ├── app/
│   │   ├── globals.css          # Glassmorphism, animations & Tailwind directives
│   │   ├── layout.tsx           # PWA metadata & mobile viewport configuration
│   │   └── page.tsx             # Main game page & state coordinator
│   ├── components/
│   │   └── game/
│   │       ├── LagosWorld3D.tsx        # 3D Three.js world, avatar, vehicles, & shaders
│   │       ├── GameHUD.tsx             # Vitals meters, clock, fast travel dock & audio toggles
│   │       ├── EkoPhone.tsx            # Virtual smartphone OS with 6 native apps
│   │       ├── DanfoMiniGame.tsx       # Danfo conductor bus rush mini-game
│   │       ├── TechBroMiniGame.tsx     # Coding sprint vs. NEPA blackout mini-game
│   │       ├── AfrobeatsMiniGame.tsx   # Studio soundboard & hit single recorder
│   │       ├── AmalaModal.tsx          # Amala Shitta canteen custom plate builder
│   │       ├── QuiloxModal.tsx         # Club Quilox VIP bottle popping & dance floor
│   │       ├── CharacterCustomizer.tsx # Nepo vs. Lapo starter & avatar wardrobe
│   │       └── HelpTutorialModal.tsx   # In-game instructions & controls
│   └── lib/
│       ├── audioEngine.ts       # Web Audio API procedural synthesizer (zero mp3 assets)
│       ├── gameState.ts         # Databases (jobs, food, real estate, tweets, districts)
│       └── types.ts             # TypeScript interfaces for vitals, player & world
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```
