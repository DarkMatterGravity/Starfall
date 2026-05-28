# Starfall: Extraction Protocol

Sci-fi recovery and triage game where players locate and extract unknown lifeforms from crash sites and disaster zones across the galaxy, then stabilize and revive them aboard a high-tech recovery vessel.

## High Concept

**Core Loop:** Scan → Extract → Stabilize → Preserve → Evolve → Deploy

You are not exploring the universe—you are responding to it. You operate as part of a lifeform recovery initiative, tasked with:
- Locating unidentified biological signatures
- Extracting them from unstable environments
- Preventing extinction events one lifeform at a time

## Design Pillars

| Pillar | Description |
|--------|-------------|
| **Cold vs Chaos** | Minimal, clinical UI (Oblivion-style) contrasted with vibrant, chaotic creatures |
| **Response, Not Exploration** | You're a rescue/recovery operation, not an explorer |
| **Care System** | Evolution through quality of care, not XP grinding |
| **Tactical Deployment** | Rescued lifeforms become tools for future missions |

## Terminology

**Never call them "aliens".**

During discovery:
- Indigenous Lifeform 67-A
- Unclassified Biological Entity
- Signal-Linked Lifeform

After recovery:
- [Galaxy] / [System] / [Planet] / [Lifeform ID] — "Gorlak the Crusher"
- Includes: Translated name, native glyphs/symbols, behavioral classification

## Game Flow

```
Main Menu
    ↓
Universe Map (alerts: crashes, battles, injuries)
    ↓
Galaxy Map (drill-down)
    ↓
Solar System Map (drill-down)
    ↓
Planet Map (drill-down)
    ↓
Region → Extraction Mission (top-down drone view)
    ↓
Your Ship → Stasis Chamber (3D treatment scene)
    ↓
Collection Hall (stasis chamber gallery)
```

## Project Structure

```
Starfall/
├── index.html              # Main HTML with all game screens
├── three-background.js     # Stasis Chamber Three.js scene (from Journey)
├── three-background-cyber.js # Backup style
├── CLAUDE.md               # This file
└── Mesh/
    ├── Body.fbx    # Placeholder body mesh (will be lifeforms)
    ├── Brain.fbx
    ├── Lungs.fbx
    ├── Liver.glb
    └── Stomach.fbx
```

## Running Locally

```bash
cd C:\Users\mattl\Documents\Starfall
python -m http.server 8000
# Visit http://localhost:8000
```

## Screen Architecture

### Main Menu
- Title: "STARFALL: Extraction Protocol"
- Tagline: "Recover. Preserve. Understand."
- Buttons: Begin Mission, Collection Archive, Stasis Chamber
- Oblivion-style grid overlay, scanlines, vignette
- System date display (futuristic year)

### Universe Map
- Galaxy view with alert markers (crash, battle, injury)
- Alerts panel showing active signals
- Breadcrumb navigation for drill-down
- Stats: Recovered count, Active Signals, Species discovered
- Deploy button to start extraction

### Stasis Chamber (Treatment)
- 3D lifeform visualization (Three.js)
- Vitals monitoring panel
- Treatment timeline
- Stabilization controls
- X-ray/diagnostic shader mode

### Collection Hall (TODO)
- Grid of recovered lifeforms
- Living specimen HUD (not trading cards)
- Full designation, origin, traits, status
- Deployment readiness

## UI Design System

### Color Palette
```css
--bg-dark: #0a0a0f;
--primary: #4fd1d9;      /* Cyan/teal */
--alert: #e85a3c;        /* Orange-red */
--warning: #f4a62a;      /* Yellow-orange */
--success: #4fd97f;      /* Green */
--text: #ffffff;
--text-dim: rgba(255, 255, 255, 0.5);
```

### Typography
- Display: Orbitron (headers, titles)
- Mono: Share Tech Mono (data, values, body text)

### Visual Elements
- Grid overlays (50px squares)
- Scanline effect
- Vignette (radial gradient to black edges)
- Corner bracket frames `⌜ ⌝ ⌞ ⌟`
- Pulsing alert markers

## Treatment Mechanics

### Phase 1: Stabilization
- Adjust atmosphere (O2, N2, exotic gases)
- Manage fluid levels
- Temperature regulation

### Phase 2: Diagnostic Mode
- Shader swap reveals internal damage
- Identify injury locations
- Assess severity

### Phase 3: Intervention
- Repair damaged areas
- Remove parasites
- Stabilize biological systems
- Tech modifications for severe damage

### Outcomes
- **Failure:** Cascading deterioration → death
- **Success:** Revival → archive entry → deployment ready

## Evolution/Devolution System

| Care Quality | Result |
|--------------|--------|
| Good care | Adapts, stabilizes, evolves |
| Poor care | Stress, regression, mutation |
| Special conditions | Branching evolution paths |
| Trauma recovery | Unlocks abilities |

## Deployment System

Recovered lifeforms help with missions based on traits:
- **Heavy lifeform** → pulls wreckage
- **Radiation-resistant** → enters toxic zones
- **Psychic/signal** → locates survivors
- **Tech-pilot (tiny)** → hacks systems
- **Aquatic/gas-based** → survives exotic atmospheres

## Combat (Secondary)

Combat exists only as **simulation/training** to keep ethics clean:
- Holo-training room
- Non-lethal sparring
- Behavioral conditioning
- Rescue scenario simulations
- Team synergy tests

PvP later as "Recovery Corps Field Trials" (not making injured creatures fight for sport).

## Living Specimen HUD

Each collected lifeform displays:
- 3D snapshot / animated idle pose
- Lifeform designation
- Native glyph name
- Origin: galaxy / system / planet / region
- Vitals
- Stability rating
- Trauma history
- Evolution stage
- Specialty tags
- Deployment readiness

Example:
```
INDIGENOUS LIFEFORM 67-A
GORLAK THE CRUSHER
Native glyphs: 𐌂◈⟁ϟ
Origin: Varnax System / Brakka-9 / Ash Belt
Status: Stable
Role: Heavy Extraction / Hazard Shield
Stage: Adult Form II
Risk: Aggression spike under heat stress
```

## Art Direction

| Element | Style |
|---------|-------|
| UI | Minimal, technical, Oblivion-style data systems |
| Lifeforms | Expressive, painterly, colorful, chaotic (CreatureBox-inspired) |
| Environment | Cold, data-driven contrast with vivid creatures |

## Audio Direction (TODO)

- UI: Subtle clicks and tones
- Lifeforms: Organic breathing and instability
- Treatment: Rising tension layers

## Taglines

- "Recover. Preserve. Understand."
- "Every signal is a lifeform."
- "Not all life was meant to survive. You decide what does."

## Tech Stack

- Three.js 0.160.0 for 3D scenes
- Vanilla JavaScript (no framework)
- CSS variables for theming
- Tesseract.js (preserved from Journey, may repurpose)

## 3D Lifeform Models (Planned)

### Model Format
- **GLB/GLTF** preferred - embeds skeleton and animations in single file
- Rig and animate in **Meshy** (or Blender), export as GLB
- Budget ~500KB-2MB per creature depending on complexity
- Lazy-load models as needed

### Rendering by Context
| Context | Rendering |
|---------|-----------|
| Stasis Chamber | Silhouette shader (like current body), static or subtle breathing |
| Collection/Storage | Fully textured, idle animation looping |
| Extraction Scene | Full render + movement animations |

### Animation System
Three.js provides `AnimationMixer` for skeletal animation. We'll build a lightweight state machine wrapper (~100-150 lines).

**Core pattern:**
```javascript
const loader = new GLTFLoader();
loader.load('creature.glb', (gltf) => {
  const model = gltf.scene;
  const mixer = new AnimationMixer(model);
  const idleClip = gltf.animations.find(a => a.name === 'Idle');
  mixer.clipAction(idleClip).play();
  // mixer.update(deltaTime) in render loop
});
```

### Animation State Machine (To Build)
```javascript
const CreatureAnimator = {
  states: {
    idle: { clip: 'Idle', loop: true },
    hurt: { clip: 'Hurt', loop: false, next: 'idle' },
    alert: { clip: 'Alert', loop: true },
    dying: { clip: 'Death', loop: false }
  },

  transitions: {
    'idle->hurt': { duration: 0.2 },
    'hurt->idle': { duration: 0.5 },
    'idle->alert': { duration: 0.3 },
    '*->dying': { duration: 0.1 }
  },

  setState(newState) {
    // Uses AnimationAction.crossFadeTo() for smooth blending
  }
};
```

### Blend Scenarios
| Trigger | Transition |
|---------|------------|
| Extracted, critical | `idle` → `hurt` (fast 0.2s) |
| Stabilized | `hurt` → `idle` (slow 0.5s ease) |
| Player approaches | `idle` → `alert` |
| Treatment applied | blend `hurt` weight down over time |

### Additive Blending (Layered)
- Base layer: idle breathing
- Additive layer: occasional twitch, look around, injury favoring

## Lifeform Generator

Procedural system for generating lifeform data:

```javascript
LifeformGenerator = {
  // Name generation: prefix + suffix + optional title
  // e.g., "Gorak the Ancient", "Zyx", "Tharion"

  // Age: "Unknown", "~1.2 million years", "247 years", "Estimated: 50,000+ years"

  // Origin: Galaxy / System / Planet / Region
  // e.g., "Andromeda Reach / Theron IV / Crystal Caverns"

  // Traits: ["Heavy", "Armored", "Radiation-Resistant", ...]

  // Injuries by alert type:
  //   crash: "Crash Trauma", "Impact Fractures"
  //   battle: "Combat Wounds", "Energy Burns"
  //   injury: "Environmental Exposure", "Toxic Contamination"

  // Status/Severity: critical, high, moderate
}
```

### Lifeform Name Database
Good generated names are automatically saved to localStorage (`starfall_lifeform_names`).
- Keeps last 100 names and designations
- Can be used for name suggestions or preventing duplicates

## Injury System

Injuries are auto-generated when a lifeform is loaded into stasis, based on their alert type:

| Alert Type | Injury Category | Growth Rate | Can Spread | Color |
|------------|-----------------|-------------|------------|-------|
| **Crash** | Radiation Tumors | 1.5-3.0x (aggressive) | Yes (3%) | Red/hot |
| **Battle** | Combat Wounds | 0.5-1.5x (slower) | No | Yellow/warm |
| **Exploration** | Parasitic Infection | 2.0-4.0x (fast) | Yes (5%) | Blue/cold |

### Injury Types by Category
**Crash (Radiation Tumors):**
- Radiation Tumor, Impact Mass, Cryo-Burn, Decompression Nodule, Shrapnel Fragment

**Battle (Combat Wounds):**
- Plasma Burn, Energy Laceration, Projectile Wound, Neural Damage, Chemical Burn

**Exploration (Parasitic Infection):**
- Parasite Cluster, Fungal Growth, Toxic Buildup, Pathogen Colony, Symbiote Mass

### Injury Count by Severity
| Severity | Injuries |
|----------|----------|
| Critical | 4-6 |
| High | 3-5 |
| Moderate | 2-3 |
| Low | 1-2 |

## Treatments Panel

Replaced the medication panel with draggable treatments:

| Treatment | Target | Effect |
|-----------|--------|--------|
| **Nanobots** | Tumors/radiation | Shrinks radiation damage |
| **Bio-Foam** | Wounds/burns | Seals combat injuries |
| **Anti-Parasitic** | Parasites/infections | Kills parasitic growths |
| **Stasis Field** | All injuries | Temporarily halts growth |

Drag treatments onto injury sites to apply.

## Completed Features

- [x] Main menu with Oblivion-style UI
- [x] Universe map with alert system
- [x] Screen navigation system
- [x] Grid/scanline/vignette effects
- [x] Basic stasis chamber integration
- [x] Procedural lifeform generator (names, ages, traits, injuries, origins)
- [x] Lifeform info panel in stasis chamber (replaces patient panel)
- [x] Alert → Deploy → Stasis flow (lifeform data populates on deploy)
- [x] Status color coding (critical/high/moderate/recovered)
- [x] Cinematic map drill-down (universe → galaxy → system → planet → region)
- [x] Single signal notification (replaced multi-alert list)
- [x] Click ping or notification to zoom through levels
- [x] Animated map views (orbiting planets, twinkling stars, pulsing pings)
- [x] Injury generation system based on alert type (tumors/wounds/parasites)
- [x] Auto-place injuries on 3D model when lifeform loads
- [x] Lifeform name database (saves good generated names)
- [x] Treatments panel (replaces medication toggles)
- [x] Acquisition timer (real-time from pickup)

## TODO

### Core Mechanics
- [ ] Treatment drag-and-drop functionality
- [ ] Treatment effects (shrink injuries, halt growth)
- [ ] Real-time injury growth (instead of simulated timeline)
- [x] Treatment drag-and-drop functionality
- [x] Treatment effects (shrink injuries, halt growth)
- [x] Real-time injury growth (every 2 seconds)
- [x] Death mechanics (250mm burden → 10s → death)
- [x] Dying animations (red flashing panels)
- [ ] Extraction mission (top-down drone gameplay)
- [ ] Lifeform 3D models (replace human body placeholder)
- [ ] Animation state machine with blending
- [ ] Collection hall / archive grid
- [ ] Recover lifeform button → save to collection

### Polish
- [ ] Map zoom transition effects (stars flying by)
- [ ] Smooth screen transitions
- [ ] Sound effects
- [ ] Keyboard navigation

### Content
- [ ] Multiple lifeform designs
- [ ] Planet surface images/meshes
- [ ] Evolution paths
- [ ] Deployment missions

## Death Mechanics

**Injury Burden Thresholds:**
| Burden (mm) | Status | Effect |
|-------------|--------|--------|
| < 105 | Stable | Normal operation |
| 105-150 | Serious | Warning status |
| 150-250 | Critical | Red status indicator |
| 250+ | Dying | 10 second countdown, red flashing |
| 250+ for 10s | Dead | "SPECIMEN LOST", grayscale filter |

**Injury Growth:**
- Injuries grow every 2 seconds based on growth rate
- Tumors: 1.5-3.0x growth rate (aggressive)
- Wounds: 0.5-1.5x growth rate (slower)
- Parasites: 2.0-4.0x growth rate (fast)
- Tumors/parasites can spread to new organs

**Treatment Effectiveness:**
| Treatment | Tumors | Wounds | Parasites |
|-----------|--------|--------|-----------|
| Nanobots | 100% | 30% | 50% |
| Bio-Foam | 30% | 100% | 30% |
| Anti-Parasitic | 20% | 20% | 100% |
| Stasis Field | 70% | 70% | 70% |

*Effectiveness = percentage of injury size that gets removed*

## Git Repository

- **Repo:** https://github.com/DarkMatterGravity/Starfall
- **Live Site:** https://darkmattergravity.github.io/Starfall/
- **Visibility:** Public (no password)
- **Note:** No Git LFS - GitHub Pages doesn't serve LFS files correctly

## Deployment

Starfall deploys directly from GitHub Pages (master branch). Just push to deploy:

```bash
git add .
git commit -m "Update message"
git push origin master
# GitHub Pages auto-deploys from master branch
```

## Origin

Starfall is a game project built from the Journey codebase (medical visualization app). Journey remains untouched at `C:\Users\mattl\Documents\Journey`. This is a separate creative project exploring the "galactic creature rescue" concept.

## Reference Materials

Concept documents located at:
- `C:\Users\mattl\Downloads\Starfall_Extraction_Concept_v2.pdf`
- UI Reference images: `C:\Users\mattl\Downloads\reference\` (Oblivion FUI screenshots)

## Key Design Decisions

1. **Not a creature battler** - This is "rescue collector + care sim + tactical deployment"
2. **Combat is secondary** - Only as simulation/training, not the main loop
3. **Oblivion UI style** - Cold, minimal, data-driven interface
4. **CreatureBox art style** - For lifeforms: painterly, exaggerated, colorful
5. **Terminology matters** - Never "aliens", always clinical then personal names

## Recent Implementations (Latest Session)

### Simplified Navigation (3 Levels)
- **Universe** → **System** → **Planet** (reduced from 5 levels)
- Clickable breadcrumbs for navigation back
- Infinite canvas zoom effect between levels (two-layer crossfade)

### Signal/Alert System
- 5-8 signals spawn at universe level
- Signals filter by level (universe: all, system: that system only, planet: selected signal)
- Each signal has expiration timer affecting lifeform condition
- ~15% are false signals (no lifeform, show "FALSE TRANSMISSION" message)

### Rarity System (RARITY_TIERS constant)
```javascript
const RARITY_TIERS = {
  common:    { weight: 55, label: 'COMMON',    color: '#9ca3af', traitBonus: 0 },
  uncommon:  { weight: 25, label: 'UNCOMMON',  color: '#22c55e', traitBonus: 1 },
  rare:      { weight: 12, label: 'RARE',      color: '#3b82f6', traitBonus: 2 },
  epic:      { weight: 6,  label: 'EPIC',      color: '#a855f7', traitBonus: 3 },
  legendary: { weight: 2,  label: 'LEGENDARY', color: '#f59e0b', traitBonus: 4 }
};
```
- Higher rarity = bonus traits, visual glow effects
- Rarity badges displayed on signals and in stasis chamber

### Timer Decay → Condition System
- `decayFactor` calculated from signal timer progress (0-1)
- Condition: pristine (<30%), good (<50%), fair (<75%), poor (>=75%)
- Higher decay = more injuries, larger sizes, faster growth rates

### Saved State System
- `SAVED_THRESHOLD = 10` mm total burden
- When all injuries treated (burden ≤ 10mm), triggers saved overlay
- Green glow effect, "LIFEFORM STABILIZED" message
- Two buttons: **COLLECT** (add to archive) or **RELEASE** (let go)

### Death State System
- `DEATH_BURDEN = 250` mm, `DEATH_DELAY = 10000` ms
- Red overlay with "SPECIMEN LOST" and lifeform name
- **RETURN TO MAP** button to go back to universe

### Collection Archive
- Access from main menu "Collection Archive" button
- Cards with procedural avatars based on lifeform type:
  - Crash: alien face icons
  - Battle: combat icons
  - Injury: creature icons
- Rarity-colored backgrounds and animated glows (epic/legendary pulse)
- Sorted by rarity (legendary first), then recovery date

### Visual Effects
- `sf-scanlines` and `sf-noise` on all screens (CSS-based)
- Stasis chamber has unique glowing/breathing effect (Three.js shader)
- Consistent map background color `#0a0a0f` across all levels

### Vitals Panel (Simplified)
- Renamed from "Spider Plot" to "VITALS"
- Removed graph type dropdown (was 11 chart types)
- Removed "Diameter (mm)" Y-axis label
- Just shows injury tracking graph

### Key State Variables
```javascript
let isLifeformDead = false;
let isLifeformSaved = false;
let isDying = false;
let criticalStartTime = null;
```

### Key Functions
- `generateSignal()` - creates signal with rarity, false signal chance, coords
- `checkSavedCondition(burden)` - triggers saved when burden ≤ threshold
- `checkDeathCondition(burden)` - triggers death sequence
- `showSavedOverlay()` / `showDeathOverlay()` - UI overlays
- `collectLifeform()` / `releaseLifeform()` - collection actions
- `getVisibleSignals()` - filters signals by current map level
- `zoomToLevel(targetLevel)` - breadcrumb navigation

## Planet Types System

Seven distinct planet types with unique terrain visuals:

```javascript
const PLANET_TYPES = [
  { name: 'ROCKY',     index: 0 },  // Gray base, lava veins
  { name: 'FORESTED',  index: 1 },  // Dark green, bioluminescent veins
  { name: 'OCEANIC',   index: 2 },  // Blue-gray, water pools
  { name: 'VOLCANIC',  index: 3 },  // Dark charcoal, heavy lava
  { name: 'TOXIC',     index: 4 },  // Sickly green, toxic pools
  { name: 'ICE',       index: 5 },  // Blue-white, ice cracks
  { name: 'GAS',       index: 6 }   // Swirling purple, plasma veins
];
```

- Planet type determined by hash of planet name (deterministic)
- Each type has distinct base color tint and vein colors
- Type displayed in planet view header

## WebGL Terrain Shader

GPU-accelerated procedural terrain rendering:

```javascript
const TerrainShader = {
  vertexSource: `...`,
  fragmentSource: `
    // Simplex noise for terrain heightmap
    // FBM (fractal Brownian motion) for detail
    // Planet-type-specific color functions
    // Ridge noise for terrain features
    // Animated vein patterns (lava, water, etc.)
  `
};
```

Key functions:
- `initTerrainShader()` - Creates WebGL context, compiles shaders
- `renderTerrain()` - Renders terrain to offscreen canvas
- `hashString(str)` - Deterministic seed from planet name

Stored in `ScannerState`:
- `terrainGL` - WebGL context
- `terrainProgram` - Compiled shader program
- `terrainCanvas` - Offscreen rendering canvas

## Extraction Animation

Beam-down animation when extracting specimens:

```javascript
let extractionState = {
  active: false,
  startTime: 0,
  signal: null,
  phase: 0  // 0-3: beam down, pulse rings, particles, complete
};
```

Animation phases:
1. Beam descends from top to specimen location
2. Pulse rings expand outward
3. Particles rise up the beam
4. Transition to stasis chamber

Key functions:
- `startExtraction(signal)` - Initiates extraction sequence
- `drawExtractionAnimation(ctx, canvas)` - Renders animation frame
- `completeExtraction()` - Transitions to stasis chamber

## HTML Overlay Buttons

Map buttons use HTML overlays for reliable click detection:

```html
<div class="map-container">
  <canvas id="map-canvas"></canvas>
  <button id="btn-scan-overlay">INITIATE SCAN</button>
  <button id="btn-extract-overlay">EXTRACT SPECIMEN</button>
</div>
```

Button positioning:
- **INITIATE SCAN**: Centered over map (`left: 50%`, `top: 50%`)
- **EXTRACT SPECIMEN**: Positioned under specimen location (dynamic)

Visibility controlled by `updateMapUI()` based on:
- Current map level (planet level only)
- Scan state (before/after scan)
- Signal found state

## Injury System Architecture (Unified with Journey)

Injuries are now managed by `updateSimulation()` in three-background.js, matching Journey's tumor system architecture for smooth visualization and graph rendering.

### Why This Matters
- **Before:** Two separate systems (index.html setInterval every 2s + three-background.js)
- **After:** Single system in `updateSimulation()` running every frame

### Injury Growth in updateSimulation()
```javascript
if (tumor.userData.isInjury) {
  // Check stasis (treatment effect)
  const inStasis = tumor.userData.stasisUntil && Date.now() < tumor.userData.stasisUntil;

  if (!inStasis) {
    // Check active medication toggles
    for (const [medId, isActive] of Object.entries(activeMedications)) {
      if (isActive) {
        const effectiveness = MEDICATION_DATABASE[medId].effectiveness[injuryCategory];
        growthMultiplier *= (1 - effectiveness * 0.5);
        // High effectiveness meds also shrink injuries
      }
    }

    // Apply growth with medication reduction
    const growthPerMonth = growthRate * 1.5 * growthMultiplier;
    currentSizeMM += growthPerMonth * deltaMonths - shrinkAmount;
  }

  // Smooth 10% lerp interpolation (like Journey)
  tumor.scale.setScalar(tumor.scale.x + (targetScale - tumor.scale.x) * 0.1);

  // Record data for smooth graph curves
  recordTumorData(tumor, currentSizeMM);
}
```

### Key Benefits
1. **Smooth visualization** - 10% lerp per frame instead of jumping every 2 seconds
2. **Smooth graph lines** - Data recorded every frame tied to `currentMonth`
3. **Medication toggles work** - Active meds reduce injury growth in real-time
4. **Stasis respected** - Treatments halt growth when `stasisUntil` is set

## Treatment System

### Two Ways to Treat Injuries

**1. Drag-and-Drop (from treatments panel)**
- Instant shrink effect based on effectiveness
- Visual pulse: injury grows 1.5x then shrinks to new size
- Color flash: green for healing, blue for stasis
- Applies to closest injury within 100px of drop point

**2. Toggle Medications (top buttons)**
- Ongoing growth reduction while active
- Stacks with multiple active medications
- Visual effects: nanobot swarm (nanobots), cryo field (stasis)

### Treatment Effectiveness Matrix
| Treatment | Crash (Radiation) | Battle (Wounds) | Injury (Parasites) |
|-----------|-------------------|-----------------|-------------------|
| Nanobots | 100% | 30% | 50% |
| Bio-Foam | 30% | 100% | 30% |
| Anti-Parasitic | 20% | 20% | 100% |
| Stasis Field | 70% | 70% | 70% |

### Drag-Drop Detection
Uses screen-distance instead of raycaster (more reliable for small objects with depthTest:false):
```javascript
// Project injury to screen coordinates
const screenPos = worldPos.project(camera);
const screenX = (screenPos.x * 0.5 + 0.5) * rect.width;
const screenY = (-screenPos.y * 0.5 + 0.5) * rect.height;

// Find closest within 100px radius
const dist = Math.sqrt(Math.pow(x - screenX, 2) + Math.pow(y - screenY, 2));
if (dist < 100) closestInjury = injury;
```

## Graph System

### Clearing Between Specimens
When loading a new specimen, `clearAllTumors()` now resets:
- `currentMonth = 0` (timeline position)
- `isPlaying = false` (simulation state)
- `tumorGrowthData.clear()` (graph data)
- Canvas cleared directly

### Smooth Curve Rendering
- Data points recorded every frame (not every 2 seconds)
- Only adds new point if `currentMonth` changed by > 0.05
- Canvas `lineTo()` connects dense points for smooth appearance

## Stasis Chamber Entry Animation

Body rises from below with easeOutBack overshoot:
```javascript
let entryAnimation = {
  active: false,
  startTime: 0,
  duration: 700,  // ms
  startY: -3,
  targetY: CONFIG.humanBody.position.y
};

function easeOutBack(t) {
  const c1 = 0.6;  // Reduced overshoot
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
```

## Visual Effects

### Medication Toggle Effects
- **Nanobots toggle** → Dark particle swarm crawling on body surface (~150 particles)
- **Stasis toggle** → Translucent blue ellipsoid shell with wireframe overlay

### Treatment Application Effect
- Injury pulses to 1.5x scale
- Color changes to treatment color (green heal / blue stasis)
- Smooth 500ms animation back to new size

## Legacy Journey Code

### Disabled Features
- Subject loading from localStorage skipped (check `if (subjectMenu)`)
- Old tumor growth profiles not used for injuries
- Complex medication response system (`determineTumorResponse`) bypassed for injuries

### Protected Injury Resets
Timeline reset and reset button skip injuries:
```javascript
if (tumor.userData.isInjury) return; // Don't reset injuries
```

## Important Code Locations

| Feature | File | Line(s) |
|---------|------|---------|
| Injury growth logic | three-background.js | ~3406-3456 |
| Treatment drag-drop | index.html | ~7502-7550 |
| Treatment application | index.html | ~7600-7680 |
| Graph data recording | three-background.js | ~5660-5680 |
| clearAllTumors (API) | three-background.js | ~2687-2715 |
| Medication toggles | three-background.js | ~3192-3235 |
| Entry animation | three-background.js | ~2261-2301
