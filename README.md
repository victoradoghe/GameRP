# 🌐 GameRP — The Open-World Web-Based 3D Roleplay Universe

> **A browser-native, multiplayer-ready open-world roleplay (RP) sandbox built with Next.js 15, React 19, Three.js, and TypeScript.**
> *Think GTA V RP meets the modern open web — playable instantly anywhere on desktop or mobile, with zero 100GB downloads or launcher hurdles.*

---

## 📖 Vision & Philosophy

**GameRP** is an ambitious open-source initiative to build a **fully browser-based 3D roleplay platform**. 

While inspired by rich urban cultural hubs (starting with our iconic, vibrant Lagos city testbed — featuring bustling markets, yellow Danfo buses, and tech hubs), **GameRP is engineered for a global audience**:
- **Universal & Global**: Not restricted to any single demographic or culture. GameRP aims to host diverse metropolitan districts, customizable global cities (Tokyo, London, New York, Lagos, São Paulo), cross-cultural roleplay factions, and community-driven server economies.
- **Accessible Everywhere**: Instant browser play. No expensive gaming rigs required. If you have a browser with WebGL/WebGPU support, you can jump in and roleplay.
- **Deep Roleplay Systems**: Career progression, dynamic player economies, law enforcement, healthcare, real estate, interactive smartphone operating systems, and emergent social mechanics.

Whether you are a **Three.js / WebGL shader wizard**, a **multiplayer networking engineer**, a **game designer**, or a **full-stack React builder**, there is a place for you to shape the future of browser RP.

---

## 🎮 Core Features (Current & Live in v1)

- 🏙️ **Interactive 3D WebGL World (`LagosWorld3D.tsx`)**:
  - Procedural / stylized city architecture, roads, dynamic day/night ambient lighting, streetlights, and animated water.
  - Dynamic traffic AI (e.g. buses, commuters) navigating the grid.
  - Interactive landmark zones with custom interactions (e.g., bustling food hubs, nightlife lounges, tech corridors).
- 🚶 **Player Controller & Camera**:
  - Responsive WASD / Arrow movement with smooth turning and collision bounds.
  - Click/tap-to-walk raycasting and dedicated touch-friendly virtual controls for mobile gamers.
- 📱 **Virtual In-Game Smartphone OS (`EkoPhone.tsx`)**:
  - **Banking App**: Manage liquid cash, interest-bearing savings, and microloans.
  - **Hustle / Job Board**: Browse jobs and trigger active career shifts.
  - **Social Feed**: In-game dynamic social network with reactions and posts.
  - **Food Delivery**: Order local meals and refreshments to replenish vitals.
  - **Real Estate**: Rent or purchase properties ranging from budget studios to luxury penthouse villas.
  - **Grid & Utility Manager**: Monitor power supplies, backup generator fuel, and emergency services.
- 🕹️ **Interactive Skill & Career Mini-Games**:
  - *Public Transit Hustle*: Fare management, route timing, and street challenges.
  - *Tech & Coding Sprint*: Coding against the clock while managing unexpected utility outages.
  - *Studio Producer*: Soundboard and rhythm mechanics to record tracks and generate streaming royalties.
- 🎵 **Native Web Audio Procedural Synthesizer (`audioEngine.ts`)**:
  - Procedurally generated drum patterns, engine tones, horns, and ambient city soundscapes — **zero bulky MP3 download requirements**.
- 🎛️ **Character Customizer**:
  - Choose backgrounds, custom names, outfits, accessories, and stylistic themes.

---

## 🛠️ Tech Stack: Current vs. Target Evolution

### ⚡ Current Stack (V1 Foundation)
- **Frontend Framework**: [Next.js 15 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **3D Graphics Engine**: [Three.js](https://threejs.org/) with WebGL
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons + Glassmorphism
- **Audio**: Web Audio API (procedural synthesis & sound design)
- **Package Manager**: [pnpm](https://pnpm.io/)

### 🚀 Target Architecture & Roadmap (What We Are Migrating / Adding)

| Layer | Current V1 | Planned / Future Architecture |
| :--- | :--- | :--- |
| **3D Engine** | Vanilla Three.js | Migration to `@react-three/fiber` (R3F) + `@react-three/drei` for declarative components |
| **Physics** | Simple box/raycast distance math | Rapier3D / `@react-three/rapier` for realistic vehicle handling, ragdolls, and colliders |
| **Networking** | Single-player local state | Multiplayer WebSocket / WebTransport (Colyseus, Geckos.io, or LiveKit for spatial proximity voice chat) |
| **Asset Pipeline** | Procedural primitives + canvas textures | Compressed GLTF / GLB models with Draco compression, LOD (Level of Detail), and KTX2 textures |
| **Backend & DB** | Client React state / local persistence | Supabase / PostgreSQL for player inventories, persistent properties, and auth |
| **Voice Chat** | None | WebRTC spatial proximity voice chat (hear players louder as they get closer) |

---

## 🗺️ Contributor Roadmap: Where We Need Your Help!

We actively welcome contributions across the following major tracks:

### 1. 🌐 Global World & City Expansion
- [ ] **Multi-City Support**: Design modular district templates representing global cities (Neo-Tokyo, Manhattan, London, Paris, Downtown Lagos, etc.).
- [ ] **Custom Interior Environments**: Create enterable buildings (Police station, hospital, car dealership, music studios, convenience stores).
- [ ] **Weather & Day-Night System**: Volumetric fog, rain with puddle reflections, storm lighting, and seasonal themes.

### 2. 🚗 Vehicles & Physics Engine
- [ ] Integrate **Rapier3D physics** for vehicle drift, tire friction, suspension, and collisions.
- [ ] Drivable vehicles: Sports cars, motorcycles, public transit, bicycles, and boats.
- [ ] Garage customization (engine tuning, spray paint, rim swaps).

### 3. 👥 Multiplayer & Networking (The Big Leap)
- [ ] Prototype a real-time server using **Colyseus** or **Geckos.io** (UDP WebRTC for gaming).
- [ ] Sync player positions, rotations, animations, and emotes across clients with client-side prediction and interpolation.
- [ ] Spatial proximity voice chat (WebRTC / LiveKit) with radio frequencies for jobs (Police/EMS/Taxi).

### 4. 💼 Roleplay Systems & Economies
- [ ] **Factions & Jobs**:
  - 👮 **Law Enforcement**: Wanted levels, dispatch system, arrest mechanics, traffic citations.
  - 🚑 **EMS / Medical**: Injury states, triage, ambulance transports, prescription medicine.
  - 💼 **Civilian Economy**: Delivery drivers, real estate moguls, restaurant owners, mechanics.
  - 🕶️ **Underworld**: Heists, territory control, smuggling, secret black-market dealers.
- [ ] **Player Inventory & Items**: Grid-based inventory with drag-and-drop, usable tools, and equipment slots.

### 5. 🎨 Three.js / Visual Improvements
- [ ] Optimize render draw calls with instanced rendering (`InstancedMesh`) for props, foliage, and buildings.
- [ ] Post-processing pipeline: Bloom, ambient occlusion (SSAO), depth-of-field, and chromatic aberration.
- [ ] Skeletal rig / humanoid avatar animation system (Mixamo GLTF animations: idle, walk, run, jump, dance, emotes).

---

## 💻 Getting Started (Development Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.17+ or 20+)
- [pnpm](https://pnpm.io/) (v9 or v10 recommended: `npm install -g pnpm`)
- A modern browser with WebGL2 / WebGPU enabled (Chrome, Firefox, Brave, Edge, Safari)

### 1. Clone & Install
```bash
git clone https://github.com/victoradoghe/GameRP.git
cd GameRP
```
*(If developing directly inside the workspace folder `Project 1`, ensure your terminal is in that directory)*:
```bash
cd "Project 1"
pnpm install
```

### 2. Run Local Dev Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The game hot-reloads automatically when code changes are saved.

### 3. Lint & Typecheck
```bash
pnpm lint
pnpm build
```

---

## 📂 Project Structure

```
Project 1/
├── src/
│   ├── app/
│   │   ├── globals.css              # Custom styling, animations, HUD layout
│   │   ├── layout.tsx               # Viewport, PWA metadata, root HTML
│   │   └── page.tsx                 # Master game loop & state orchestrator
│   ├── components/
│   │   └── game/
│   │       ├── LagosWorld3D.tsx     # Three.js 3D viewport, scene graph, lights, meshes
│   │       ├── GameHUD.tsx          # Real-time player vitals (Health, Energy, Cash, Rep)
│   │       ├── EkoPhone.tsx         # Virtual Smartphone OS (Bank, Jobs, Social, Food)
│   │       ├── CharacterCustomizer.tsx # Appearance, wardrobe, character background
│   │       ├── DanfoMiniGame.tsx    # Urban transit mini-game
│   │       ├── TechBroMiniGame.tsx  # Coding sprint mini-game
│   │       ├── AfrobeatsMiniGame.tsx# Studio audio mixer mini-game
│   │       ├── AmalaModal.tsx       # Food & restaurant interaction system
│   │       ├── QuiloxModal.tsx      # Nightclub & social lounge interaction
│   │       └── HelpTutorialModal.tsx# Instructions & keyboard / mobile controls
│   └── lib/
│       ├── audioEngine.ts           # Web Audio API procedural sound engine
│       ├── gameState.ts             # Static DBs (jobs, items, properties, quests)
│       └── types.ts                 # Core TypeScript definitions (Player, Item, Vital, Job)
├── public/                          # Static assets, textures, 3D models (GLTF/GLB)
├── tailwind.config.ts               # Tailwind design system configuration
├── tsconfig.json                    # Strict TypeScript configuration
└── package.json                     # Scripts & dependencies
```

---

## 🤝 Contribution Guidelines

We love pull requests! To keep code quality high and gameplay buttery-smooth:

1. **Fork the Repository** and create your branch from `main`:
   ```bash
   git checkout -b feature/awesome-new-mechanic
   ```
2. **Follow Code Cleanliness**:
   - Write typed TypeScript (avoid using `any`).
   - Clean up Three.js materials, geometries, and event listeners in `useEffect` cleanup hooks to prevent WebGL memory leaks.
   - Test on both desktop (keyboard/mouse) and mobile (touch events / responsive HUD).
3. **Commit Messages**: Use clean, descriptive commits (e.g. `feat(world): add night rain weather effects`, `fix(audio): resolve audio context suspension on mobile`).
4. **Submit a Pull Request**: Provide screenshots or GIFs of visual changes and describe your implementation.

---

## 📜 License & Community

Distributed under the **MIT License**. See `LICENSE` for more information.

Got wild ideas for city maps, mechanics, or heists? Jump into the discussions, open an issue, or submit a PR — let's build the ultimate browser RP universe together! 🚀
