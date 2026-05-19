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
- [ ] Death mechanics (injury burden threshold → death)
- [ ] Dying animations (panels flash red when critical)
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

## Git Repository

- **Repo:** https://github.com/DarkMatterGravity/Starfall (private, source)
- **Public Repo:** https://github.com/DarkMatterGravity/Journey-app (encrypted deploy)
- **Live Site:** https://darkmattergravity.github.io/Journey-app/
- **Password:** `DrToppGear` (Staticrypt AES-256)
- **Note:** No Git LFS - GitHub Pages doesn't serve LFS files correctly

## Deployment

Uses `deploy.ps1` script to encrypt and push to public repo:

```bash
# Commit to private repo first
git add .
git commit -m "Update message"
git push origin master

# Then deploy (encrypts with Staticrypt, pushes to Journey-app)
powershell -File deploy.ps1
```

The script:
1. Copies files to `.deploy-temp/`
2. Encrypts `index.html` with Staticrypt
3. Force pushes to `Journey-app` repo
4. GitHub Pages serves the encrypted site

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
