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

## Completed Features

- [x] Main menu with Oblivion-style UI
- [x] Universe map with alert system
- [x] Screen navigation system
- [x] Grid/scanline/vignette effects
- [x] Alert markers and list
- [x] Basic stasis chamber integration

## TODO

### Core Mechanics
- [ ] Map drill-down (galaxy → system → planet → region)
- [ ] Extraction mission (top-down drone gameplay)
- [ ] Lifeform 3D models (replace human body)
- [ ] Treatment system (stabilization, diagnostics, intervention)
- [ ] Collection hall / archive grid

### Polish
- [ ] Animated alert markers (pulsing)
- [ ] Map zoom/pan controls
- [ ] Smooth screen transitions
- [ ] Sound effects
- [ ] Keyboard navigation

### Content
- [ ] Multiple lifeform designs
- [ ] Planet/environment variety
- [ ] Evolution paths
- [ ] Deployment missions

## Git Repository

- **Repo:** https://github.com/DarkMatterGravity/Starfall
- **Live Site:** https://darkmattergravity.github.io/Starfall/
- **Visibility:** Public (for GitHub Pages)
- **LFS:** Tracks `*.fbx` and `*.glb` files

## Deployment

Push to `master` branch auto-deploys to GitHub Pages.

```bash
git add .
git commit -m "Update message"
git push origin master
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
