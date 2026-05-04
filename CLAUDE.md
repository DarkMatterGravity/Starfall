# Journey - 3D Medical Visualization

Interactive Three.js scene with a human body model and draggable tumor placement system.

## Background: Bedrock (Predecessor App)

Journey is a web-based reimplementation of concepts from **Bedrock**, a Unity/iPhone immuno-oncology visualization app. The original Bedrock app was designed to visualize individual tumor dynamics over time for multiple audiences:

### Bedrock's Target Users
1. **Patients** - Patient-friendly radiology reports with visual tumor representation
2. **Oncologists** - Dashboard view of all patients, identify oligoprogression (mixed response)
3. **Clinical Researchers** - Track trials with spaghetti/waterfall/PFS plots at lesion level
4. **QSP Modelers** - Simulate virtual tumors/patients/trials with realistic pathophysiology
5. **Students** - Interactive textbook for oncology education ("Virtual Professor")

### Bedrock Features NOT YET in Journey
| Feature | Description |
|---------|-------------|
| **Multi-Patient Dashboard** | Grid of patient silhouettes, click to drill down |
| **QSP Simulation Parameters** | User-defined growth rate, CTL density, T-helper cells, T-regulatory cells |
| **Virtual Clinical Trials** | Compare cohorts (drug A vs B vs placebo), Phase I/II/III simulation |
| **Manual Target/Non-Target** | User marks lesions as Target or Non-Target for RECIST (Journey auto-selects top 5) |
| **Educational Module** | Lessons on tumor biology, challenge questions, self-directed learning |
| **Structured Data Import** | Spreadsheet import for clinical data (Journey has OCR only) |
| **Additional Clinical Data** | PK data, biomarkers (PD-L1), adverse events, anti-drug antibodies |
| **Cohort Comparison** | Compare across cohorts with bootstrapping, historical controls |

### PD-L1 Biomarker System (Implemented)
PD-L1 expression is now a tumor property affecting ICI medication response:
- **Categories**: Negative (<1%), Low (1-49%), High (≥50%)
- **Impact**: PD-L1 modifier for ICI medications (Keytruda, Opdivo):
  - High: 1.5x boost to ICI effectiveness
  - Low: 1.0x baseline (no change)
  - Negative: 0.4x reduction (60% less effective)
- **Manual input**: Dropdown in tumor creation panel
- **OCR extraction**: Parses "PD-L1 TPS: 80%", "PD-L1 positive/negative", etc.
- **Persistence**: Stored per tumor in localStorage and exam history
- **Display**: Shown in tumor info dialog with color coding (green/yellow/red)

## Git Repository

- **Remote**: https://github.com/DarkMatterGravity/Journey (private)
- **LFS**: Tracks `*.fbx` and `*.glb` files (large mesh assets)

## Project Structure

```
Journey/
├── index.html              # Main HTML with UI panels, Three.js import map
├── three-background.js     # Main Three.js scene (~7200+ lines)
├── three-background-cyber.js # Backup of cyber/dark style
└── Mesh/
    ├── Body.fbx    # Human body (Meshy remesh, 1.1MB)
    ├── Brain.fbx   # Brain (Meshy remesh, 128KB)
    ├── Lungs.fbx   # Lungs (Meshy remesh, 133KB)
    ├── Liver.glb   # Liver (209KB)
    └── Stomach.fbx # Stomach (Meshy remesh, 126KB)
    # Total: 1.7MB (was 50MB+ before optimization)
```

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                   [Medication Toggles]      │
│                            (Dynamic: Keytruda | Opdivo...)  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────────────┐   ┌─────────────────┐             │
│ │ Patient Info Panel   │   │  CREATE TUMOR   │             │
│ │ (wider, 380px min)   │   │    [tumor]      │  ← 2D HTML  │
│ │ ────────────────────│   │   25 mm         │    panel    │
│ │ Emily Davis  ▼       │   │  Size: [___] mm │             │
│ │ ──────────────────── │   │ Drag to body    │             │
│ │ DOB: 07/14/1970      │   └─────────────────┘             │
│ │ EXAM: 04/03/2026     │                                   │
│ │ SCAN: CT Abdomen     │      ┌───────┐                    │
│ │ HOSP: Harborview     │      │       │                    │
│ │ PHYS: Dr. Smith      │      │ BODY  │  ← 3D human model  │
│ │ ──────────────────── │      │       │                    │
│ │ [Add Report to Pat.] │      └───────┘                    │
│ │ [Delete Patient]     │                                   │
│ └──────────────────────┘                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Timeline Panel (600px)                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Spider Plot - Tumor Diameter (mm) vs Time (months)      │ │
│ │ Y: 70mm ─┬──────────────────────────────────────────    │ │
│ │          │    /\                                        │ │
│ │          │   /  \___  (tumor growth lines)              │ │
│ │ Y: 0mm  ─┴──────────────────────────────────────────    │ │
│ │           0    3    6    9   12   15   18 months        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [▶ Play] ════════════════════════════════ [Reset]           │
└─────────────────────────────────────────────────────────────┘
│                                    [Upload Radiology Report]│
└─────────────────────────────────────────────────────────────┘
```

## Running Locally

```bash
cd C:\Users\mattl\Documents\Journey
python -m http.server 8000
# Visit http://localhost:8000
```

## Key Features

### Human Body Rendering
- **Inverted hull technique** for clean contour outlines
- Pushes vertices outward along normals, renders back faces only
- White outline with teal-gray fill (medical illustration style)
- Uses high-poly Anatomy.fbx (low-poly showed polygon edges)

### Tumor Creation Panel (2D HTML)
- **2D HTML panel** with tumor preview, size input, and drag instructions
- Procedural lumpy sphere geometry (IcosahedronGeometry with noise displacement)
- Size input field in millimeters (0-70mm range)
- Drag tumor from panel onto body to place
- X-ray effect: tumors visible inside body via depth buffer manipulation
- Dropped tumors rotate with body during orbit
- New tumor ready in panel after each placement
- **Anatomical region detection**: tumors tagged by body region when dropped
- **Info dialog**: click dropped tumor to see region and size, option to surgically remove
- **Selection highlight**: clicked tumor brightens (cyan) with pulse rings emanating outward

### 3D Organ Meshes
Real anatomical organ models loaded with x-ray rendering (calibrated for Body.fbx at scale 0.015):

| Organ | File | Position | Scale | Notes |
|-------|------|----------|-------|-------|
| Brain | Brain.fbx | (0, 90, -1) | 0.11 | Meshy remesh (128KB) |
| Lungs | Lungs.fbx | (0, 52, -6) | 0.19 | Meshy remesh (133KB) |
| Liver | Liver.glb | (0, 25, -0.4) | 4.0 | Rotated (PI, PI, 0) |
| Stomach | Stomach.fbx | (0, 11, -0.4) | 0.12 | Meshy remesh (126KB) |

**Rendering:**
- Solid fill matching body color (0x607a79)
- No outlines on organs (cleaner look, tumors stand out more)
- X-ray effect (depthTest: false, clearDepth)
- Body outline is commented out but can be re-enabled (lines 372-375)

**Tumor Placement:**
- Tumors dropped on organs are repositioned inside the organ mesh
- Uses blend: 70% toward organ center, 30% from drop point for variation
- `repositionTumorsIntoOrgans()` pulls existing tumors into organs

### Anatomical Regions
Region detection now uses organ mesh collision (preferred) with Y/X range fallback:

**Mesh Collision Detection:**
- Brain: Sphere radius check from mesh center
- Lungs: Ellipsoid collision, determines Left/Right by X position
- Liver: Sphere radius check from mesh center

**Fallback Y/X Ranges:**

| Region | Y Range | X Range |
|--------|---------|---------|
| Brain | 1.55-1.85 | -0.10 to 0.10 |
| Lungs (L/R) | 1.30-1.50 | ±0.03 to ±0.12 |
| Breast (L/R) | 1.25-1.38 | ±0.02 to ±0.10 |
| Liver | 1.05-1.25 | -0.10 to 0.02 |
| Stomach | 1.00-1.20 | -0.02 to 0.10 |
| Other | fallback | fallback |

### Camera Controls
- OrbitControls with damping (0.08 factor)
- Zoom speed: 0.3 (smooth, incremental)
- Zoom in only - can't zoom out past starting position (maxDistance: 6.0)
- Min distance: 3.6 (40% closer than start)
- No panning, orbit only
- Target: body center (0, 0.5, 0)

### UI Hints
- **"Drag to body to place"** - shown in tumor creation panel
- **Size input field** - allows setting tumor size in mm before dragging

### Tumor Creation Panel
- 2D HTML panel positioned upper-right area
- Shows tumor preview sphere
- Size display and input field (mm)
- "Drag to body to place" instruction
- Panel styled to match dark UI theme

### Timeline Simulation
18-month playback simulation showing tumor growth over time:

**Controls:**
- Play/Pause button starts/stops simulation
- Progress bar shows current month (0-18)
- Reset button returns to month 0 and clears all state

**Spider Plot (Tumor Diameter Chart):**
- Canvas-based line chart (600px wide panel)
- Y-axis: 0-70mm tumor diameter (24px label)
- X-axis: 0-18 months
- Each tumor gets unique color and tracked line
- Real-time updates as simulation plays
- **2x Scale button**: Toggle between 800x500 and 1600x1000 canvas
- **Click to select**: Click on a tumor line to highlight that tumor and open info dialog
- **Surgical removal**: Removed tumors show as dotted gray lines (preserved history)
- **Projected trajectory**: Dotted gray line shows where tumor would have grown without medication (appears when meds create >0.5mm divergence)

**Waterfall Plot (Percent Change):**
- Dropdown to select graph type (Spider/Waterfall/PFS)
- Shows percent change from baseline for each tumor
- Bars sorted by response (best responders on left)
- Color coding:
  - Green: Partial Response (≤-30%)
  - Cyan: Stable/shrinking (<0%)
  - Yellow: Stable/growing (≥0%, <+20%)
  - Red: Progressive Disease (≥+20%)
- RECIST threshold lines at -30% (PR) and +20% (PD)
- Real-time updates during simulation
- Removed tumors shown as gray bars

**Progression-Free Survival Plot (Kaplan-Meier):**
- Shows proportion of tumors without progression over time
- Step-down curve when tumors reach +20% growth (RECIST PD)
- Confidence band shading
- Statistics displayed:
  - Current PFS percentage
  - Tumors at risk vs progressed
  - Median PFS (when 50% crossed)
- Tick marks at progression events
- 50% reference line for median
- Real-time updates during simulation

**Swimmer Plot (Treatment Timeline):**
- Horizontal bars for each tumor showing duration
- Event markers:
  - Green triangle (down): Partial Response achieved
  - Red triangle (up): Progressive Disease
  - White X: Surgical removal
- Color-coded bars by response status
- Current time vertical line
- Legend for markers
- Real-time updates during simulation

**SLD Plot (Sum of Longest Diameters):**
- Single line showing total tumor burden over time
- RECIST thresholds relative to baseline:
  - PR line at -30%
  - PD line at +20%
- Data points at each measurement
- Current SLD value and % change displayed
- This is what RECIST actually uses for assessment

**Best Overall Response Bar Chart:**
- Shows the BEST percent change each tumor achieved
- Sorted by response (best responders on left)
- RECIST threshold lines (-30% PR, +20% PD)
- Color coding by response category
- Useful for determining best response during treatment

**Response Categories Donut Chart:**
- Pie/donut showing distribution of responses:
  - CR: Complete Response (tumor gone)
  - PR: Partial Response (≤-30%)
  - SD: Stable Disease (-30% to +20%)
  - PD: Progressive Disease (≥+20%)
- Center shows total tumor count
- Legend with counts per category
- Overall response assessment displayed
- Updates in real-time during simulation

**Duration of Response (DOR) Plot:**
- Shows how long each responding tumor maintained PR/CR
- Horizontal bars for tumors that achieved ≤-30% response
- Duration in months displayed on each bar
- Ongoing responses shown with arrow indicator
- Sorted by duration (longest first)
- Average duration statistic displayed

**Tumor Heatmap:**
- Grid visualization: tumors (Y) × time (X)
- Color intensity shows % change from baseline
- Green = shrinkage, Red = growth
- Color gradient legend
- Great for visualizing many tumors at once
- Removed tumors marked with ✕

**Growth Rate Plot:**
- Shows tumor growth velocity (mm/month)
- Separate line for each tumor
- Positive = growing, Negative = shrinking
- Zero line highlighted
- Legend showing tumor regions
- Identifies aggressive vs slow-growing tumors

**Target vs Non-Target Plot (RECIST):**
- Largest 5 tumors = "Target" (cyan line)
- Remaining tumors = "Non-Target" (orange line)
- Shows aggregate SLD % change for each category
- RECIST threshold lines (-30% PR, +20% PD)
- Per RECIST 1.1 guidelines for lesion classification
- Current values displayed

**Variable Growth Rates:**
- Each tumor assigned random growth profile on simulation start
- Base doubling time: 60-150 days (varies per tumor)
- Growth variance: ±20% randomization
- **Spike mechanic**: 2% chance per month for sudden growth acceleration

**Metastasis System:**
- Random chance of new metastases spawning during simulation
- Based on total tumor burden and time
- New tumors appear at random body locations
- **NEW MET notifications**: Flashing labels with lines pointing to new tumors
- Notifications persist until simulation ends

### Patient Info Panel
Combined patient info display with subject/patient selector:

**Panel Contents:**
- Patient name (editable, click to edit)
- Expandable dropdown (▼) to switch patients or create new
- DOB, Exam Date, Scan Type, Hospital, Physician fields
- "Add Report to Patient" button - uploads additional report to current patient
- Delete Patient button (red) - opens custom confirmation modal
- Custom styled scrollbar for patient list

**Features:**
- Auto-populated from OCR when uploading radiology reports
- Editable patient name via contenteditable
- Expandable patient list with sliding animation
- "+ New Patient" button to create blank patient
- Add Report to Patient builds longitudinal timeline across multiple scans
- Delete Patient opens styled modal for confirmation (not browser confirm)

### Subject/Patient Management
Persistent storage of patient tumor data:

**Features:**
- Combined with Patient Info Panel (top-left corner)
- Auto-naming: extracted from report or "Patient", "Patient 2", etc.
- Editable names via contenteditable (click to edit, Enter to save)
- Auto-save when tumors are placed
- localStorage persistence (`journey_subjects` key)

**Data Stored Per Subject:**
- Subject ID and name
- Array of tumor data (position, size, region, etc.)
- Patient info (DOB, exam date, scan type, hospital, physician)
- Automatically restored when subject selected

**Functions:**
```javascript
loadSubjectsFromStorage()       // Load from localStorage
saveSubjectsToStorage()         // Save to localStorage
createNewSubject()              // Create new subject entry
createNewSubjectFromReport()    // Create from OCR with patient info
saveCurrentSubject()            // Save current tumor state
loadSubject(id)                 // Load and restore tumors
clearAllTumors()                // Remove all tumors
updatePatientInfoPanel()        // Update panel display
```

### Medication System
Real cancer drugs dynamically shown based on patient's tumor types:

| Drug | Brand | Type | Indications |
|------|-------|------|-------------|
| Pembrolizumab | Keytruda | ICI | Lung, Brain, Liver, Stomach, Breast |
| Nivolumab | Opdivo | ICI | Lung, Brain, Liver, Stomach |
| Osimertinib | Tagrisso | TKI | Lung, Brain |
| Bevacizumab | Avastin | VEGF | Lung, Brain, Liver |
| Sorafenib | Nexavar | TKI | Liver |
| Lenvatinib | Lenvima | TKI | Liver, Stomach |
| Trastuzumab | Herceptin | HER2 | Breast, Stomach |
| Palbociclib | Ibrance | CDK | Breast |
| Temozolomide | Temodar | CTX | Brain |
| Ramucirumab | Cyramza | VEGF | Stomach, Liver |

**Dynamic Drug Selection:**
- Panel shows 3-4 most relevant drugs based on patient's tumor locations
- Drugs are scored by how many tumor types they treat
- Updates automatically when tumors are added/patient changes

**Toggle Panel:**
- Centered at top of screen
- Click to toggle each medication on/off
- Active medications highlighted with unique colors (CSS variable based)

**Tumor Response (determined once per tumor when meds start):**
- ~40% chance: Shrinking (gradual reduction)
- ~40% chance: Halted (no growth)
- ~20% chance: Resistant (continues growing)

**PD-L1 Biomarker Impact on ICIs:**
ICI medications (Pembrolizumab, Nivolumab) effectiveness is modified by tumor PD-L1 status:
| PD-L1 Status | Modifier | Clinical Response Rate |
|--------------|----------|------------------------|
| High (≥50%) | 1.5x | ~45-50% |
| Low (1-49%) | 1.0x | ~25-30% (baseline) |
| Negative (<1%) | 0.4x | ~10-15% |

**Effectiveness Ramp-up:**
Exponential curve for gradual effect onset:
```javascript
effectiveness = 1 - Math.exp(-monthsOnTreatment / MED_RAMP_TIME)
// MED_RAMP_TIME = 1.5 months
// ~49% at 1 month, ~74% at 2 months, ~86% at 3 months
```

**Chart Markers:**
- Vertical dashed lines on spider plot when medications started
- Color-coded to match medication
- Cleared on reset or subject change

### Custom Confirmation Modal
Styled modal dialog replacing browser's native `confirm()`:

**Features:**
- Centered overlay with backdrop blur
- Dark theme matching app UI
- "Delete Patient" title with message
- Cancel and Delete buttons (red delete button)
- Escape key dismisses modal
- Click outside modal dismisses it
- Smooth slide-in animation

**Implementation:**
```javascript
function showConfirmModal(message) {
  confirmMessage.textContent = message;
  confirmModal.classList.add('visible');
}

function hideConfirmModal() {
  confirmModal.classList.remove('visible');
  pendingDeleteSubjectId = null;
}

// Delete button shows modal instead of browser confirm
deletePatientBtn.addEventListener('click', () => {
  pendingDeleteSubjectId = currentSubjectId;
  showConfirmModal(`Delete patient "${subject.name}" and all their tumor data?`);
});
```

## Configuration (CONFIG object)

```javascript
camera: {
  fov: 45,
  position: { x: 0, y: 0.5, z: 6 },
  lookAt: { x: 0, y: 0.5, z: 0 }
}

background: {
  topColor: 0x8EA1A0,    // Teal-gray gradient top
  bottomColor: 0x141A22  // Dark gradient bottom
}

humanBody: {
  outlineColor: 0xffffff,  // White outline
  innerColor: 0x9DB3B2,    // Teal-gray fill
  scale: 2.0
}

tumor: {
  size: 0.35,              // Draggable tumor size
  droppedSize: 0.021,      // Base dropped size (~25mm)
  lumpiness: 0.12,
  depthIntoBody: 0.1       // How far inside body (x-ray)
}

postProcessing: {
  bloom: { enabled: false },
  vignette: { darkness: 0.8, offset: 0.9 },        // Strong fade to black at edges
  grain: { enabled: true, intensity: 0.04, speed: 1.0 },
  scanLines: { enabled: true, intensity: 0.12, count: 2000 },  // Thin lines
  grid: { enabled: true, intensity: 0.15, size: 50, lineWidth: 1.5 }  // Sci-fi grid
}
```

## Radiology Report OCR

Upload a radiology report image to automatically extract patient info and tumors:

**How it works:**
1. Click "Upload Radiology Report" button (bottom right)
2. Select an image of a radiology report
3. Tesseract.js runs OCR locally (no cloud)
4. Patient info extracted: name, DOB, exam date, scan type, hospital, physician
5. Tumor sizes and locations extracted from findings
6. New patient created with extracted info
7. Tumors auto-placed on body

**Patient Info Extraction:**
- **Patient Name**: Looks for "Patient: Name" or "Patient Name: Name" format
  - Multiple fallback approaches for different layouts
  - Excludes physician/radiologist names (found near "Signed by", "MD", etc.)
  - Falls back to "Patient", "Patient 2", etc. if not found
- **DOB**: Dates with year < 2015 (validates against recent dates)
  - 2-digit years 20-29 treated as 2020s (exam dates, not DOBs)
  - Years 30-99 treated as 1930-1999 (valid DOBs)
- **Exam Date**: Found near "Exam Date", "Study Date", or "Signed" labels
- **Prior Exam Date**: Found near "Comparison", "Prior", "Previous" labels
- **Scan Type**: "Exam:" field or detected from keywords (MRI, CT, PET, X-Ray, etc.)
- **Hospital**: First few lines, looks for "Medical", "Hospital", "Center", etc.
- **Physician**: "Referring Physician:" or "Signed by:" fields

**Prior Tumor Size Extraction:**
- Patterns: "previously X cm", "prior: X mm", "from X cm", "compared to X cm"
- Stored with each tumor for historical graph display

**Exam History & Graph Pre-drawing:**
- When prior exam date found, months between exams calculated
- Historical tumor growth shown as dashed lines in "HISTORY" shaded region
- Graph X-axis adapts to show negative months for history
- Simulation starts from month 0 (current exam), history shown to the left

**Multiple Reports per Patient:**
- "Add Report to Patient" button in patient info panel
- Adds exam to patient's history instead of creating new patient
- Builds up longitudinal timeline across multiple scans
- Medication panel auto-updates when new tumors added

**Supported tumor patterns:**
- "3.2 cm mass in the liver"
- "25mm lesion in left lung"
- "tumor measuring 2.5 cm in the brain"
- "15 mm nodule in right breast"

**Region aliases:**
- Brain: brain, cerebral, cranial, head
- Lungs: lung, pulmonary, left/right lung
- Liver: liver, hepatic
- Stomach: stomach, gastric
- Breast: breast, mammary, left/right breast

**OCR Regex Patterns:**
```javascript
// Patient name (between Patient: and DOB:)
/patient\s*[:\-]\s*([A-Za-z]+(?:\s+[A-Za-z]+)+)\s*(?:DOB|D\.O\.B)/i

// Tumor extraction
/(\d+(?:\.\d+)?)\s*(mm|cm)\s+(?:mass|lesion|tumor|nodule|met(?:astasis)?)\s+(?:in|of|on|at|within)\s+(?:the\s+)?(?:(left|right)\s+)?(brain|lung|liver|stomach|breast|...)/gi
```

## Tumor Size System

| Reference | Size |
|-----------|------|
| Tiny | 1mm |
| Marble | 15mm |
| Default | 25mm |
| Max | 70mm |

Range: 0-70mm (larger would exceed head size)

Conversion: `MM_TO_SCALE = 0.021 / 25` (scale units per mm)

## Post-Processing Effects

All effects are shader passes in the EffectComposer:

1. **Vignette** - Strong gradient to black at screen edges
2. **Grain** - Animated film grain (subtle noise)
3. **Scan Lines** - Thin horizontal CRT-style lines (2000 count)
4. **Grid** - Sci-fi style grid overlay (screen-space, always faces camera)
   - Minor grid lines + thicker major lines every 4 cells
   - Cyan-tinted color

## Technical Implementation

### Outline Shader (Inverted Hull)
```glsl
// Vertex: push outward along normal
vec3 pos = position + normal * uOutlineThickness;

// Fragment: solid outline color
gl_FragColor = vec4(uOutlineColor, 1.0);

// Render back faces only
side: THREE.BackSide
```

### X-Ray Tumor Visibility
```javascript
// Disable depth test so tumor renders on top
child.material = new THREE.MeshBasicMaterial({
  color: 0x2E5470,
  depthTest: false
});
child.renderOrder = 999;

// Clear depth buffer before render
child.onBeforeRender = (renderer) => renderer.clearDepth();
```

### Fixed Screen Position (Draggable Tumor)
```javascript
// Keep tumor at fixed position relative to camera view
const dir = camera.getWorldDirection(new THREE.Vector3());
const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
const up = new THREE.Vector3().crossVectors(right, dir).normalize();

tumorGroup.position.copy(camera.position)
  .add(dir.multiplyScalar(distance))
  .add(right.multiplyScalar(CONFIG.tumor.position.x * 0.75))
  .add(up.multiplyScalar(CONFIG.tumor.position.y * 0.8));
```

## Public API

```javascript
window.ThreeBackground = {
  scene,
  camera,
  renderer,
  controls,
  getHumanBody: () => humanBodyMesh,
  getTumor: () => tumorGroup,
  getDroppedTumors: () => droppedTumors,
  clearAllTumors: () => { /* removes all placed tumors */ },
  setOutlineColor: (hex) => { /* change outline color */ },
  setOutlineThickness: (val) => { /* change outline thickness */ }
}

// Timeline state variables (module scope)
let isPlaying = false;
let currentMonth = 0;
const maxMonths = 18;
const tumorInitialSizes = new Map();
const metastases = [];
const activeMetNotifications = [];

// Medication state (dynamic based on tumor types)
let currentMedicationIds = [];           // Array of active drug IDs from MEDICATION_DATABASE
const activeMedications = {};            // { drugId: true/false } - dynamically populated
const medicationStartTimes = {};         // { drugId: monthNumber } - when each drug was started

// Functions
getRelevantMedications()                 // Returns top 3-4 drugs for patient's tumor types
updateMedicationPanel()                  // Rebuilds medication toggle UI

// Subject management
const STORAGE_KEY = 'journey_subjects';
let currentSubjectId = null;
let subjects = [];
```

## Future To-Do

### From Bedrock (Priority Features)
- [x] PD-L1 expression per tumor (biomarker affecting ICI response) - IMPLEMENTED
- [ ] Multi-patient dashboard (grid view of all patients)
- [ ] Manual Target/Non-Target lesion designation
- [ ] QSP parameters (growth rate, immune cell densities)
- [ ] Virtual clinical trial comparison (cohort A vs B)
- [ ] Structured data import (CSV/spreadsheet)

### Platform & Export
- [ ] Electron wrapper for desktop app
  - [ ] Use native Tesseract binaries for faster OCR
  - [ ] Direct file system access (drag-drop reports)
  - [ ] Run OCR in main process for smoother UI
  - [ ] Bundle local ONNX model for medical text extraction
- [ ] Export tumor placements as JSON
- [ ] Export simulation data as CSV/report

### UI Enhancements
- [ ] Show organ shapes on hover/toggle
- [ ] Undo/redo for tumor placement
- [ ] Multiple medication combinations with synergy effects
- [ ] Treatment timeline scheduling (start/stop dates)

## Completed Features (Recent)

- [x] Timeline simulation with 18-month playback
- [x] Spider plot visualization of tumor diameter
- [x] Variable growth rates per tumor
- [x] Growth spike mechanic (2% chance)
- [x] Metastasis system with NEW MET notifications
- [x] Subject/patient management with localStorage
- [x] Editable subject names
- [x] Medication system (10 real cancer drugs)
- [x] Medication effectiveness ramp-up curve
- [x] Chart markers for medication start times
- [x] Reset button for simulation
- [x] Intro glow animation on draggable tumor
- [x] Surgical removal with "Surgically Remove" button
- [x] Projected trajectory lines (shows growth without meds as dotted gray)
- [x] 3D organ meshes (brain, lungs, liver) with x-ray rendering
- [x] Organ mesh collision detection for tumor region
- [x] Tumor repositioning into organ meshes
- [x] Spider plot 2x scale button
- [x] Click plot line to select tumor and open info dialog
- [x] 18-month timeline duration
- [x] Faster medication ramp-up (1.5 months)
- [x] 2D HTML tumor creation panel (replaced 3D floating tumor)
- [x] Patient Info Panel with DOB, Exam Date, Scan Type, Hospital, Physician
- [x] Combined patient selector with patient info panel
- [x] OCR patient info extraction (name, DOB, exam date, scan type, hospital, physician)
- [x] Auto-create patient from uploaded radiology report
- [x] Delete Patient button
- [x] Physician name exclusion from patient name search
- [x] Smart DOB validation (2-digit years 20-29 = 2020s, 30-99 = 1900s)
- [x] Fallback patient naming with numbering (Patient, Patient 2, etc.)
- [x] Custom styled scrollbar for patient list
- [x] Prior exam date extraction from OCR (Comparison, Prior study patterns)
- [x] Prior tumor sizes extraction ("previously X cm", "prior: X mm")
- [x] Historical data pre-drawn on spider plot (dashed lines in shaded "HISTORY" region)
- [x] "Add Report to Patient" button in patient panel (moved from checkbox)
- [x] Exam history stored per patient with calculated months between exams
- [x] Graph X-axis adapts to show negative months for history
- [x] Real cancer drug names (10 drugs with brand names and types)
- [x] Dynamic medication panel based on patient's tumor types
- [x] CSS variable-based medication button colors
- [x] Custom confirmation modal for Delete Patient (replaces browser confirm)
- [x] Medication panel auto-updates on report upload
- [x] Wider patient info panel with larger, brighter fonts
- [x] Waterfall plot view with dropdown selector
- [x] RECIST threshold lines on waterfall plot (-30% PR, +20% PD)
- [x] Progression-Free Survival (Kaplan-Meier) plot
- [x] Swimmer Plot with event markers (PR, PD, Surgery)
- [x] SLD (Sum of Longest Diameters) total burden plot
- [x] Best Overall Response bar chart
- [x] Response Categories donut chart (CR/PR/SD/PD)
- [x] PD-L1 biomarker per tumor (high/low/negative categories)
- [x] PD-L1 modifies ICI medication response (1.5x high, 1.0x low, 0.4x negative)
- [x] PD-L1 selector dropdown in tumor creation panel
- [x] PD-L1 display in tumor info dialog with color coding
- [x] PD-L1 OCR extraction from radiology reports
- [x] PD-L1 data persistence in localStorage and exam history
- [x] Duration of Response (DOR) plot for responders
- [x] Tumor Heatmap visualization (% change grid)
- [x] Growth Rate plot (mm/month velocity)
- [x] Target vs Non-Target lesion tracking (RECIST 1.1)
- [x] Graph type dropdown with Size button on same line (11 chart types)
- [x] Tumor temperature system (hot/warm/cold based on immune microenvironment)
- [x] Temperature dropdown in tumor creation panel
- [x] Dynamic tumor preview color (2D panel changes with dropdown selection)
- [x] Draggable tumor clone matches temperature color
- [x] Lung lobe OCR aliases ("right upper lobe" → Lungs (Right), etc.)
- [x] Fixed default tumor position for "Other" region (was placing at feet)
- [x] Simplified organ rendering (solid fill, no outlines)
- [x] Body outline disabled (code preserved, can be re-enabled)
- [x] New simplified Lungs_02.fbx mesh from Krea
- [x] Custom smooth zoom with lerping (replaces jumpy OrbitControls zoom)
- [x] Camera reset button
- [x] Draggable panel headers edge-to-edge styling
- [x] Historical tumor trajectory simulation (continues shrink rate from scan data)
- [x] Meshy AI remeshed lungs (38MB → 133KB)
- [x] Meshy AI remeshed body (28MB → 1.1MB)
- [x] Meshy AI remeshed brain (3.7MB → 128KB)
- [x] Meshy AI remeshed stomach (17MB → 126KB)
- [x] Recalibrated all organ positions for new meshes
- [x] Simplified mesh filenames (Body, Brain, Lungs, Liver, Stomach)
- [x] Total mesh size reduced from 50MB+ to 1.7MB

## Past Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Glowing blob instead of outline | Fresnel shader | Switched to inverted hull technique |
| Polygon edges visible | Low-poly model | Use high-poly Anatomy.fbx |
| Tumor invisible inside body | Depth testing | `depthTest: false`, `clearDepth()` |
| Spiky tumor appearance | Random seed per-vertex | Calculate seed once per tumor |
| Tumor too small when dropped | droppedSize too low | Increased to 0.021 |
| Browser shows old code | Caching | Hard refresh: Ctrl+Shift+R |
| Black screen (activeMetNotifications) | Variable used before declaration | Move declaration before animate loop |
| Black screen (group) | userData assigned before group created | Move assignment after `const group = new THREE.Group()` |
| OCR only finding one tumor | Regex didn't handle newlines | Added `\n\|\r` to regex terminators |
| Reset not working second time | plotId not cleared | Add `tumor.userData.plotId = null` on reset |
| Tumors never shrinking | Multiplying growth factor instead of tracking size | Rewrote to track `currentSizeMM` and subtract shrinkAmount |
| Immediate medication effect | No ramp-up curve | Added exponential curve with MED_RAMP_TIME = 1.5 months |
| Graph drops before spike | Estimated pre-spike growth (3%/mo) vs actual | Store `sizeAtSpike` when spike occurs, use as baseline |
| Radiologist name as patient | Fallback found physician name | Identify physician names first, exclude from patient search |
| Wrong DOB (exam date used) | 2-digit year 26 treated as 1926 | Validate: years 20-29 = 2020s (invalid DOB), 30-99 = valid |
| "Radiology Patient" as name | Word pair matched "Department of Radiology" + "Patient:" | Added "Radiology" to exclude patterns |
| Patient name not extracted | Regex required colon after "Patient" | Made colon optional, added line-by-line parsing |
| OCR can't read table cells | Tesseract limitation with table layouts | Multiple fallback approaches, simpler report format works |

## Dependencies

Loaded via CDN:
- Three.js 0.160.0 (unpkg)
- OrbitControls, FBXLoader (Three.js addons)
- EffectComposer, RenderPass, UnrealBloomPass, ShaderPass (post-processing)
- Tesseract.js 5.x (jsdelivr) - local OCR for radiology reports
