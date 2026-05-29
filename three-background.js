/**
 * Journey - Human Body with Fresnel Glow
 * Clean test scene
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    camera: {
      fov: 45,
      near: 0.1,
      far: 500,
      position: { x: 0, y: 0.5, z: 6 },   // Centered, closer
      lookAt: { x: 0, y: 0.5, z: 0 }     // Look at center of body
    },

    controls: {
      enabled: true,
      enableDamping: true,
      dampingFactor: 0.08,     // Smoother easing
      zoomSpeed: 0.5,          // Zoom speed
      enableZoom: true,
      enablePan: true,         // Right-click to pan
      minDistance: 2.0,        // Can zoom in closer
      maxDistance: 12.0        // Can zoom out further than start
    },

    // Gradient background
    background: {
      topColor: 0x8EA1A0,    // Teal-gray top
      bottomColor: 0x141A22  // Dark bottom
    },

    // Fog
    fog: {
      enabled: false,  // No fog for illustration style
      color: 0xf5e6c8,
      near: 10,
      far: 100
    },

    // Human body with outline glow
    humanBody: {
      enabled: true,
      modelPath: './Mesh/Body.fbx',
      position: { x: 0, y: 0.5, z: 0 },   // Moved up for MedicalHuman_03
      rotation: { x: 0, y: 0, z: 0 },   // Facing camera
      scale: 0.015,  // Adjusted for MedicalHuman_03 remesh
      // Outline settings
      outlineColor: 0xffffff,      // White outline
      innerColor: 0x9DB3B2,        // Teal-gray fill
      outlineIntensity: 1.0,
      outlinePower: 3.0,
      scanLineIntensity: 0.0,      // No scan lines
      scanLineFrequency: 0.0,
      pulseSpeed: 0.0,             // No pulse
      pulseAmount: 0.0
    },

    // Draggable tumor
    tumor: {
      enabled: true,
      position: { x: -2.5, y: 0.6, z: 0 },  // Left side, lower
      size: 0.35,                            // Smaller starting size
      droppedSize: 1.4,                       // Scaled for HumanBody.fbx (was 0.021)
      lumpiness: 0.12,                       // How bumpy
      segments: 32,
      depthIntoBody: 0.1                     // How far inside the body (x-ray effect)
    },

    postProcessing: {
      bloom: {
        enabled: false,  // No bloom for illustration style
        strength: 0.0,
        radius: 0.0,
        threshold: 1.0
      },
      vignette: {
        darkness: 0.5,    // Moderate vignette
        offset: 1.0
      },
      grain: {
        enabled: true,
        intensity: 0.04,  // Very subtle grain
        speed: 1.0        // Animation speed
      },
      scanLines: {
        enabled: true,
        intensity: 0.12,  // Subtle scan lines
        count: 2000       // More lines = thinner
      },
      grid: {
        enabled: true,
        intensity: 0.15,   // Grid line opacity
        size: 50.0,        // Grid cell size
        lineWidth: 1.5     // Line thickness
      }
    }
  };

  // ============================================
  // SETUP
  // ============================================

  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  // ============================================
  // BACKGROUND - Gradient
  // ============================================

  const gradCanvas = document.createElement('canvas');
  gradCanvas.width = 4;
  gradCanvas.height = 2048;
  const ctx = gradCanvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 2048);
  gradient.addColorStop(0, '#' + CONFIG.background.topColor.toString(16).padStart(6, '0'));
  gradient.addColorStop(1, '#' + CONFIG.background.bottomColor.toString(16).padStart(6, '0'));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 2048);
  const gradTexture = new THREE.CanvasTexture(gradCanvas);
  gradTexture.colorSpace = THREE.SRGBColorSpace;
  scene.background = gradTexture;

  // Fog
  if (CONFIG.fog.enabled) {
    scene.fog = new THREE.Fog(CONFIG.fog.color, CONFIG.fog.near, CONFIG.fog.far);
  }

  // Camera
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
  );
  camera.position.set(CONFIG.camera.position.x, CONFIG.camera.position.y, CONFIG.camera.position.z);
  camera.lookAt(CONFIG.camera.lookAt.x, CONFIG.camera.lookAt.y, CONFIG.camera.lookAt.z);

  // Controls
  let controls = null;
  if (CONFIG.controls.enabled) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = CONFIG.controls.enableDamping;
    controls.dampingFactor = CONFIG.controls.dampingFactor;
    controls.enableZoom = false; // Disable built-in zoom, use custom smooth zoom
    controls.enablePan = CONFIG.controls.enablePan;
    controls.panSpeed = 0.8;           // Pan speed
    controls.screenSpacePanning = true; // Pan parallel to screen
    controls.minDistance = CONFIG.controls.minDistance;
    controls.maxDistance = CONFIG.controls.maxDistance;
    controls.target.set(0, 0.5, 0);  // Orbit around body center
    // Right mouse button for panning (default), left for rotate
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    // Custom smooth zoom
    let targetZoom = camera.position.distanceTo(controls.target);
    const minZoom = CONFIG.controls.minDistance;
    const maxZoom = CONFIG.controls.maxDistance;
    const zoomSpeed = 0.15; // How much each wheel tick changes zoom
    const zoomLerp = 0.08;  // Smoothing factor

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      targetZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom * (1 + delta * zoomSpeed)));
    }, { passive: false });

    // Update zoom smoothly in animation loop
    window.updateSmoothZoom = function() {
      const currentDist = camera.position.distanceTo(controls.target);
      if (Math.abs(currentDist - targetZoom) > 0.01) {
        const newDist = currentDist + (targetZoom - currentDist) * zoomLerp;
        const direction = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(controls.target).add(direction.multiplyScalar(newDist));
      }
    };

    // Allow resetting target zoom (for camera reset)
    window.setTargetZoom = function(zoom) {
      targetZoom = zoom;
    };
    canvas.style.pointerEvents = 'auto';
  }

  // ============================================
  // LIGHTING
  // ============================================

  // Ambient
  const ambient = new THREE.AmbientLight(0x404060, 0.4);
  scene.add(ambient);

  // Key light
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(5, 10, 7);
  scene.add(keyLight);

  // Fill lights
  const fillLight1 = new THREE.PointLight(0x4488ff, 0.8, 50);
  fillLight1.position.set(-5, 3, 5);
  scene.add(fillLight1);

  const fillLight2 = new THREE.PointLight(0xff8844, 0.6, 40);
  fillLight2.position.set(5, 2, -5);
  scene.add(fillLight2);

  // Rim light
  const rimLight = new THREE.DirectionalLight(0x6688ff, 0.5);
  rimLight.position.set(-10, 5, -10);
  scene.add(rimLight);

  // ============================================
  // HUMAN BODY - Fresnel Edge Glow
  // ============================================

  let humanBodyMesh = null;
  let humanBodyMaterial = null;

  // Outline shader - pushes vertices outward along normals (inverted hull)
  const outlineShader = {
    uniforms: {
      uOutlineColor: { value: new THREE.Color(CONFIG.humanBody.outlineColor) },
      uOutlineThickness: { value: 0.004 },  // Slightly thicker for smoother look
      uTime: { value: 0 },
      uPulseSpeed: { value: CONFIG.humanBody.pulseSpeed },
      uPulseAmount: { value: CONFIG.humanBody.pulseAmount }
    },
    vertexShader: `
      uniform float uOutlineThickness;

      void main() {
        // Push vertices outward along normal
        vec3 pos = position + normal * uOutlineThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uOutlineColor;
      uniform float uTime;
      uniform float uPulseSpeed;
      uniform float uPulseAmount;

      void main() {
        float pulse = 1.0 + sin(uTime * uPulseSpeed) * uPulseAmount;
        gl_FragColor = vec4(uOutlineColor * pulse, 1.0);
      }
    `,
    side: THREE.BackSide  // Only render back faces = outline
  };

  // Organ outline shader - thin white outline, no fill
  const organOutlineShader = {
    uniforms: {
      uOutlineColor: { value: new THREE.Color(0xffffff) },
      uOutlineThickness: { value: 0.002 },  // Thinner than body
      uOpacity: { value: 0.6 }
    },
    vertexShader: `
      uniform float uOutlineThickness;
      void main() {
        vec3 pos = position + normal * uOutlineThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uOutlineColor;
      uniform float uOpacity;
      void main() {
        gl_FragColor = vec4(uOutlineColor, uOpacity);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthTest: false
  };

  // Inner fill shader - dark/transparent interior with scan lines
  const innerShader = {
    uniforms: {
      uInnerColor: { value: new THREE.Color(CONFIG.humanBody.innerColor) },
      uScanLineFrequency: { value: CONFIG.humanBody.scanLineFrequency },
      uScanLineIntensity: { value: CONFIG.humanBody.scanLineIntensity },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uInnerColor;

      void main() {
        // Solid fill - parchment colored interior
        gl_FragColor = vec4(uInnerColor, 1.0);
      }
    `,
    transparent: false,
    side: THREE.FrontSide,
    depthWrite: true
  };

  // Load model
  let outlineMaterial = null;
  let innerMaterial = null;

  if (CONFIG.humanBody.enabled) {
    const loader = new FBXLoader();

    loader.load(
      CONFIG.humanBody.modelPath,
      (model) => {
        // Create materials
        outlineMaterial = new THREE.ShaderMaterial(outlineShader);
        innerMaterial = new THREE.ShaderMaterial(innerShader);

        // Collect meshes first
        const meshes = [];
        model.traverse((child) => {
          if (child.isMesh) {
            meshes.push(child);
          }
        });

        // Create container
        humanBodyMesh = new THREE.Group();

        // Add outline and inner for each mesh
        meshes.forEach((mesh) => {
          // Inner mesh (front faces) - dark fill with scan lines
          const innerMesh = mesh.clone();
          innerMesh.material = innerMaterial;
          humanBodyMesh.add(innerMesh);

          // OUTLINE DISABLED - uncomment to re-enable
          // // Outline mesh (back faces) - pushed outward
          // const outlineMesh = mesh.clone();
          // outlineMesh.material = outlineMaterial;
          // humanBodyMesh.add(outlineMesh);
        });

        humanBodyMesh.position.set(
          CONFIG.humanBody.position.x,
          CONFIG.humanBody.position.y,
          CONFIG.humanBody.position.z
        );
        humanBodyMesh.rotation.set(
          CONFIG.humanBody.rotation.x,
          CONFIG.humanBody.rotation.y,
          CONFIG.humanBody.rotation.z
        );
        humanBodyMesh.scale.setScalar(CONFIG.humanBody.scale);

        // Store materials for animation
        humanBodyMaterial = { outline: outlineMaterial, inner: innerMaterial };

        scene.add(humanBodyMesh);

        console.log('Human body loaded with outline');

        // Organ meshes disabled for Starfall (alien lifeforms don't need human anatomy)
        // loadOrganMeshes();
      },
      (progress) => {
        if (progress.total > 0) {
          console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
        }
      },
      (error) => {
        console.error('Failed to load model:', error);
      }
    );
  }

  // ============================================
  // ORGAN MESHES - X-ray visible inside body
  // ============================================

  const organMeshes = {};

  function loadOrganMeshes() {
    const gltfLoader = new GLTFLoader();

    // Brain mesh (FBX - remeshed via Meshy AI)
    // BACKUP: Original high-poly is human_brain.glb (3.7MB)
    const brainFbxLoader = new FBXLoader();
    brainFbxLoader.load(
      './Mesh/Brain.fbx',
      (fbx) => {
        const brainGroup = new THREE.Group();

        fbx.traverse((child) => {
          if (child.isMesh) {
            // Inner mesh only - no outline
            const innerMesh = child.clone();
            innerMesh.material = new THREE.MeshBasicMaterial({
              color: 0x607a79,
              depthTest: false
            });
            innerMesh.renderOrder = 998;
            innerMesh.onBeforeRender = (renderer) => renderer.clearDepth();
            brainGroup.add(innerMesh);
          }
        });

        // Position inside head - calibrating for Brain_02.fbx
        brainGroup.position.set(0, 90, -1);
        brainGroup.scale.setScalar(0.11); // Calibrated
        brainGroup.rotation.set(0, 0, 0); // Forward facing

        // Store reference for collision detection
        brainGroup.userData.isOrgan = true;
        brainGroup.userData.organType = 'Brain';

        humanBodyMesh.add(brainGroup);
        organMeshes.brain = brainGroup;

        // Compute bounds after adding to scene
        humanBodyMesh.updateMatrixWorld(true);
        const worldBox = new THREE.Box3().setFromObject(brainGroup);
        const bodyMatrixInverse = new THREE.Matrix4().copy(humanBodyMesh.matrixWorld).invert();
        const localMin = worldBox.min.clone().applyMatrix4(bodyMatrixInverse);
        const localMax = worldBox.max.clone().applyMatrix4(bodyMatrixInverse);

        brainGroup.userData.bounds = {
          xMin: localMin.x,
          xMax: localMax.x,
          yMin: localMin.y,
          yMax: localMax.y,
          zMin: localMin.z,
          zMax: localMax.z
        };

        console.log('Brain mesh loaded with bounds:', brainGroup.userData.bounds);
      },
      undefined,
      (error) => console.error('Failed to load brain:', error)
    );

    // Lungs mesh (FBX - remeshed to 3k polys)
    // BACKUP: Original high-poly is Lungs_02.fbx
    const fbxLoader = new FBXLoader();
    fbxLoader.load(
      './Mesh/Lungs.fbx',
      (fbx) => {
        const lungsGroup = new THREE.Group();

        fbx.traverse((child) => {
          if (child.isMesh) {
            // Inner mesh only - no outline
            const innerMesh = child.clone();
            innerMesh.material = new THREE.MeshBasicMaterial({
              color: 0x607a79,
              depthTest: false
            });
            innerMesh.renderOrder = 998;
            innerMesh.onBeforeRender = (renderer) => renderer.clearDepth();
            lungsGroup.add(innerMesh);
          }
        });

        // Position in chest cavity - calibrating for MedicalHuman_03.fbx
        lungsGroup.position.set(0, 52, -6);
        lungsGroup.scale.setScalar(0.19);
        lungsGroup.rotation.set(0, 0, 0);

        // Store reference for collision detection
        lungsGroup.userData.isOrgan = true;
        lungsGroup.userData.organType = 'Lungs';

        humanBodyMesh.add(lungsGroup);
        organMeshes.lungs = lungsGroup;

        // Compute bounds after adding to scene (so transforms are applied)
        // Need to update matrices first
        humanBodyMesh.updateMatrixWorld(true);

        // Use Box3 to get actual bounds in body local space
        const worldBox = new THREE.Box3().setFromObject(lungsGroup);

        // Convert world bounds to body local space
        const bodyMatrixInverse = new THREE.Matrix4().copy(humanBodyMesh.matrixWorld).invert();
        const localMin = worldBox.min.clone().applyMatrix4(bodyMatrixInverse);
        const localMax = worldBox.max.clone().applyMatrix4(bodyMatrixInverse);

        // Store bounds for left and right lungs (split at center X)
        // Add asymmetric padding - more upward (into neck), less downward (avoid liver)
        const yPaddingUp = (localMax.y - localMin.y) * 0.3;    // 30% upward padding
        const yPaddingDown = (localMax.y - localMin.y) * 0.1;  // 10% downward padding (less to avoid liver)
        const xPadding = (localMax.x - localMin.x) * 0.15;     // 15% horizontal padding
        const zPadding = (localMax.z - localMin.z) * 0.2;      // 20% depth padding

        const paddedMin = new THREE.Vector3(
          localMin.x - xPadding,
          localMin.y - yPaddingDown,
          localMin.z - zPadding
        );
        const paddedMax = new THREE.Vector3(
          localMax.x + xPadding,
          localMax.y + yPaddingUp,
          localMax.z + zPadding
        );

        const centerX = (paddedMin.x + paddedMax.x) / 2;
        lungsGroup.userData.bounds = {
          min: paddedMin,
          max: paddedMax,
          centerX: centerX,
          // Left lung (positive X in body space)
          left: {
            xMin: centerX + 0.005,  // Small gap at center
            xMax: paddedMax.x,
            yMin: paddedMin.y,
            yMax: paddedMax.y,
            zMin: paddedMin.z,
            zMax: paddedMax.z
          },
          // Right lung (negative X in body space)
          right: {
            xMin: paddedMin.x,
            xMax: centerX - 0.005,  // Small gap at center
            yMin: paddedMin.y,
            yMax: paddedMax.y,
            zMin: paddedMin.z,
            zMax: paddedMax.z
          }
        };

        console.log('Lungs bounds computed:', {
          left: lungsGroup.userData.bounds.left,
          right: lungsGroup.userData.bounds.right
        });

        console.log('Lungs mesh loaded with outline');

        // Reposition any existing lung tumors to fit inside bounds
        repositionLungTumors();
      },
      undefined,
      (error) => console.error('Failed to load lungs:', error)
    );

    // Liver mesh
    gltfLoader.load(
      './Mesh/Liver.glb',
      (gltf) => {
        const liverGroup = new THREE.Group();

        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // Inner mesh only - no outline
            const innerMesh = child.clone();
            innerMesh.material = new THREE.MeshBasicMaterial({
              color: 0x607a79,
              depthTest: false
            });
            innerMesh.renderOrder = 998;
            innerMesh.onBeforeRender = (renderer) => renderer.clearDepth();
            liverGroup.add(innerMesh);
          }
        });

        // Position in abdomen (right side) - calibrating for MedicalHuman_03.fbx
        liverGroup.position.set(0, 25, -0.4);
        liverGroup.scale.setScalar(4.0);
        liverGroup.rotation.set(Math.PI, Math.PI, 0);

        // Store reference for collision detection
        liverGroup.userData.isOrgan = true;
        liverGroup.userData.organType = 'Liver';

        humanBodyMesh.add(liverGroup);
        organMeshes.liver = liverGroup;

        // Compute bounds after adding to scene
        humanBodyMesh.updateMatrixWorld(true);
        const worldBox = new THREE.Box3().setFromObject(liverGroup);
        const bodyMatrixInverse = new THREE.Matrix4().copy(humanBodyMesh.matrixWorld).invert();
        const localMin = worldBox.min.clone().applyMatrix4(bodyMatrixInverse);
        const localMax = worldBox.max.clone().applyMatrix4(bodyMatrixInverse);

        liverGroup.userData.bounds = {
          xMin: localMin.x,
          xMax: localMax.x,
          yMin: localMin.y,
          yMax: localMax.y,
          zMin: localMin.z,
          zMax: localMax.z
        };

        console.log('Liver mesh loaded with bounds:', liverGroup.userData.bounds);
      },
      undefined,
      (error) => console.error('Failed to load liver:', error)
    );

    // Stomach mesh (FBX - remeshed via Meshy AI)
    // BACKUP: Original high-poly is stomach.glb (17MB)
    fbxLoader.load(
      './Mesh/Stomach.fbx',
      (fbx) => {
        const stomachGroup = new THREE.Group();

        fbx.traverse((child) => {
          if (child.isMesh) {
            // Inner mesh only - no outline
            const innerMesh = child.clone();
            innerMesh.material = new THREE.MeshBasicMaterial({
              color: 0x607a79,
              depthTest: false
            });
            innerMesh.renderOrder = 998;
            innerMesh.onBeforeRender = (renderer) => renderer.clearDepth();
            stomachGroup.add(innerMesh);
          }
        });

        // Position in abdomen (center-left) - calibrating for Stomach_02.fbx
        stomachGroup.position.set(0, 11, -0.4);
        stomachGroup.scale.setScalar(0.12); // Calibrating
        stomachGroup.rotation.set(0, 0, 0);

        // Store reference for collision detection
        stomachGroup.userData.isOrgan = true;
        stomachGroup.userData.organType = 'Stomach';

        humanBodyMesh.add(stomachGroup);
        organMeshes.stomach = stomachGroup;

        // Compute bounds after adding to scene
        humanBodyMesh.updateMatrixWorld(true);
        const worldBox = new THREE.Box3().setFromObject(stomachGroup);
        const bodyMatrixInverse = new THREE.Matrix4().copy(humanBodyMesh.matrixWorld).invert();
        const localMin = worldBox.min.clone().applyMatrix4(bodyMatrixInverse);
        const localMax = worldBox.max.clone().applyMatrix4(bodyMatrixInverse);

        stomachGroup.userData.bounds = {
          xMin: localMin.x,
          xMax: localMax.x,
          yMin: localMin.y,
          yMax: localMax.y,
          zMin: localMin.z,
          zMax: localMax.z
        };

        console.log('Stomach mesh loaded with bounds:', stomachGroup.userData.bounds);

        // Reposition existing tumors into organs (after all organs loaded)
        repositionTumorsIntoOrgans();
      },
      undefined,
      (error) => console.error('Failed to load stomach:', error)
    );
  }

  // Generic function to get a position inside any organ's bounds
  function getPositionInsideOrgan(dropPoint, organName) {
    // Map organ names to mesh references
    const organMap = {
      'Brain': organMeshes.brain,
      'Liver': organMeshes.liver,
      'Stomach': organMeshes.stomach,
      'Lungs (Left)': organMeshes.lungs,
      'Lungs (Right)': organMeshes.lungs
    };

    const organ = organMap[organName];
    if (!organ || !organ.userData.bounds) {
      // Fallback to organ center position (scaled for HumanBody.fbx)
      const fallbackPos = {
        'Brain': { x: 0, y: 109, z: 0 },
        'Liver': { x: 0, y: 76, z: 1.3 },
        'Stomach': { x: 0, y: 73, z: 1.3 },
        'Lungs (Left)': { x: 4, y: 93, z: -1 },
        'Lungs (Right)': { x: -4, y: 93, z: -1 }
      };
      const pos = fallbackPos[organName] || { x: 0, y: 85, z: 0 };
      return new THREE.Vector3(pos.x, pos.y, pos.z);
    }

    // For lungs, get the appropriate side bounds
    let bounds;
    if (organName === 'Lungs (Left)') {
      bounds = organ.userData.bounds.left;
    } else if (organName === 'Lungs (Right)') {
      bounds = organ.userData.bounds.right;
    } else {
      bounds = organ.userData.bounds;
    }

    // Clamp drop point to be inside bounds with margin
    // Lungs need larger margins because they taper toward the front
    const isLung = organName.includes('Lungs');
    const marginFactor = isLung ? 0.25 : 0.1;  // 25% margin for lungs, 10% for others

    const marginX = (bounds.xMax - bounds.xMin) * marginFactor;
    const marginY = (bounds.yMax - bounds.yMin) * marginFactor;
    const marginZ = (bounds.zMax - bounds.zMin) * (isLung ? 0.35 : 0.1);  // Extra Z margin for lungs (taper)

    // Start with drop point, clamp to bounds
    let x = Math.max(bounds.xMin + marginX, Math.min(bounds.xMax - marginX, dropPoint.x));
    let y = Math.max(bounds.yMin + marginY, Math.min(bounds.yMax - marginY, dropPoint.y));
    let z = Math.max(bounds.zMin + marginZ, Math.min(bounds.zMax - marginZ, dropPoint.z));

    // For lungs, bias toward the back (negative Z) where they're wider
    if (isLung) {
      const centerZ = (bounds.zMin + bounds.zMax) / 2;
      z = z * 0.7 + (bounds.zMin + marginZ) * 0.3;  // Blend toward back
    }

    // Add random spread to avoid clustering (smaller for lungs)
    const spreadFactor = isLung ? 0.08 : 0.15;
    const spreadX = (bounds.xMax - bounds.xMin) * spreadFactor;
    const spreadY = (bounds.yMax - bounds.yMin) * spreadFactor;
    const spreadZ = (bounds.zMax - bounds.zMin) * spreadFactor;

    x += (Math.random() - 0.5) * spreadX;
    y += (Math.random() - 0.5) * spreadY;
    z += (Math.random() - 0.5) * spreadZ;

    // Re-clamp after randomization
    x = Math.max(bounds.xMin + marginX, Math.min(bounds.xMax - marginX, x));
    y = Math.max(bounds.yMin + marginY, Math.min(bounds.yMax - marginY, y));
    z = Math.max(bounds.zMin + marginZ, Math.min(bounds.zMax - marginZ, z));

    return new THREE.Vector3(x, y, z);
  }

  // Check if a point is inside an organ's bounds
  function isInsideOrganBounds(point, organName) {
    const organMap = {
      'Brain': organMeshes.brain,
      'Liver': organMeshes.liver,
      'Stomach': organMeshes.stomach,
      'Lungs (Left)': organMeshes.lungs,
      'Lungs (Right)': organMeshes.lungs
    };

    const organ = organMap[organName];
    if (!organ || !organ.userData.bounds) return false;

    let bounds;
    if (organName === 'Lungs (Left)') {
      bounds = organ.userData.bounds.left;
    } else if (organName === 'Lungs (Right)') {
      bounds = organ.userData.bounds.right;
    } else {
      bounds = organ.userData.bounds;
    }

    return point.x >= bounds.xMin && point.x <= bounds.xMax &&
           point.y >= bounds.yMin && point.y <= bounds.yMax &&
           point.z >= bounds.zMin && point.z <= bounds.zMax;
  }

  // Reposition tumors in a specific organ (called when organ mesh loads)
  function repositionOrganTumors(organName) {
    droppedTumors.forEach(tumor => {
      const region = tumor.userData.region;
      if (region !== organName) return;

      const currentPos = tumor.position.clone();

      // Check if already inside bounds
      if (isInsideOrganBounds(currentPos, region)) {
        console.log(`${organName} tumor already inside bounds`);
        return;
      }

      // Reposition to inside the organ
      const newPosition = getPositionInsideOrgan(currentPos, region);
      tumor.position.copy(newPosition);
      tumor.userData.localPosition = newPosition.clone();
      console.log(`Repositioned ${organName} tumor to:`, newPosition);
    });
  }

  // Legacy function for lungs compatibility
  function getPositionInsideLung(dropPoint, lungSide) {
    return getPositionInsideOrgan(dropPoint, lungSide);
  }

  function repositionLungTumors() {
    repositionOrganTumors('Lungs (Left)');
    repositionOrganTumors('Lungs (Right)');
  }

  // Reposition existing tumors to be inside their organ meshes
  function repositionTumorsIntoOrgans() {
    const organRegions = ['Brain', 'Lungs (Left)', 'Lungs (Right)', 'Liver', 'Stomach'];

    droppedTumors.forEach(tumor => {
      const region = tumor.userData.region;
      if (!region || !organRegions.includes(region)) return;

      const localPoint = tumor.position.clone();

      // Check if already inside bounds
      if (isInsideOrganBounds(localPoint, region)) {
        return;
      }

      // Reposition to inside the organ
      const newPosition = getPositionInsideOrgan(localPoint, region);
      tumor.position.copy(newPosition);
      tumor.userData.localPosition = newPosition.clone();
    });

    console.log('Repositioned existing tumors into organs');
  }

  // ============================================
  // TUMOR - Draggable lumpy sphere
  // ============================================

  let tumorMesh = null;
  let tumorGroup = null;
  let isDraggingTumor = false;
  const droppedTumors = [];  // Track all dropped tumors
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const dragPoint = new THREE.Vector3();

  // Create lumpy sphere geometry
  function createLumpySphere(radius, segments, lumpiness) {
    const geometry = new THREE.IcosahedronGeometry(radius, 4);
    const positions = geometry.attributes.position;

    // Random seed for this particular tumor (consistent per tumor)
    const seed = Math.random() * 100;

    // Apply noise to vertices for lumpy effect
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      // Simple noise based on position
      const noise = Math.sin(x * 5 + seed) * Math.cos(y * 5) * Math.sin(z * 5 + seed) * lumpiness +
                    Math.sin(x * 10 + 1) * Math.cos(y * 10 + 2) * lumpiness * 0.5;

      const scale = 1 + noise;
      positions.setXYZ(i, x * scale, y * scale, z * scale);
    }

    geometry.computeVertexNormals();
    return geometry;
  }

  // Create text sprite for tumor label (size + hint)
  // Intro animation state
  let showIntroGlow = true;

  function stopIntroAnimation() {
    if (!showIntroGlow) return;
    showIntroGlow = false;
    // 2D panel handles tumor creation now - no 3D intro glow needed
  }

  function createTumorLabel(size) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 512, 256);

    // Size text (larger, bold)
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(size + 'mm', 256, 90);

    // Hint text (smaller, bold)
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('Click to set size', 256, 175);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.9, 0.45, 1);
    sprite.renderOrder = 1000;
    return sprite;
  }

  // "Create Tumor" intro hint label (below tumor)
  function createIntroHintLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 512, 128);

    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Create Tumor', 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.0, 0.25, 1);
    sprite.position.set(0, -0.55, 0); // Below tumor
    sprite.renderOrder = 1000;
    sprite.name = 'introHint';
    return sprite;
  }

  // Function to create a new draggable tumor
  function createNewTumor() {
    const tumorGeo = createLumpySphere(
      CONFIG.tumor.size,
      CONFIG.tumor.segments,
      CONFIG.tumor.lumpiness
    );

    const tumorOutlineMat = new THREE.ShaderMaterial({
      uniforms: {
        uOutlineColor: { value: new THREE.Color(CONFIG.humanBody.outlineColor) },
        uOutlineThickness: { value: 0.006 }
      },
      vertexShader: `
        uniform float uOutlineThickness;
        void main() {
          vec3 pos = position + normal * uOutlineThickness;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uOutlineColor;
        void main() {
          gl_FragColor = vec4(uOutlineColor, 1.0);
        }
      `,
      side: THREE.BackSide
    });

    const tumorInnerMat = new THREE.ShaderMaterial({
      uniforms: {
        uInnerColor: { value: new THREE.Color(CONFIG.humanBody.innerColor) },
        uGlow: { value: 0.0 }
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uInnerColor;
        uniform float uGlow;
        void main() {
          vec3 glowColor = vec3(0.6, 0.9, 0.9); // Cyan-ish glow
          vec3 color = mix(uInnerColor, glowColor, uGlow * 0.6);
          gl_FragColor = vec4(color * (1.0 + uGlow * 0.5), 1.0);
        }
      `,
      side: THREE.FrontSide
    });

    const group = new THREE.Group();
    const tumorInner = new THREE.Mesh(tumorGeo, tumorInnerMat);
    const tumorOutline = new THREE.Mesh(tumorGeo.clone(), tumorOutlineMat);

    group.add(tumorInner);
    group.add(tumorOutline);

    // Store material reference for glow animation
    group.userData.innerMaterial = tumorInnerMat;

    // Add size label
    const label = createTumorLabel(tumorSizeMM);
    label.name = 'sizeLabel';
    group.add(label);

    // Add intro hint label (only for first tumor)
    if (showIntroGlow) {
      const introHint = createIntroHintLabel();
      group.add(introHint);
    }

    group.position.set(
      CONFIG.tumor.position.x,
      CONFIG.tumor.position.y,
      CONFIG.tumor.position.z
    );

    group.userData.isDraggable = true;
    group.userData.originalPosition = group.position.clone();
    group.userData.originalScale = 1.0;

    scene.add(group);
    return group;
  }

  // Update tumor label - 2D panel handles display now
  function updateTumorLabel() {
    // 2D panel has its own size display, nothing to update here
  }

  // Default tumor size (must be defined before createNewTumor is called)
  let tumorSizeMM = 25;

  // 2D Tumor Panel - replaces 3D floating tumor
  const tumor2D = document.getElementById('tumor-2d');
  const tumor2DClone = document.getElementById('tumor-2d-clone');
  const tumorSizeValue = document.getElementById('tumor-size-value');
  const tumorSizeInput = document.getElementById('tumor-size-input');
  let is2DDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Sync size input with display
  if (tumorSizeInput) {
    tumorSizeInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value) || 25;
      val = Math.max(1, Math.min(70, val));
      tumorSizeMM = val;
      if (tumorSizeValue) tumorSizeValue.textContent = val;
    });

    tumorSizeInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value) || 25;
      val = Math.max(1, Math.min(70, val));
      tumorSizeMM = val;
      e.target.value = val;
      if (tumorSizeValue) tumorSizeValue.textContent = val;
    });
  }

  // Update clone size based on current tumor size (scale 30-100px based on 1-70mm)
  function updateCloneSize() {
    if (!tumor2DClone) return;
    const minPx = 30;
    const maxPx = 100;
    const sizePx = minPx + ((tumorSizeMM - 1) / 69) * (maxPx - minPx);
    tumor2DClone.style.width = sizePx + 'px';
    tumor2DClone.style.height = sizePx + 'px';
  }

  // 2D Tumor drag start
  if (tumor2D) {
    tumor2D.addEventListener('mousedown', (e) => {
      e.preventDefault();
      is2DDragging = true;

      // Show clone at mouse position
      updateCloneSize();

      // Copy temperature class to clone for matching color
      tumor2DClone.classList.remove('temp-hot', 'temp-warm', 'temp-cold');
      const tempClass = [...tumor2D.classList].find(c => c.startsWith('temp-'));
      if (tempClass) tumor2DClone.classList.add(tempClass);

      tumor2DClone.classList.add('visible');
      tumor2DClone.style.left = (e.clientX - parseInt(tumor2DClone.style.width || 40) / 2) + 'px';
      tumor2DClone.style.top = (e.clientY - parseInt(tumor2DClone.style.height || 40) / 2) + 'px';

      // Shrink original
      tumor2D.classList.add('dragging');

      // Disable orbit controls
      if (controls) controls.enabled = false;
    });
  }

  // 2D Tumor drag move (on document)
  document.addEventListener('mousemove', (e) => {
    if (!is2DDragging) return;

    // Move clone
    const sizePx = parseInt(tumor2DClone.style.width || 40);
    tumor2DClone.style.left = (e.clientX - sizePx / 2) + 'px';
    tumor2DClone.style.top = (e.clientY - sizePx / 2) + 'px';
  });

  // 2D Tumor drag end (on document)
  document.addEventListener('mouseup', (e) => {
    if (!is2DDragging) return;
    is2DDragging = false;

    // Hide clone and reset original
    tumor2DClone.classList.remove('visible');
    tumor2D.classList.remove('dragging');

    // Re-enable orbit controls
    if (controls) controls.enabled = true;

    // Check if dropped on body using raycasting
    if (humanBodyMesh) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(humanBodyMesh, true);

      if (intersects.length > 0) {
        // Create 3D tumor at drop point
        create3DTumorAtDropPoint(intersects[0], tumorSizeMM);
      }
    }
  });

  // Create 3D tumor when dropped on body
  function create3DTumorAtDropPoint(intersection, sizeMM) {
    const hitPoint = intersection.point;
    const hitNormal = intersection.face.normal.clone();

    // Transform normal to world space
    hitNormal.transformDirection(intersection.object.matrixWorld);

    // Push the point inside the body along the normal (x-ray effect)
    const insidePoint = hitPoint.clone().sub(
      hitNormal.multiplyScalar(CONFIG.tumor.depthIntoBody)
    );

    // Convert to body's local space
    const localPoint = humanBodyMesh.worldToLocal(insidePoint.clone());

    // Detect general body area (Starfall - no organ snapping)
    let regionName;
    if (localPoint.y > 80) regionName = 'Head';
    else if (localPoint.y > 60) regionName = 'Upper Torso';
    else if (localPoint.y > 35) regionName = 'Lower Torso';
    else if (localPoint.y > 15) regionName = 'Upper Limbs';
    else regionName = 'Lower Limbs';

    if (Math.abs(localPoint.x) > 3) {
      regionName += localPoint.x > 0 ? ' (Left)' : ' (Right)';
    }

    const region = { name: regionName };

    // Use the drop point directly (no organ repositioning)
    let finalPosition = localPoint.clone();

    // Create 3D tumor geometry
    const tumorGeo = createLumpySphere(
      CONFIG.tumor.size,
      CONFIG.tumor.segments,
      CONFIG.tumor.lumpiness
    );

    // Create solid material (color will be set by temperature system)
    const solidMat = new THREE.MeshBasicMaterial({
      color: 0xFFAA33, // Default warm, will be updated
      depthTest: false
    });

    const newTumor = new THREE.Group();
    const mesh = new THREE.Mesh(tumorGeo, solidMat);
    mesh.name = 'tumorMesh';
    mesh.renderOrder = 999;
    mesh.onBeforeRender = function(renderer) {
      renderer.clearDepth();
    };
    newTumor.add(mesh);

    // Position inside the body
    newTumor.position.copy(finalPosition);

    // Store tumor info
    newTumor.userData.region = region.name;
    newTumor.userData.sizeMM = sizeMM;
    newTumor.userData.initialSizeMM = sizeMM;
    newTumor.userData.localPosition = finalPosition.clone();

    // Get PD-L1 status from selector
    const pdl1Select = document.getElementById('tumor-pdl1-select');
    if (pdl1Select && pdl1Select.value) {
      newTumor.userData.pdl1 = pdl1Select.value;
    }

    // Get temperature from selector or derive from PD-L1
    const tempSelect = document.getElementById('tumor-temp-select');
    if (tempSelect && tempSelect.value) {
      newTumor.userData.temperature = tempSelect.value;
    } else {
      // Auto-derive from PD-L1
      newTumor.userData.temperature = getTemperatureFromPDL1(newTumor.userData.pdl1);
    }

    // Apply temperature-based color and glow
    applyTemperatureVisuals(newTumor);

    // Scale based on size
    const targetScale = (sizeMM * MM_TO_SCALE) / CONFIG.tumor.size;
    newTumor.scale.setScalar(0.01); // Start tiny for animation

    // Add to body
    humanBodyMesh.add(newTumor);
    droppedTumors.push(newTumor);
    tumorInitialSizes.set(newTumor, targetScale);

    // Animate to target scale
    animateTumorDrop(newTumor, targetScale);

    // Update burden and save
    if (typeof updateTumorBurden === 'function') updateTumorBurden();
    if (typeof saveCurrentSubject === 'function') saveCurrentSubject();

    // Update medication panel with relevant drugs for new tumor type
    if (typeof updateMedicationPanel === 'function') updateMedicationPanel();

    console.log(`Tumor placed: ${region.name}, ${sizeMM}mm. Total: ${droppedTumors.length}`);
  }

  // Don't create initial 3D tumor - using 2D panel now
  // if (CONFIG.tumor.enabled) {
  //   tumorGroup = createNewTumor();
  //   tumorMesh = tumorGroup;
  //   console.log('Tumor created');
  // }

  // Create fixed tumor panel (stays in place, tumor drags off of it)
  let tumorPanelGroup = null;
  function createTumorPanel() {
    const panelWidth = 0.95;
    const panelHeight = 1.65;
    const panelRadius = 0.08;
    const panelShape = new THREE.Shape();
    panelShape.moveTo(-panelWidth/2 + panelRadius, -panelHeight/2);
    panelShape.lineTo(panelWidth/2 - panelRadius, -panelHeight/2);
    panelShape.quadraticCurveTo(panelWidth/2, -panelHeight/2, panelWidth/2, -panelHeight/2 + panelRadius);
    panelShape.lineTo(panelWidth/2, panelHeight/2 - panelRadius);
    panelShape.quadraticCurveTo(panelWidth/2, panelHeight/2, panelWidth/2 - panelRadius, panelHeight/2);
    panelShape.lineTo(-panelWidth/2 + panelRadius, panelHeight/2);
    panelShape.quadraticCurveTo(-panelWidth/2, panelHeight/2, -panelWidth/2, panelHeight/2 - panelRadius);
    panelShape.lineTo(-panelWidth/2, -panelHeight/2 + panelRadius);
    panelShape.quadraticCurveTo(-panelWidth/2, -panelHeight/2, -panelWidth/2 + panelRadius, -panelHeight/2);

    const group = new THREE.Group();

    // Panel fill - very bright to compensate for heavy post-processing
    const panelGeo = new THREE.ShapeGeometry(panelShape);
    const panelMat = new THREE.MeshBasicMaterial({
      color: 0x4A5A68,  // Much brighter base color
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      toneMapped: false  // Bypass tone mapping
    });
    const panelMesh = new THREE.Mesh(panelGeo, panelMat);
    panelMesh.name = 'panelFill';
    panelMesh.renderOrder = -1;
    group.add(panelMesh);

    // Panel border - bright teal
    const borderPoints = panelShape.getPoints(32);
    borderPoints.push(borderPoints[0]);
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x8AABA9,
      transparent: true,
      opacity: 1.0,
      toneMapped: false
    });
    const borderLine = new THREE.Line(borderGeo, borderMat);
    borderLine.name = 'panelBorder';
    borderLine.renderOrder = 0;
    group.add(borderLine);

    group.renderOrder = -1; // Render before tumor
    scene.add(group);
    return group;
  }

  // 3D tumor panel disabled - using 2D HTML panel now
  // tumorPanelGroup = createTumorPanel();

  // Size menu handling
  const sizeMenu = document.getElementById('tumor-size-menu');
  const sizeInput = document.getElementById('tumor-size-input');
  const sizeOkBtn = document.getElementById('tumor-size-ok');
  let clickStartTime = 0;
  let clickStartPos = { x: 0, y: 0 };

  // Tumor info dialog
  const infoDialog = document.getElementById('tumor-info-dialog');
  const infoRegion = document.getElementById('tumor-info-region');
  const infoMM = document.getElementById('tumor-info-mm');
  const infoPDL1 = document.getElementById('tumor-info-pdl1-value');
  const infoCloseBtn = document.getElementById('tumor-info-close');
  const infoDeleteBtn = document.getElementById('tumor-info-delete');
  let selectedTumor = null;

  // Hint labels
  const tumorHint = document.getElementById('tumor-hint');
  const bodyHint = document.getElementById('body-hint');

  function updateHintPositions() {
    // 2D HTML panel handles tumor hints now
    // Body hint - always visible, fixed position (set in CSS)
  }

  // Pulse rings for highlighting selected tumor
  const pulseRings = [];

  function createPulseRings(tumor) {
    // Clear any existing rings
    pulseRings.forEach(ring => {
      if (ring.parent) ring.parent.remove(ring);
    });
    pulseRings.length = 0;

    // Create 3 expanding rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(0.01, 0.015, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x66ffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthTest: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.renderOrder = 1001;
      ring.userData.startTime = clock.getElapsedTime() + i * 0.2;
      ring.userData.duration = 1.0;

      // Position at tumor location
      tumor.getWorldPosition(ring.position);

      // Face camera
      ring.lookAt(camera.position);

      scene.add(ring);
      pulseRings.push(ring);
    }
  }

  function updatePulseRings() {
    const time = clock.getElapsedTime();
    for (let i = pulseRings.length - 1; i >= 0; i--) {
      const ring = pulseRings[i];
      const elapsed = time - ring.userData.startTime;

      if (elapsed < 0) continue; // Not started yet

      const progress = elapsed / ring.userData.duration;

      if (progress >= 1) {
        // Ring finished, restart it
        ring.userData.startTime = time + 0.2;
        ring.scale.setScalar(1);
        ring.material.opacity = 0.8;
      } else {
        // Expand and fade
        const scale = 1 + progress * 4;
        ring.scale.setScalar(scale);
        ring.material.opacity = 0.8 * (1 - progress);
        ring.lookAt(camera.position);

        // Update position to follow tumor
        if (selectedTumor) {
          selectedTumor.getWorldPosition(ring.position);
        }
      }
    }
  }

  function clearPulseRings() {
    pulseRings.forEach(ring => {
      if (ring.parent) ring.parent.remove(ring);
    });
    pulseRings.length = 0;
  }

  function showInfoDialog(tumor, x, y) {
    selectedTumor = tumor;

    // Highlight the tumor
    tumor.traverse((child) => {
      if (child.isMesh) {
        if (child.material && child.material.color) {
          child.userData.originalColor = child.material.color.getHex();
          child.material.color.setHex(0x88ddff); // Bright highlight
        } else if (child.material && child.material.uniforms && child.material.uniforms.uBaseColor) {
          // Metastasis shader - brighten
          child.userData.wasMetastasis = true;
          child.material.uniforms.uBaseColor.value.setHex(0xff8888);
          child.material.uniforms.uPulseColor.value.setHex(0xffcccc);
        }
      }
    });

    // Create pulse rings
    createPulseRings(tumor);

    // Show metastasis info differently
    if (tumor.userData.isMetastasis) {
      infoRegion.textContent = '⚠ New Met: ' + (tumor.userData.region || 'Unknown');
      infoRegion.style.color = '#ff6666';
    } else {
      infoRegion.textContent = tumor.userData.region || 'Unknown';
      infoRegion.style.color = '';
    }
    infoMM.textContent = tumor.userData.sizeMM || '?';

    // Display PD-L1 status
    if (infoPDL1) {
      const pdl1 = tumor.userData.pdl1;
      if (pdl1) {
        let displayText = pdl1.charAt(0).toUpperCase() + pdl1.slice(1);
        if (tumor.userData.pdl1Score != null) {
          displayText += ` (${tumor.userData.pdl1Score}%)`;
        }
        infoPDL1.textContent = displayText;
        infoPDL1.className = `pdl1-${pdl1}`;
      } else {
        infoPDL1.textContent = 'Unknown';
        infoPDL1.className = '';
      }
    }

    // Display temperature status
    const infoTemp = document.getElementById('tumor-info-temp-value');
    if (infoTemp) {
      const temp = getTumorTemperature(tumor);
      const visuals = getTemperatureVisuals(temp);
      infoTemp.textContent = visuals.name;
      infoTemp.className = `temp-${temp}`;
    }

    infoDialog.style.display = 'block';
    infoDialog.style.left = x + 'px';
    infoDialog.style.top = y + 'px';
  }

  function hideInfoDialog() {
    // Restore tumor color
    if (selectedTumor) {
      selectedTumor.traverse((child) => {
        if (child.isMesh) {
          if (child.userData.originalColor !== undefined) {
            child.material.color.setHex(child.userData.originalColor);
          } else if (child.userData.wasMetastasis) {
            // Restore metastasis colors
            child.material.uniforms.uBaseColor.value.setHex(0xcc3333);
            child.material.uniforms.uPulseColor.value.setHex(0xff6666);
          }
        }
      });
    }

    // Clear pulse rings
    clearPulseRings();

    infoDialog.style.display = 'none';
    selectedTumor = null;
  }

  infoCloseBtn.addEventListener('click', hideInfoDialog);

  infoDeleteBtn.addEventListener('click', () => {
    if (selectedTumor) {
      // Mark tumor as surgically removed in spider plot data
      const plotId = selectedTumor.userData.plotId;
      if (plotId !== undefined && plotId !== null) {
        const data = tumorGrowthData.get(plotId);
        if (data) {
          data.removed = true;
          data.removedAtMonth = currentMonth;
        }
        drawCurrentPlot();
      }
      // Remove from droppedTumors array
      const idx = droppedTumors.indexOf(selectedTumor);
      if (idx > -1) droppedTumors.splice(idx, 1);
      // Remove from tumorInitialSizes map
      tumorInitialSizes.delete(selectedTumor);
      // Remove from scene
      if (selectedTumor.parent) selectedTumor.parent.remove(selectedTumor);
      console.log('Tumor surgically removed. Remaining:', droppedTumors.length);
      // Update tumor burden display
      if (typeof updateTumorBurden === 'function') updateTumorBurden();
      hideInfoDialog();
    }
  });

  // Marble = 15mm, Max = 70mm
  // Scale: 0.021 base dropped size = ~25mm
  const MM_TO_SCALE = 1.4 / 25; // Scale units per mm (scaled for HumanBody.fbx)

  // ============================================
  // TUMOR TEMPERATURE SYSTEM (hot/warm/cold)
  // Replaces organ-based coloring with immune microenvironment
  // ============================================
  const TUMOR_TEMPERATURES = {
    hot:  { color: 0xFF5533, glowColor: 0xFF4422, glowIntensity: 0.8, name: 'Hot' },
    warm: { color: 0xFFAA33, glowColor: 0xFFAA33, glowIntensity: 0.3, name: 'Warm' },
    cold: { color: 0x3388EE, glowColor: 0x3388EE, glowIntensity: 0.1, name: 'Cold' }
  };

  // Derive temperature from PD-L1 status
  function getTemperatureFromPDL1(pdl1) {
    switch (pdl1) {
      case 'high': return 'hot';
      case 'low': return 'warm';
      case 'negative': return 'cold';
      default: return 'warm'; // Unknown defaults to warm
    }
  }

  // Get tumor temperature (from explicit setting or derived from PD-L1)
  function getTumorTemperature(tumor) {
    if (tumor.userData.temperature) {
      return tumor.userData.temperature;
    }
    return getTemperatureFromPDL1(tumor.userData.pdl1);
  }

  // Get color and glow settings for a temperature
  function getTemperatureVisuals(temp) {
    return TUMOR_TEMPERATURES[temp] || TUMOR_TEMPERATURES.warm;
  }

  // Apply temperature-based visuals to a tumor (color + glow)
  function applyTemperatureVisuals(tumor) {
    const temp = getTumorTemperature(tumor);
    const visuals = getTemperatureVisuals(temp);

    // Find the main tumor mesh
    const mesh = tumor.getObjectByName('tumorMesh');
    if (mesh && mesh.material) {
      mesh.material.color.setHex(visuals.color);
    }

    // Remove existing glow if any
    const existingGlow = tumor.getObjectByName('tumorGlow');
    if (existingGlow) {
      tumor.remove(existingGlow);
    }

    // Add glow for hot/warm tumors
    if (visuals.glowIntensity > 0.2 && mesh) {
      const glowGeo = mesh.geometry.clone();
      const glowMat = new THREE.MeshBasicMaterial({
        color: visuals.glowColor,
        transparent: true,
        opacity: visuals.glowIntensity * 0.4,
        side: THREE.BackSide,
        depthTest: false
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.name = 'tumorGlow';
      glowMesh.scale.setScalar(1.3); // Glow extends beyond tumor
      glowMesh.renderOrder = 998;
      glowMesh.onBeforeRender = function(renderer) {
        renderer.clearDepth();
      };
      tumor.add(glowMesh);
    }
  }

  // ============================================
  // ANATOMICAL REGIONS (in body local space)
  // Body is scaled 0.030, positioned at y: -1.35 (HumanBody.fbx)
  // These are approximate Y ranges and X bounds
  // Scale factor from old mesh: 66.67x (2.0 / 0.030)
  // ============================================
  // Calibrated from actual mesh coordinates:
  // Calibrated for MedicalHuman_03.fbx at scale 0.015
  // Brain: y≈84, Lungs: y≈52, Liver: y≈21, Stomach: y≈15
  // X: center ≈ 0, left side (viewer's right) = positive, right = negative
  const BODY_REGIONS = [
    {
      name: 'Brain',
      color: 0x9966CC,  // Purple
      yMin: 75, yMax: 95,
      xMin: -7, xMax: 7
    },
    {
      name: 'Lungs (Left)',
      color: 0x334466,  // Dark blue (darker for visibility)
      yMin: 42, yMax: 62,
      xMin: 2, xMax: 8
    },
    {
      name: 'Lungs (Right)',
      color: 0x334466,  // Dark blue (darker for visibility)
      yMin: 42, yMax: 62,
      xMin: -8, xMax: -2
    },
    {
      name: 'Breast (Left)',
      color: 0xCC9999,  // Pink
      yMin: 38, yMax: 48,
      xMin: 1.5, xMax: 7
    },
    {
      name: 'Breast (Right)',
      color: 0xCC9999,  // Pink
      yMin: 38, yMax: 48,
      xMin: -7, xMax: -1.5
    },
    {
      name: 'Liver',
      color: 0x8B4513,  // Brown
      yMin: 15, yMax: 30,
      xMin: -7, xMax: 1.5
    },
    {
      name: 'Stomach',
      color: 0xDAA520,  // Goldenrod
      yMin: 8, yMax: 22,
      xMin: -1.5, xMax: 7
    }
  ];

  function getRegionAtPosition(localPos) {
    // Use raw local coordinates - will calibrate based on actual mesh
    const y = localPos.y;
    const x = localPos.x;

    console.log(`  Region check: x=${x.toFixed(3)}, y=${y.toFixed(3)}`);

    // Helper to check if point is inside organ bounds
    function isInsideBounds(bounds) {
      return localPos.x >= bounds.xMin && localPos.x <= bounds.xMax &&
             localPos.y >= bounds.yMin && localPos.y <= bounds.yMax &&
             localPos.z >= bounds.zMin && localPos.z <= bounds.zMax;
    }

    // Check if inside brain mesh (using actual bounds)
    if (organMeshes.brain && organMeshes.brain.userData.bounds) {
      if (isInsideBounds(organMeshes.brain.userData.bounds)) {
        console.log(`  Matched: Brain (mesh bounds)`);
        return { name: 'Brain', color: 0xcc9999 };
      }
    } else if (organMeshes.brain) {
      // Fallback to sphere check (scaled for HumanBody.fbx)
      const brainPos = organMeshes.brain.position;
      const brainRadius = 5.3;  // Was 0.08, scaled by 66.67x
      const dx = localPos.x - brainPos.x;
      const dy = localPos.y - brainPos.y;
      const dz = localPos.z - brainPos.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < brainRadius) {
        console.log(`  Matched: Brain (fallback)`);
        return { name: 'Brain', color: 0xcc9999 };
      }
    }

    // Check if inside lungs mesh (using actual computed bounds)
    if (organMeshes.lungs && organMeshes.lungs.userData.bounds) {
      const bounds = organMeshes.lungs.userData.bounds;

      // Check left lung
      if (isInsideBounds(bounds.left)) {
        console.log(`  Matched: Lungs (Left) (mesh bounds)`);
        return { name: 'Lungs (Left)', color: 0x445566 };
      }

      // Check right lung
      if (isInsideBounds(bounds.right)) {
        console.log(`  Matched: Lungs (Right) (mesh bounds)`);
        return { name: 'Lungs (Right)', color: 0x445566 };
      }
    } else if (organMeshes.lungs) {
      // Fallback to ellipsoid check (scaled for HumanBody.fbx)
      const lungsPos = organMeshes.lungs.position;
      const dx = (localPos.x - lungsPos.x) / 8;   // Was 0.12, scaled by 66.67x
      const dy = (localPos.y - lungsPos.y) / 6.7; // Was 0.10, scaled by 66.67x
      const dz = (localPos.z - lungsPos.z) / 4;   // Was 0.06, scaled by 66.67x
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.0) {
        const lungSide = localPos.x > lungsPos.x ? 'Lungs (Left)' : 'Lungs (Right)';
        console.log(`  Matched: ${lungSide} (fallback)`);
        return { name: lungSide, color: 0x445566 };
      }
    }

    // Check if inside liver mesh (using actual bounds)
    if (organMeshes.liver && organMeshes.liver.userData.bounds) {
      if (isInsideBounds(organMeshes.liver.userData.bounds)) {
        console.log(`  Matched: Liver (mesh bounds)`);
        return { name: 'Liver', color: 0xaa6655 };
      }
    } else if (organMeshes.liver) {
      // Fallback to sphere check (scaled for HumanBody.fbx)
      const liverPos = organMeshes.liver.position;
      const dx = localPos.x - liverPos.x;
      const dy = localPos.y - liverPos.y;
      const dz = localPos.z - liverPos.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 5.3) {  // Was 0.08, scaled by 66.67x
        console.log(`  Matched: Liver (fallback)`);
        return { name: 'Liver', color: 0xaa6655 };
      }
    }

    // Check if inside stomach mesh (using actual bounds)
    if (organMeshes.stomach && organMeshes.stomach.userData.bounds) {
      if (isInsideBounds(organMeshes.stomach.userData.bounds)) {
        console.log(`  Matched: Stomach (mesh bounds)`);
        return { name: 'Stomach', color: 0xccaa77 };
      }
    } else if (organMeshes.stomach) {
      // Fallback to sphere check (scaled for HumanBody.fbx)
      const stomachPos = organMeshes.stomach.position;
      const dx = localPos.x - stomachPos.x;
      const dy = localPos.y - stomachPos.y;
      const dz = localPos.z - stomachPos.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 4) {  // Was 0.06, scaled by 66.67x
        console.log(`  Matched: Stomach (fallback)`);
        return { name: 'Stomach', color: 0xccaa77 };
      }
    }

    // Fallback to Y/X range check
    for (const region of BODY_REGIONS) {
      if (y >= region.yMin && y <= region.yMax &&
          x >= region.xMin && x <= region.xMax) {
        console.log(`  Matched: ${region.name}`);
        return region;
      }
    }
    return { name: 'Other', color: 0x2E5470 }; // Default
  }

  // Find the nearest organ to a given point (for snapping tumors)
  function getNearestOrgan(localPos) {
    // Get lung center positions from bounds if available
    let leftLungCenter = new THREE.Vector3(4, 52, -6);
    let rightLungCenter = new THREE.Vector3(-4, 52, -6);

    if (organMeshes.lungs && organMeshes.lungs.userData.bounds) {
      const lb = organMeshes.lungs.userData.bounds.left;
      const rb = organMeshes.lungs.userData.bounds.right;
      leftLungCenter = new THREE.Vector3(
        (lb.xMin + lb.xMax) / 2,
        (lb.yMin + lb.yMax) / 2,
        (lb.zMin + lb.zMax) / 2
      );
      rightLungCenter = new THREE.Vector3(
        (rb.xMin + rb.xMax) / 2,
        (rb.yMin + rb.yMax) / 2,
        (rb.zMin + rb.zMax) / 2
      );
    }

    const organCenters = [
      { name: 'Brain', color: 0x9966CC, center: organMeshes.brain ? organMeshes.brain.position.clone() : new THREE.Vector3(0, 90, -1) },
      { name: 'Lungs (Left)', color: 0x334466, center: leftLungCenter },
      { name: 'Lungs (Right)', color: 0x334466, center: rightLungCenter },
      { name: 'Liver', color: 0x8B4513, center: organMeshes.liver ? organMeshes.liver.position.clone() : new THREE.Vector3(0, 25, -0.4) },
      { name: 'Stomach', color: 0xDAA520, center: organMeshes.stomach ? organMeshes.stomach.position.clone() : new THREE.Vector3(0, 11, -0.4) }
    ];

    let nearest = organCenters[0];
    let minDist = Infinity;

    for (const organ of organCenters) {
      const dist = localPos.distanceTo(organ.center);
      if (dist < minDist) {
        minDist = dist;
        nearest = organ;
      }
    }

    console.log(`  Nearest organ: ${nearest.name} (dist: ${minDist.toFixed(2)})`);
    return nearest;
  }

  // ============================================
  // ORGAN REGION SHAPES (procedural outlines)
  // ============================================

  const organShapes = [];

  function createOrganOutlineMaterial(color) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0.4 }
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        void main() {
          gl_FragColor = vec4(uColor, uOpacity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false
    });
  }

  function createOrganShape(geometry, color, position, scale) {
    const group = new THREE.Group();

    // Outline only (back faces pushed outward)
    const outlineMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uThickness: { value: 0.003 }
      },
      vertexShader: `
        uniform float uThickness;
        void main() {
          vec3 pos = position + normal * uThickness;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false
    });

    const outline = new THREE.Mesh(geometry, outlineMat);
    group.add(outline);

    group.position.set(position.x, position.y, position.z);
    if (scale.x !== undefined) {
      group.scale.set(scale.x, scale.y, scale.z);
    } else {
      group.scale.setScalar(scale);
    }

    return group;
  }

  function createOrganShapes() {
    // Wait for body to be loaded
    if (!humanBodyMesh) {
      setTimeout(createOrganShapes, 100);
      return;
    }

    const organColor = 0x8AA5A4; // Lighter unified color for all organs

    // Brain - sphere at top of head, 30% forward + 10% back
    const brainGeo = new THREE.SphereGeometry(0.06, 16, 12);
    const brain = createOrganShape(brainGeo, organColor, { x: 0, y: 1.68, z: 0.02 }, { x: 1, y: 1, z: 1.4 });
    humanBodyMesh.add(brain);
    organShapes.push(brain);

    // Lungs - tapered (wider at bottom), use cylinder geometry
    const lungGeo = new THREE.CylinderGeometry(0.025, 0.05, 0.12, 12, 1); // top radius, bottom radius, height
    const lungLeft = createOrganShape(lungGeo, organColor, { x: 0.055, y: 1.30, z: 0.02 }, { x: 1.2, y: 2.0, z: 0.7 });
    const lungRight = createOrganShape(lungGeo, organColor, { x: -0.055, y: 1.30, z: 0.02 }, { x: 1.2, y: 2.0, z: 0.7 });
    humanBodyMesh.add(lungLeft);
    humanBodyMesh.add(lungRight);
    organShapes.push(lungLeft, lungRight);

    // Liver - larger shape on right side
    const liverGeo = new THREE.SphereGeometry(0.045, 12, 10);
    const liver = createOrganShape(liverGeo, organColor, { x: -0.04, y: 1.15, z: 0.03 }, { x: 1.2, y: 0.8, z: 0.6 });
    humanBodyMesh.add(liver);
    organShapes.push(liver);

    // Stomach - center left
    const stomachGeo = new THREE.SphereGeometry(0.035, 12, 10);
    const stomach = createOrganShape(stomachGeo, organColor, { x: 0.03, y: 1.10, z: 0.03 }, { x: 1.0, y: 1.2, z: 0.7 });
    humanBodyMesh.add(stomach);
    organShapes.push(stomach);

    // Breasts - twice as large, slightly apart
    const breastGeo = new THREE.SphereGeometry(0.025, 12, 10);
    const breastLeft = createOrganShape(breastGeo, organColor, { x: 0.055, y: 1.32, z: 0.06 }, 2);
    const breastRight = createOrganShape(breastGeo, organColor, { x: -0.055, y: 1.32, z: 0.06 }, 2);
    humanBodyMesh.add(breastLeft);
    humanBodyMesh.add(breastRight);
    organShapes.push(breastLeft, breastRight);

    // Hide all organ shapes (keep for future use)
    organShapes.forEach(shape => shape.visible = false);

    console.log('Organ region shapes created (hidden)');
  }

  // Start creating organ shapes after a short delay
  setTimeout(createOrganShapes, 500);

  function showSizeMenu(x, y) {
    sizeMenu.style.display = 'block';
    sizeMenu.style.left = x + 'px';
    sizeMenu.style.top = y + 'px';
    sizeInput.value = tumorSizeMM;
    sizeInput.focus();
    sizeInput.select();
  }

  function hideSizeMenu() {
    sizeMenu.style.display = 'none';
  }

  sizeOkBtn.addEventListener('click', () => {
    tumorSizeMM = Math.max(0, Math.min(70, parseInt(sizeInput.value) || 25));
    updateTumorLabel();
    hideSizeMenu();
  });

  sizeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      tumorSizeMM = Math.max(0, Math.min(70, parseInt(sizeInput.value) || 25));
      updateTumorLabel();
      hideSizeMenu();
    } else if (e.key === 'Escape') {
      hideSizeMenu();
    }
  });

  // Drag and drop handling (now only for dropped tumors - 2D panel handles creation)
  function onMouseDown(event) {
    // Hide menus if clicking elsewhere
    if (sizeMenu && !sizeMenu.contains(event.target)) {
      hideSizeMenu();
    }
    if (infoDialog && !infoDialog.contains(event.target)) {
      hideInfoDialog();
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check for click on dropped tumors (for info dialog)
    if (droppedTumors.length > 0 && humanBodyMesh) {
      for (const droppedTumor of droppedTumors) {
        const hits = raycaster.intersectObject(droppedTumor, true);
        if (hits.length > 0) {
          // Clicked on a dropped tumor - show info
          showInfoDialog(droppedTumor, event.clientX + 10, event.clientY + 10);
          event.stopPropagation();
          return;
        }
      }
    }

    // 3D draggable tumor removed - using 2D HTML panel now
  }

  // 3D tumor dragging removed - now using 2D HTML panel
  // Only handle cursor changes for dropped tumors
  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cursor change when hovering over dropped tumors
    if (droppedTumors.length > 0) {
      raycaster.setFromCamera(mouse, camera);
      for (const tumor of droppedTumors) {
        const hits = raycaster.intersectObject(tumor, true);
        if (hits.length > 0) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }
    }
    canvas.style.cursor = 'default';
  }

  // 3D tumor drop handling removed - now using 2D HTML panel
  // The 2D mouseup handler in the document listener handles tumor creation
  function onMouseUp(event) {
    // Nothing to do here - 2D panel handles tumor creation
  }

  function animateTumorDrop(tumor, targetScale) {
    const startScale = tumor.scale.x;
    const duration = 500; // ms
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const scale = startScale + (targetScale - startScale) * eased;
      tumor.scale.setScalar(scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  // ============================================
  // POST PROCESSING
  // ============================================

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Only add bloom if enabled
  if (CONFIG.postProcessing.bloom.enabled) {
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CONFIG.postProcessing.bloom.strength,
      CONFIG.postProcessing.bloom.radius,
      CONFIG.postProcessing.bloom.threshold
    );
    composer.addPass(bloomPass);
  }

  // Vignette with breathing pulse
  const vignetteShader = {
    uniforms: {
      tDiffuse: { value: null },
      darkness: { value: CONFIG.postProcessing.vignette.darkness },
      offset: { value: CONFIG.postProcessing.vignette.offset },
      uBrightness: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float darkness;
      uniform float offset;
      uniform float uBrightness;
      varying vec2 vUv;
      void main() {
        vec4 texel = texture2D(tDiffuse, vUv);
        vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
        texel.rgb *= 1.0 - dot(uv, uv) * darkness;
        texel.rgb *= uBrightness;
        gl_FragColor = texel;
      }
    `
  };
  const vignettePass = new ShaderPass(vignetteShader);
  composer.addPass(vignettePass);

  // Animated grain
  let grainPass = null;
  if (CONFIG.postProcessing.grain.enabled) {
    const grainShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uIntensity: { value: CONFIG.postProcessing.grain.intensity }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;

        // Pseudo-random noise function
        float random(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);

          // Animated grain - changes every frame
          float noise = random(vUv + fract(uTime)) * 2.0 - 1.0;

          // Apply grain
          texel.rgb += noise * uIntensity;

          gl_FragColor = texel;
        }
      `
    };
    grainPass = new ShaderPass(grainShader);
    composer.addPass(grainPass);
  }

  // Scan lines
  let scanLinesPass = null;
  if (CONFIG.postProcessing.scanLines.enabled) {
    const scanLinesShader = {
      uniforms: {
        tDiffuse: { value: null },
        uIntensity: { value: CONFIG.postProcessing.scanLines.intensity },
        uCount: { value: CONFIG.postProcessing.scanLines.count },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uIntensity;
        uniform float uCount;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);

          // Scan line pattern - subtle horizontal lines
          float scanLine = sin(vUv.y * uCount + uTime * 0.5) * 0.5 + 0.5;
          scanLine = smoothstep(0.3, 0.7, scanLine);

          // Darken slightly on scan lines
          texel.rgb *= 1.0 - (1.0 - scanLine) * uIntensity;

          gl_FragColor = texel;
        }
      `
    };
    scanLinesPass = new ShaderPass(scanLinesShader);
    composer.addPass(scanLinesPass);
  }

  // Sci-fi grid overlay
  let gridPass = null;
  if (CONFIG.postProcessing.grid.enabled) {
    const gridShader = {
      uniforms: {
        tDiffuse: { value: null },
        uIntensity: { value: CONFIG.postProcessing.grid.intensity },
        uSize: { value: CONFIG.postProcessing.grid.size },
        uLineWidth: { value: CONFIG.postProcessing.grid.lineWidth },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uIntensity;
        uniform float uSize;
        uniform float uLineWidth;
        uniform vec2 uResolution;
        varying vec2 vUv;

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);

          // Calculate grid in screen pixels
          vec2 pixelPos = vUv * uResolution;

          // Grid lines
          float lineX = smoothstep(uLineWidth, 0.0, mod(pixelPos.x, uSize));
          float lineY = smoothstep(uLineWidth, 0.0, mod(pixelPos.y, uSize));
          float grid = max(lineX, lineY);

          // Thicker lines at major intervals (every 4 cells)
          float majorLineX = smoothstep(uLineWidth * 2.0, 0.0, mod(pixelPos.x, uSize * 4.0));
          float majorLineY = smoothstep(uLineWidth * 2.0, 0.0, mod(pixelPos.y, uSize * 4.0));
          float majorGrid = max(majorLineX, majorLineY);

          // Combine grids
          float combinedGrid = max(grid * 0.5, majorGrid);

          // Apply grid as subtle overlay
          vec3 gridColor = vec3(0.6, 0.8, 0.8); // Cyan-ish
          texel.rgb = mix(texel.rgb, gridColor, combinedGrid * uIntensity);

          gl_FragColor = texel;
        }
      `
    };
    gridPass = new ShaderPass(gridShader);
    composer.addPass(gridPass);
  }

  // ============================================
  // TIMELINE STATE (must be before animation loop)
  // ============================================

  let isPlaying = false;
  let currentMonth = 0;
  const maxMonths = 18;
  const playbackSpeed = 0.5; // Months per second
  const tumorInitialSizes = new Map();
  const metastases = [];
  let lastSimTime = 0;
  const activeMetNotifications = []; // For NEW MET labels
  let onTimelineEndCallback = null; // Callback when timeline reaches maxMonths

  // ============================================
  // ANIMATION
  // ============================================

  const clock = new THREE.Clock();

  // Entry animation state (body rising into tank)
  let entryAnimation = {
    active: false,
    startTime: 0,
    duration: 700,
    startY: -3,
    targetY: CONFIG.humanBody.position.y
  };

  // Ease out with subtle overshoot
  function easeOutBack(t) {
    const c1 = 0.6;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function updateEntryAnimation() {
    if (!entryAnimation.active || !humanBodyMesh) return;

    const elapsed = performance.now() - entryAnimation.startTime;
    const progress = Math.min(elapsed / entryAnimation.duration, 1);

    // Ease out with overshoot
    const eased = easeOutBack(progress);

    // Interpolate Y position
    const y = entryAnimation.startY + (entryAnimation.targetY - entryAnimation.startY) * eased;
    humanBodyMesh.position.y = y;

    if (progress >= 1) {
      entryAnimation.active = false;
      humanBodyMesh.position.y = entryAnimation.targetY;
    }
  }

  function playEntryAnimation() {
    if (!humanBodyMesh) return;
    entryAnimation.active = true;
    entryAnimation.startTime = performance.now();
    entryAnimation.targetY = CONFIG.humanBody.position.y;
    humanBodyMesh.position.y = entryAnimation.startY;
  }

  // ============================================
  // NANOBOT SWARM ANIMATION
  // ============================================
  let nanobotSwarm = {
    active: false,
    particles: null,
    positions: null,
    velocities: [],
    count: 150
  };

  function initNanobotSwarm() {
    if (nanobotSwarm.particles) return;

    const count = nanobotSwarm.count;
    const geometry = new THREE.BufferGeometry();
    nanobotSwarm.positions = new Float32Array(count * 3);
    nanobotSwarm.velocities = [];

    // Initialize particles at random positions on a sphere around body
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.8 + Math.random() * 0.4;

      nanobotSwarm.positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      nanobotSwarm.positions[i * 3 + 1] = Math.cos(phi) * radius + 0.5;
      nanobotSwarm.positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;

      // Random crawling velocity
      nanobotSwarm.velocities.push({
        theta: (Math.random() - 0.5) * 0.03,
        phi: (Math.random() - 0.5) * 0.02,
        speed: 0.005 + Math.random() * 0.01
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(nanobotSwarm.positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x1a1a1a,
      size: 0.025,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    nanobotSwarm.particles = new THREE.Points(geometry, material);
    nanobotSwarm.particles.visible = false;
    scene.add(nanobotSwarm.particles);
  }

  function startNanobotSwarm() {
    if (!nanobotSwarm.particles) initNanobotSwarm();
    nanobotSwarm.active = true;
    nanobotSwarm.particles.visible = true;
  }

  function stopNanobotSwarm() {
    nanobotSwarm.active = false;
    if (nanobotSwarm.particles) {
      nanobotSwarm.particles.visible = false;
    }
  }

  function updateNanobotSwarm(time) {
    if (!nanobotSwarm.active || !nanobotSwarm.particles) return;

    const positions = nanobotSwarm.positions;
    const count = nanobotSwarm.count;

    for (let i = 0; i < count; i++) {
      const vel = nanobotSwarm.velocities[i];

      // Get current position
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];

      // Convert to spherical-ish coordinates relative to body center
      const centerY = 0.5;
      const dy = y - centerY;
      const dist = Math.sqrt(x * x + dy * dy + z * z);

      // Move along surface with some randomness
      const angle = Math.atan2(z, x) + vel.theta + Math.sin(time * 2 + i) * 0.01;
      const vertAngle = Math.atan2(dy, Math.sqrt(x * x + z * z)) + vel.phi + Math.cos(time * 3 + i * 0.5) * 0.008;

      // Keep roughly on body surface (ellipsoid shape)
      const targetDist = 0.7 + Math.sin(vertAngle * 2) * 0.2;
      const newDist = dist + (targetDist - dist) * 0.05;

      // Update position
      const horizontalDist = newDist * Math.cos(vertAngle);
      positions[i * 3] = Math.cos(angle) * horizontalDist;
      positions[i * 3 + 1] = centerY + newDist * Math.sin(vertAngle);
      positions[i * 3 + 2] = Math.sin(angle) * horizontalDist;

      // Occasionally change direction
      if (Math.random() < 0.01) {
        vel.theta = (Math.random() - 0.5) * 0.03;
        vel.phi = (Math.random() - 0.5) * 0.02;
      }
    }

    nanobotSwarm.particles.geometry.attributes.position.needsUpdate = true;
  }

  // ============================================
  // CRYO/STASIS FIELD ANIMATION
  // ============================================
  let cryoField = {
    active: false,
    mesh: null,
    pulsePhase: 0
  };

  function initCryoField() {
    if (cryoField.mesh) return;

    // Create a translucent shell around the body
    const geometry = new THREE.SphereGeometry(1.2, 32, 24);
    const material = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      wireframe: false
    });

    cryoField.mesh = new THREE.Mesh(geometry, material);
    cryoField.mesh.position.set(0, 0.5, 0);
    cryoField.mesh.scale.set(0.8, 1.4, 0.6); // Ellipsoid shape
    cryoField.mesh.visible = false;
    scene.add(cryoField.mesh);

    // Add wireframe overlay for tech look
    const wireGeometry = new THREE.SphereGeometry(1.22, 16, 12);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });
    cryoField.wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    cryoField.wireMesh.position.set(0, 0.5, 0);
    cryoField.wireMesh.scale.set(0.8, 1.4, 0.6);
    cryoField.wireMesh.visible = false;
    scene.add(cryoField.wireMesh);
  }

  function startCryoField() {
    if (!cryoField.mesh) initCryoField();
    cryoField.active = true;
    cryoField.mesh.visible = true;
    cryoField.wireMesh.visible = true;
    cryoField.pulsePhase = 0;
  }

  function stopCryoField() {
    cryoField.active = false;
    if (cryoField.mesh) {
      cryoField.mesh.visible = false;
      cryoField.wireMesh.visible = false;
    }
  }

  function updateCryoField(time) {
    if (!cryoField.active || !cryoField.mesh) return;

    // Gentle pulsing effect
    const pulse = Math.sin(time * 1.5) * 0.5 + 0.5;
    cryoField.mesh.material.opacity = 0.05 + pulse * 0.06;
    cryoField.wireMesh.material.opacity = 0.1 + pulse * 0.1;

    // Slow rotation
    cryoField.wireMesh.rotation.y = time * 0.1;
    cryoField.wireMesh.rotation.x = Math.sin(time * 0.3) * 0.1;
  }

  // Reset all medication visual effects
  function resetMedicationEffects() {
    stopNanobotSwarm();
    stopCryoField();
    // Reset active medications state
    if (typeof activeMedications !== 'undefined') {
      Object.keys(activeMedications).forEach(key => {
        activeMedications[key] = false;
      });
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Update shaders
    if (humanBodyMaterial) {
      if (humanBodyMaterial.outline) humanBodyMaterial.outline.uniforms.uTime.value = time;
      if (humanBodyMaterial.inner) humanBodyMaterial.inner.uniforms.uTime.value = time;
    }

    // Intro glow animation removed - 2D panel handles tumor creation now

    // Update grain animation
    if (grainPass) {
      grainPass.uniforms.uTime.value = time * CONFIG.postProcessing.grain.speed;
    }

    // Update scan lines animation
    if (scanLinesPass) {
      scanLinesPass.uniforms.uTime.value = time;
    }

    // Breathing pulse when playing
    if (vignettePass) {
      if (isPlaying) {
        // 1 second breathing cycle
        const breathe = Math.sin(time * 2.0 * Math.PI) * 0.5 + 0.5; // 0 to 1
        vignettePass.uniforms.uBrightness.value = 0.75 + breathe * 0.25; // 0.75 to 1.0
      } else {
        // Smoothly return to 1.0 when stopped
        const current = vignettePass.uniforms.uBrightness.value;
        vignettePass.uniforms.uBrightness.value += (1.0 - current) * 0.05;
      }
    }

    // Update pulse rings for selected tumor
    updatePulseRings();

    // Update hint label positions
    updateHintPositions();

    // Update simulation
    simulationTick();

    // Update entry animation
    updateEntryAnimation();

    // Update nanobot swarm
    updateNanobotSwarm(time);

    // Update cryo field
    updateCryoField(time);

    // 3D tumor panel replaced by 2D HTML panel - no position updates needed

    if (controls) controls.update();

    // Smooth zoom update
    if (window.updateSmoothZoom) window.updateSmoothZoom();

    // Update NEW MET notification lines (follow camera)
    if (typeof updateMetNotifications === 'function') {
      updateMetNotifications();
    }

    composer.render();
  }

  animate();

  // ============================================
  // RESIZE
  // ============================================

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);

    // Update grid resolution
    if (gridPass) {
      gridPass.uniforms.uResolution.value.set(w, h);
    }
  });

  // Create an injury anywhere on the body surface (Starfall - alien lifeforms)
  function createInjury(injuryData) {
    if (!humanBodyMesh) return null;

    const { organ, sizeMM, color, type, id, growthRate, canSpread, spreadChance, category } = injuryData;

    // For Starfall: place injuries anywhere on the body surface
    // Generate random position within body bounds
    // Body Y range: ~0 (feet) to ~105 (top of head) in local coords
    // Body X range: ~-10 to ~10 (side to side)
    // Body Z range: ~-5 to ~5 (front to back)

    const randomY = 10 + Math.random() * 85;  // Anywhere from legs to head
    const randomX = (Math.random() - 0.5) * 14; // Side to side
    const randomZ = 2 + Math.random() * 3;      // On the front surface

    // Determine general body area from Y position for labeling
    let targetRegion;
    if (randomY > 80) targetRegion = 'Head';
    else if (randomY > 60) targetRegion = 'Upper Torso';
    else if (randomY > 35) targetRegion = 'Lower Torso';
    else if (randomY > 15) targetRegion = 'Upper Limbs';
    else targetRegion = 'Lower Limbs';

    // Add left/right based on X position
    if (Math.abs(randomX) > 3) {
      targetRegion += randomX > 0 ? ' (Left)' : ' (Right)';
    }

    const pos = { x: randomX, y: randomY, z: randomZ };

    // Create injury geometry (lumpy sphere)
    const injuryGeo = createLumpySphere(
      CONFIG.tumor.size,
      CONFIG.tumor.segments,
      CONFIG.tumor.lumpiness
    );

    // Color based on injury type
    const colorMap = {
      hot: 0xFF4444,   // Red for radiation tumors
      warm: 0xFFAA33,  // Orange/yellow for wounds
      cold: 0x44AAFF   // Blue for parasites
    };

    const solidMat = new THREE.MeshBasicMaterial({
      color: colorMap[color] || 0xFFAA33,
      depthTest: false
    });

    const injury = new THREE.Group();
    const mesh = new THREE.Mesh(injuryGeo, solidMat);
    mesh.name = 'injuryMesh';
    mesh.renderOrder = 999;
    mesh.onBeforeRender = function(renderer) {
      renderer.clearDepth();
    };
    injury.add(mesh);

    // Position and scale
    injury.position.set(pos.x, pos.y, pos.z);
    const targetScale = (sizeMM * MM_TO_SCALE) / CONFIG.tumor.size;
    injury.scale.setScalar(targetScale);

    // Store injury data
    injury.userData.region = targetRegion;
    injury.userData.sizeMM = sizeMM;
    injury.userData.initialSizeMM = sizeMM;
    injury.userData.injuryType = type;
    injury.userData.injuryCategory = category;
    injury.userData.injuryId = id;
    injury.userData.temperature = color;
    injury.userData.growthRate = growthRate;
    injury.userData.canSpread = canSpread;
    injury.userData.spreadChance = spreadChance;
    injury.userData.isInjury = true;

    humanBodyMesh.add(injury);
    droppedTumors.push(injury);
    tumorInitialSizes.set(injury, targetScale);

    // Initialize tracking for graphs
    initTumorTracking(injury);
    recordTumorData(injury);

    // Update medication panel to show relevant treatments
    if (typeof updateMedicationPanel === 'function') {
      updateMedicationPanel();
    }

    console.log(`Injury placed: ${type} in ${targetRegion}, ${sizeMM}mm`);
    return injury;
  }

  window.ThreeBackground = {
    scene,
    camera,
    renderer,
    controls,
    getHumanBody: () => humanBodyMesh,
    playEntryAnimation: playEntryAnimation,
    getTumor: () => tumorGroup,
    getDroppedTumors: () => droppedTumors,
    clearAllTumors: () => {
      // Remove all dropped tumors/injuries from body
      droppedTumors.forEach(tumor => {
        if (tumor.parent) tumor.parent.remove(tumor);
      });
      droppedTumors.length = 0;
      metastases.length = 0;
      tumorInitialSizes.clear();
      // Reset medication visual effects
      resetMedicationEffects();
      // tumorGrowthData and tumorIdCounter are cleared in clearAllTumorsExtended if available
      if (typeof clearAllTumorsExtended === 'function') {
        clearAllTumorsExtended();
      }
      // Reset simulation timeline for fresh start
      currentMonth = 0;
      isPlaying = false;
      if (playPauseBtn) playPauseBtn.textContent = '▶';
      updateTimelineUI();
      // Clear the graph canvas
      if (plotCtx && plotCanvas) {
        plotCtx.clearRect(0, 0, plotCanvas.width, plotCanvas.height);
      }
      console.log('All injuries cleared, timeline reset');
    },
    createInjury: (injuryData) => createInjury(injuryData),
    setOutlineColor: (hex) => {
      if (humanBodyMaterial && humanBodyMaterial.outline) {
        humanBodyMaterial.outline.uniforms.uOutlineColor.value.setHex(hex);
      }
    },
    setOutlineThickness: (val) => {
      if (humanBodyMaterial && humanBodyMaterial.outline) {
        humanBodyMaterial.outline.uniforms.uOutlineThickness.value = val;
      }
    },
    startSimulation: () => {
      // Start the simulation automatically
      if (typeof startSimulationInternal === 'function') {
        startSimulationInternal();
      }
    },
    isSimulationRunning: () => isPlaying,
    setOnTimelineEnd: (callback) => {
      onTimelineEndCallback = callback;
    },
    getCurrentMonth: () => currentMonth,
    getMaxMonths: () => maxMonths
  };

  // ============================================
  // TIMELINE SIMULATION
  // ============================================

  const playPauseBtn = document.getElementById('play-pause-btn');
  const timelineProgress = document.getElementById('timeline-progress');
  const timelineHandle = document.getElementById('timeline-handle');
  const timelineBar = document.getElementById('timeline-bar');
  const timelineCurrent = document.getElementById('timeline-current');
  const newMetContainer = document.getElementById('new-met-container');

  function showNewMetNotification(met) {
    if (!newMetContainer || !camera) return;

    // Get met's screen position
    const metWorldPos = new THREE.Vector3();
    met.getWorldPosition(metWorldPos);
    const metScreenPos = metWorldPos.clone().project(camera);
    const metX = (metScreenPos.x * 0.5 + 0.5) * window.innerWidth;
    const metY = (-metScreenPos.y * 0.5 + 0.5) * window.innerHeight;

    // Position label just outside the body (offset from tumor position)
    const labelOnLeft = metX > window.innerWidth * 0.5;
    const labelOffset = 120; // pixels from tumor
    let labelX = labelOnLeft ? metX - labelOffset - 80 : metX + labelOffset;
    // Clamp to screen bounds
    labelX = Math.max(10, Math.min(window.innerWidth - 100, labelX));
    const labelY = Math.max(80, Math.min(window.innerHeight - 80, metY - 10));

    // Create label
    const label = document.createElement('div');
    label.className = 'new-met-label';
    label.textContent = 'NEW MET';
    label.style.left = labelX + 'px';
    label.style.top = labelY + 'px';
    newMetContainer.appendChild(label);

    // Create line connecting label to tumor
    const line = document.createElement('div');
    line.className = 'new-met-line';
    newMetContainer.appendChild(line);

    // Calculate line position and angle
    function updateLine() {
      const metWorldPosNow = new THREE.Vector3();
      met.getWorldPosition(metWorldPosNow);
      const metScreenPosNow = metWorldPosNow.clone().project(camera);
      const targetX = (metScreenPosNow.x * 0.5 + 0.5) * window.innerWidth;
      const targetY = (-metScreenPosNow.y * 0.5 + 0.5) * window.innerHeight;

      // Line starts from edge of label (right edge if on left, left edge if on right)
      const startX = labelOnLeft ? labelX + 80 : labelX;
      const startY = labelY + 12;

      const dx = targetX - startX;
      const dy = targetY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      line.style.left = startX + 'px';
      line.style.top = startY + 'px';
      line.style.width = length + 'px';
      line.style.height = '2px';
      line.style.transform = `rotate(${angle}rad)`;
    }

    updateLine();

    // Store for updates during camera movement (stays until simulation ends)
    const notification = { label, line, met, updateLine, labelOnLeft, labelX, labelY };
    activeMetNotifications.push(notification);
  }

  // Update notification lines when camera moves
  function updateMetNotifications() {
    activeMetNotifications.forEach(n => n.updateLine());
  }

  // Clear all met notifications (called when simulation ends/resets)
  function clearMetNotifications() {
    activeMetNotifications.forEach(n => {
      if (n.label.parentNode) n.label.parentNode.removeChild(n.label);
      if (n.line.parentNode) n.line.parentNode.removeChild(n.line);
    });
    activeMetNotifications.length = 0;
  }

  // Growth settings
  const metChancePerMonth = 0.08; // 8% chance of new met per month per existing tumor
  const MAX_TUMOR_SIZE = 70; // Visual cap in mm

  // ============================================
  // TREATMENT SYSTEM (Starfall: Extraction Protocol)
  // ============================================

  // Active treatments state (populated dynamically by updateMedicationPanel)

  // Starfall treatment database - sci-fi injury treatments
  const MEDICATION_DATABASE = {
    // Nanobots - best for radiation/crash damage
    nanobots: {
      name: 'Nanobots',
      brandName: 'NB-7 Repair Swarm',
      type: 'NANO',
      shortType: 'NANO',
      formula: 'Fe₃O₄-Si nanoparticles',
      indications: ['crash', 'battle', 'injury'],
      effectiveness: { crash: 1.0, battle: 0.3, injury: 0.5 },
      haltChance: 0.40,
      shrinkChance: 0.30,
      shrinkRate: 0.04,
      metReduction: 0.35,
      color: '#FF4444'  // Red - matches crash injuries
    },
    // Bio-Foam - best for battle/combat wounds
    biofoam: {
      name: 'Bio-Foam',
      brandName: 'BF-12 Trauma Seal',
      type: 'BIO',
      shortType: 'BIO',
      formula: 'C₆H₁₀O₅ polymer gel',
      indications: ['crash', 'battle', 'injury'],
      effectiveness: { crash: 0.3, battle: 1.0, injury: 0.3 },
      haltChance: 0.35,
      shrinkChance: 0.25,
      shrinkRate: 0.035,
      metReduction: 0.25,
      color: '#FFAA33'  // Orange - matches battle injuries
    },
    // Anti-Parasitic - best for parasitic/infection injuries
    antiparasitic: {
      name: 'Anti-Parasitic',
      brandName: 'AP-9 Purifier',
      type: 'ANTI',
      shortType: 'ANTI',
      formula: 'C₂₂H₂₃NO₇ compound',
      indications: ['crash', 'battle', 'injury'],
      effectiveness: { crash: 0.2, battle: 0.2, injury: 1.0 },
      haltChance: 0.45,
      shrinkChance: 0.35,
      shrinkRate: 0.045,
      metReduction: 0.40,
      color: '#44AAFF'  // Blue - matches parasitic injuries
    },
    // Stasis - broad spectrum, halts all growth
    stasis: {
      name: 'Stasis',
      brandName: 'ST-4 Cryo Field',
      type: 'CRYO',
      shortType: 'CRYO',
      formula: 'Quantum entropy lock',
      indications: ['crash', 'battle', 'injury'],
      effectiveness: { crash: 0.7, battle: 0.7, injury: 0.7 },
      haltChance: 0.90,
      shrinkChance: 0.05,
      shrinkRate: 0.01,
      metReduction: 0.60,
      color: '#88DDFF'  // Light cyan - universal
    }
  };

  // Backward compatibility - old medication entries map to new treatments
  const LEGACY_MED_MAP = {
    pembrolizumab: 'nanobots',
    nivolumab: 'biofoam',
    osimertinib: 'antiparasitic',
    bevacizumab: 'stasis'
  };

  // Get all treatments for Starfall (always show all 4)
  function getRelevantMedications() {
    // In Starfall, always return all 4 treatments
    return Object.entries(MEDICATION_DATABASE).map(([id, med]) => ({ id, ...med }));
  }

  // Current active medications (dynamic)
  let activeMedications = {};
  let currentMedicationIds = [];

  // Medication effects lookup (for backward compatibility)
  const MEDICATION_EFFECTS = MEDICATION_DATABASE;

  // Determine tumor response to current medication combo (called once when meds change)
  // Time constant for drug effectiveness ramp-up (months)
  const MED_RAMP_TIME = 1.5; // Full effect reached around 1.5-2 months

  // Get PD-L1 modifier for ICI medications
  // High (≥50%): 1.5x boost, Low (1-49%): 1.0x baseline, Negative (<1%): 0.4x reduction
  function getPDL1Modifier(pdl1Status) {
    switch (pdl1Status) {
      case 'high':     return 1.5;   // 50% boost to ICI effectiveness
      case 'low':      return 1.0;   // No change (baseline)
      case 'negative': return 0.4;   // 60% reduction in ICI effectiveness
      default:         return 1.0;   // Unknown defaults to baseline
    }
  }

  function determineTumorResponse(tumor) {
    const activeCount = Object.values(activeMedications).filter(v => v).length;
    if (activeCount === 0) {
      tumor.userData.medResponse = 'none';
      tumor.userData.medStartMonth = null;
      return;
    }

    let combinedShrinkChance = 0;
    let combinedHaltChance = 0;
    let combinedShrinkRate = 0;
    let iciShrinkChance = 0;
    let iciHaltChance = 0;
    let iciShrinkRate = 0;
    let nonICIShrinkChance = 0;
    let nonICIHaltChance = 0;
    let nonICIShrinkRate = 0;

    // Separate ICI and non-ICI medication contributions
    for (const [medId, isActive] of Object.entries(activeMedications)) {
      if (!isActive) continue;
      const med = MEDICATION_EFFECTS[medId];
      const synergyBonus = 1 + (activeCount - 1) * 0.10;

      if (med.type === 'ICI') {
        // ICI medications - will be modified by PD-L1
        iciShrinkChance += med.shrinkChance * synergyBonus;
        iciHaltChance += med.haltChance * synergyBonus;
        iciShrinkRate += med.shrinkRate;
      } else {
        // Non-ICI medications - unaffected by PD-L1
        nonICIShrinkChance += med.shrinkChance * synergyBonus;
        nonICIHaltChance += med.haltChance * synergyBonus;
        nonICIShrinkRate += med.shrinkRate;
      }
    }

    // Apply PD-L1 modifier to ICI contribution
    const pdl1Modifier = getPDL1Modifier(tumor.userData.pdl1);
    iciShrinkChance *= pdl1Modifier;
    iciHaltChance *= pdl1Modifier;

    // Log PD-L1 impact if ICIs are active
    if (iciShrinkChance > 0 || iciHaltChance > 0) {
      const pdl1Status = tumor.userData.pdl1 || 'unknown';
      console.log(`PD-L1 ${pdl1Status} (${pdl1Modifier}x) applied to ICI response`);
    }

    // Combine ICI and non-ICI contributions
    combinedShrinkChance = iciShrinkChance + nonICIShrinkChance;
    combinedHaltChance = iciHaltChance + nonICIHaltChance;
    combinedShrinkRate = iciShrinkRate + nonICIShrinkRate;

    combinedShrinkChance = Math.min(0.60, combinedShrinkChance);
    combinedHaltChance = Math.min(0.80, combinedHaltChance);

    // Track when treatment started for this tumor
    tumor.userData.medStartMonth = currentMonth;

    // Check for historical response pattern (from prior scan data)
    const priorSize = tumor.userData.priorSize;
    const currentSize = tumor.userData.sizeMM;
    const historyMonths = tumor.userData.historyMonths || 0;
    let historicalResponse = null;
    let historicalShrinkRate = 0;

    if (priorSize && currentSize && historyMonths > 0) {
      // Calculate actual trajectory from historical data (mm per month)
      const sizeChange = priorSize - currentSize; // positive = shrinking
      historicalShrinkRate = sizeChange / historyMonths;

      if (currentSize < priorSize) {
        // Tumor was shrinking between scans - likely responding to treatment
        historicalResponse = 'responding';
        console.log(`Historical data: tumor shrank from ${priorSize}mm to ${currentSize}mm over ${historyMonths} months (${historicalShrinkRate.toFixed(2)} mm/month)`);
      } else if (currentSize > priorSize * 1.2) {
        // Tumor grew significantly - likely resistant
        historicalResponse = 'progressing';
        console.log(`Historical data: tumor grew from ${priorSize}mm to ${currentSize}mm - likely resistant`);
      }
    }

    // Roll to determine response, biased by historical data
    const roll = Math.random();

    if (historicalResponse === 'responding') {
      // Tumor was already responding - 80% chance to continue shrinking, 15% halted, 5% resistant
      if (roll < 0.80) {
        tumor.userData.medResponse = 'shrinking';
        // Use the historical shrink rate to continue the trajectory
        tumor.userData.shrinkRate = historicalShrinkRate > 0 ? historicalShrinkRate : (combinedShrinkRate || 0.15);
        console.log(`Tumor continuing response - SHRINKING at ${tumor.userData.shrinkRate.toFixed(2)} mm/month`);
      } else if (roll < 0.95) {
        tumor.userData.medResponse = 'halted';
        console.log(`Tumor response stabilized - HALTED`);
      } else {
        tumor.userData.medResponse = 'resistant';
        console.log(`Tumor developed RESISTANCE despite prior response`);
      }
    } else if (historicalResponse === 'progressing') {
      // Tumor was growing - 70% chance resistant, 20% halted, 10% shrinking
      if (roll < 0.70) {
        tumor.userData.medResponse = 'resistant';
        console.log(`Tumor continuing progression - RESISTANT`);
      } else if (roll < 0.90) {
        tumor.userData.medResponse = 'halted';
        console.log(`Tumor progression halted - HALTED`);
      } else {
        tumor.userData.medResponse = 'shrinking';
        tumor.userData.shrinkRate = combinedShrinkRate || 0.15;
        console.log(`Tumor now responding - SHRINKING`);
      }
    } else {
      // No historical data - use standard random assignment
      if (roll < combinedShrinkChance) {
        tumor.userData.medResponse = 'shrinking';
        tumor.userData.shrinkRate = combinedShrinkRate;
        console.log(`Tumor responding - SHRINKING (ramping up over ${MED_RAMP_TIME} months)`);
      } else if (roll < combinedShrinkChance + combinedHaltChance) {
        tumor.userData.medResponse = 'halted';
        console.log(`Tumor responding - growth will HALT (ramping up)`);
      } else {
        tumor.userData.medResponse = 'resistant';
        console.log(`Tumor RESISTANT to treatment`);
      }
    }
  }

  // Calculate drug effectiveness based on time on treatment (0 to 1)
  function getMedEffectiveness(tumor) {
    if (!tumor.userData.medStartMonth && tumor.userData.medStartMonth !== 0) return 0;
    const monthsOnTreatment = currentMonth - tumor.userData.medStartMonth;
    if (monthsOnTreatment <= 0) return 0;
    // Exponential ramp-up curve: 1 - e^(-t/tau)
    // At t=tau: ~63% effective, at t=2*tau: ~86%, at t=3*tau: ~95%
    const effectiveness = 1 - Math.exp(-monthsOnTreatment / MED_RAMP_TIME);
    return Math.min(1, effectiveness);
  }

  // Apply medication effects to tumor size (called each tick)
  function applyMedicationEffect(tumor, deltaMonths) {
    const response = tumor.userData.medResponse;
    if (!response || response === 'none' || response === 'resistant') {
      return { shouldGrow: true, shrinkAmount: 0, effectiveness: 0 };
    }

    const effectiveness = getMedEffectiveness(tumor);

    if (response === 'halted') {
      // Partial halt based on effectiveness - still grows but slower
      // At 100% effectiveness, no growth. At 50%, grows at half rate.
      return { shouldGrow: true, growthReduction: effectiveness, shrinkAmount: 0, effectiveness };
    }

    if (response === 'shrinking') {
      // Shrink rate scales with effectiveness
      const shrinkRate = tumor.userData.shrinkRate || 0.03;
      const effectiveShrinkRate = shrinkRate * effectiveness;
      const shrinkAmount = tumor.userData.sizeMM * effectiveShrinkRate * deltaMonths;
      // At low effectiveness, tumor may still grow slightly
      const netGrowth = effectiveness < 0.5;
      return { shouldGrow: netGrowth, shrinkAmount: shrinkAmount, effectiveness };
    }

    return { shouldGrow: true, shrinkAmount: 0, effectiveness: 0 };
  }

  // Get metastasis chance reduction from medications
  function getMedicationMetReduction() {
    let reduction = 0;
    for (const [medId, isActive] of Object.entries(activeMedications)) {
      if (isActive) {
        reduction += MEDICATION_EFFECTS[medId].metReduction;
      }
    }
    return Math.min(0.80, reduction); // Cap at 80% reduction
  }

  // Track when medications were started (for chart markers)
  let medicationStartTimes = {};

  // Get medication color dynamically
  function getMedicationColor(medId) {
    return MEDICATION_DATABASE[medId]?.color || '#6BCB77';
  }

  // Backward compatibility alias
  const MEDICATION_COLORS = new Proxy({}, {
    get: (target, prop) => getMedicationColor(prop)
  });

  // Update medication UI based on patient's injuries
  function updateMedicationPanel() {
    const medPanel = document.getElementById('med-toggles');
    if (!medPanel) return;

    const relevantMeds = getRelevantMedications();

    // Always show all 4 Starfall treatments
    currentMedicationIds = relevantMeds.map(m => m.id);

    // Reset active medications for new set
    const oldActive = { ...activeMedications };
    activeMedications = {};
    medicationStartTimes = {};

    // Build HTML for medication toggles with formula
    medPanel.innerHTML = currentMedicationIds.map(medId => {
      const med = MEDICATION_DATABASE[medId];
      const wasActive = oldActive[medId];
      activeMedications[medId] = wasActive || false;
      if (wasActive) medicationStartTimes[medId] = 0;

      return `
        <div class="med-toggle ${wasActive ? 'active' : ''}" data-med="${medId}" style="--med-color: ${med.color}">
          <span class="med-dot"></span>
          <span class="med-info">
            <span class="med-name">${med.brandName || med.name}</span>
            <span class="med-formula">${med.formula || ''}</span>
          </span>
          <span class="med-type">${med.shortType}</span>
        </div>
      `;
    }).join('');

    // Re-attach event listeners
    attachMedicationListeners();
  }

  // API to toggle a treatment on/off programmatically
  function toggleTreatment(treatmentId, forceOn = null) {
    const toggle = document.querySelector(`.med-toggle[data-med="${treatmentId}"]`);
    if (!toggle) return;

    if (forceOn === null) {
      // Toggle
      activeMedications[treatmentId] = !activeMedications[treatmentId];
    } else {
      activeMedications[treatmentId] = forceOn;
    }

    toggle.classList.toggle('active', activeMedications[treatmentId]);

    if (activeMedications[treatmentId]) {
      medicationStartTimes[treatmentId] = currentMonth;
      // Update tumor responses
      droppedTumors.forEach(tumor => determineTumorResponse(tumor));
    } else {
      delete medicationStartTimes[treatmentId];
    }

    const med = MEDICATION_DATABASE[treatmentId];
    console.log(`${med?.name || treatmentId}: ${activeMedications[treatmentId] ? 'ON' : 'OFF'}`);
  }

  // Expose toggle function globally
  window.toggleTreatment = toggleTreatment;

  // Attach click listeners to medication toggles
  function attachMedicationListeners() {
    const medToggles = document.querySelectorAll('.med-toggle');
    medToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const medId = toggle.dataset.med;
        activeMedications[medId] = !activeMedications[medId];
        toggle.classList.toggle('active', activeMedications[medId]);

        // Track start time for chart marker
        if (activeMedications[medId]) {
          medicationStartTimes[medId] = currentMonth;
        } else {
          medicationStartTimes[medId] = null;
        }

        // Re-determine tumor responses when medications change
        droppedTumors.forEach(tumor => {
          determineTumorResponse(tumor);
        });

        // Nanobot swarm animation
        if (medId === 'nanobots') {
          if (activeMedications[medId]) {
            startNanobotSwarm();
          } else {
            stopNanobotSwarm();
          }
        }

        // Cryo/Stasis field animation
        if (medId === 'stasis') {
          if (activeMedications[medId]) {
            startCryoField();
          } else {
            stopCryoField();
          }
        }

        const med = MEDICATION_DATABASE[medId];
        console.log(`${med?.name || medId}: ${activeMedications[medId] ? 'ON' : 'OFF'} at month ${currentMonth.toFixed(1)}`);
      });
    });
  }

  // Initial attachment (will be re-called when panel updates)
  attachMedicationListeners();

  // Assign random growth profile to each tumor
  function assignGrowthProfile(tumor) {
    if (tumor.userData.growthProfile) return;

    // Random chance of aggressive tumor (10% chance)
    const isAggressive = Math.random() < 0.10;

    // Random chance of slow/stable tumor (20% chance)
    const isStable = !isAggressive && Math.random() < 0.20;

    if (isAggressive) {
      // Aggressive: fast exponential growth
      tumor.userData.growthProfile = {
        type: 'aggressive',
        rate: 0.08 + Math.random() * 0.07, // 8-15% per month
        curve: 'exponential'
      };
    } else if (isStable) {
      // Stable: minimal growth
      tumor.userData.growthProfile = {
        type: 'stable',
        rate: 0.005 + Math.random() * 0.01, // 0.5-1.5% per month
        curve: 'linear'
      };
    } else {
      // Normal: moderate variable growth
      tumor.userData.growthProfile = {
        type: 'normal',
        rate: 0.02 + Math.random() * 0.03, // 2-5% per month
        curve: Math.random() < 0.5 ? 'linear' : 'exponential'
      };
    }
  }

  function calculateGrowth(tumor, monthsActive) {
    const profile = tumor.userData.growthProfile;
    if (!profile) return 1;

    let growthFactor;

    // Handle spiked tumors - explosive growth from spike point
    if (profile.type === 'spiked' && profile.spikeMonth !== undefined) {
      const monthsSinceSpike = Math.max(0, currentMonth - profile.spikeMonth);
      // Use actual size at spike time (stored when spike occurred)
      // Return a factor that when multiplied by initialSizeMM gives sizeAtSpike * postSpikeFactor
      const sizeAtSpike = profile.sizeAtSpike || 25;
      const initialSize = tumor.userData.initialSizeMM || 25;
      const preSpikeFactor = sizeAtSpike / initialSize;
      // Explosive growth after spike
      const postSpikeFactor = Math.pow(1 + profile.rate, monthsSinceSpike);
      growthFactor = preSpikeFactor * postSpikeFactor;
    } else if (profile.curve === 'exponential') {
      // Exponential: compounds over time
      growthFactor = Math.pow(1 + profile.rate, monthsActive);
    } else {
      // Linear: steady addition
      growthFactor = 1 + (profile.rate * monthsActive);
    }

    return growthFactor;
  }

  function updateTimelineUI() {
    if (!timelineProgress || !timelineHandle || !timelineCurrent) return;
    const percent = (currentMonth / maxMonths) * 100;
    timelineProgress.style.width = percent + '%';
    timelineHandle.style.left = percent + '%';
    timelineCurrent.textContent = currentMonth.toFixed(1) + ' mo';
  }

  function createMetastasis() {
    if (!humanBodyMesh || droppedTumors.length === 0) return;

    // Pick a random position anywhere on the body (Starfall - alien lifeforms)
    const randomY = 10 + Math.random() * 85;  // Anywhere from legs to head
    const randomX = (Math.random() - 0.5) * 14; // Side to side
    const randomZ = 2 + Math.random() * 3;      // On the front surface

    // Determine general body area from Y position
    let randomRegion;
    if (randomY > 80) randomRegion = 'Head';
    else if (randomY > 60) randomRegion = 'Upper Torso';
    else if (randomY > 35) randomRegion = 'Lower Torso';
    else if (randomY > 15) randomRegion = 'Upper Limbs';
    else randomRegion = 'Lower Limbs';

    if (Math.abs(randomX) > 3) {
      randomRegion += randomX > 0 ? ' (Left)' : ' (Right)';
    }

    const pos = { x: randomX, y: randomY, z: randomZ };

    // Create small tumor
    const tumorGeo = createLumpySphere(
      CONFIG.tumor.size * 0.5,
      CONFIG.tumor.segments,
      CONFIG.tumor.lumpiness
    );

    // Red pulsing material for metastasis
    const metMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0xcc3333) },
        uPulseColor: { value: new THREE.Color(0xff6666) }
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uPulseColor;
        void main() {
          float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
          vec3 color = mix(uBaseColor, uPulseColor, pulse * 0.5);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthTest: false
    });

    const met = new THREE.Group();
    const mesh = new THREE.Mesh(tumorGeo, metMaterial);
    mesh.renderOrder = 999;
    mesh.onBeforeRender = function(renderer) {
      renderer.clearDepth();
    };
    met.add(mesh);

    // Position and scale
    met.position.set(pos.x, pos.y, pos.z);
    const initialSize = 5 + Math.random() * 10; // 5-15mm initial size
    const targetScale = (initialSize * MM_TO_SCALE) / (CONFIG.tumor.size * 0.5);
    met.scale.setScalar(targetScale * 0.3); // Start very small

    // Store data
    met.userData.region = randomRegion;
    met.userData.sizeMM = initialSize;
    met.userData.isMetastasis = true;
    met.userData.material = metMaterial;
    met.userData.birthMonth = currentMonth;
    met.userData.initialScale = targetScale;

    humanBodyMesh.add(met);
    droppedTumors.push(met);
    metastases.push(met);

    // Initialize tracking for spider plot
    initTumorTracking(met);
    recordTumorData(met);

    // Show NEW MET notification
    showNewMetNotification(met);

    console.log(`New metastasis in ${randomRegion} at month ${currentMonth.toFixed(1)}`);
    return met;
  }

  function updateSimulation(deltaMonths) {
    if (!humanBodyMesh) return;

    // Grow existing tumors and injuries
    droppedTumors.forEach(tumor => {
      // Handle injuries with gradual medication ramp-up (like Journey but gamified)
      if (tumor.userData.isInjury) {
        // Store initial size if not stored
        if (!tumorInitialSizes.has(tumor)) {
          tumorInitialSizes.set(tumor, tumor.scale.x);
        }

        // Initialize medication tracking for this injury
        if (!tumor.userData.medStartTimes) {
          tumor.userData.medStartTimes = {};
        }

        // Get current size
        let currentSizeMM = tumor.userData.sizeMM || tumor.userData.initialSizeMM || 25;

        // Check if in stasis (drag-drop treatment effect) - skip growth if so
        const inStasis = tumor.userData.stasisUntil && Date.now() < tumor.userData.stasisUntil;

        if (!inStasis) {
          const injuryCategory = tumor.userData.injuryCategory || 'injury';
          let growthMultiplier = 1.0;
          let totalShrink = 0;

          // Ramp-up time constants (in simulation months)
          // Matching treatment ramps up faster
          const RAMP_TIME_MATCHED = 0.8;    // ~0.8 months for 63% effect when matched
          const RAMP_TIME_UNMATCHED = 2.0;  // ~2 months for 63% effect when mismatched

          for (const [medId, isActive] of Object.entries(activeMedications)) {
            if (MEDICATION_DATABASE[medId]) {
              const med = MEDICATION_DATABASE[medId];
              const baseEffectiveness = med.effectiveness[injuryCategory] || 0.3;
              const isMatched = baseEffectiveness >= 0.7; // 70%+ = matched treatment

              if (isActive) {
                // Track when this med was activated for this injury
                if (!tumor.userData.medStartTimes[medId]) {
                  tumor.userData.medStartTimes[medId] = currentMonth;
                }

                // Calculate time on treatment
                const monthsOnTreatment = Math.max(0, currentMonth - tumor.userData.medStartTimes[medId]);
                const rampTime = isMatched ? RAMP_TIME_MATCHED : RAMP_TIME_UNMATCHED;

                // Exponential ramp-up: 1 - e^(-t/tau)
                const rampedEffect = 1 - Math.exp(-monthsOnTreatment / rampTime);

                // Final effectiveness = base * ramp
                const effectiveness = baseEffectiveness * rampedEffect;

                // Reduce growth (matched treatments can fully halt, unmatched only slow)
                const maxReduction = isMatched ? 1.0 : 0.6;
                growthMultiplier *= (1 - effectiveness * maxReduction);

                // Matched treatments also slowly shrink when fully ramped
                if (isMatched && rampedEffect > 0.8) {
                  const shrinkRate = 0.02 * effectiveness; // Slow shrink
                  totalShrink += currentSizeMM * shrinkRate * deltaMonths;
                }
              } else {
                // Med turned off - clear start time so it ramps up fresh next time
                tumor.userData.medStartTimes[medId] = null;
              }
            }
          }

          // Apply growth with medication effects
          const growthRate = tumor.userData.growthRate || 1.0;
          const growthPerMonth = growthRate * 1.5 * growthMultiplier;
          currentSizeMM = currentSizeMM + (growthPerMonth * deltaMonths) - totalShrink;

          // Cap at max injury size, min 1mm
          currentSizeMM = Math.max(1, Math.min(70, currentSizeMM));
          tumor.userData.sizeMM = currentSizeMM;
        }

        // Calculate target scale (same formula as tumor)
        const targetScale = (currentSizeMM * MM_TO_SCALE) / CONFIG.tumor.size;

        // Smooth interpolation (10% lerp per frame - like Journey)
        tumor.scale.setScalar(tumor.scale.x + (targetScale - tumor.scale.x) * 0.1);

        // Record data for graph
        recordTumorData(tumor, currentSizeMM);
        return;
      }

      // Store initial size if not stored
      if (!tumorInitialSizes.has(tumor)) {
        tumorInitialSizes.set(tumor, tumor.scale.x);
      }

      // Assign growth profile if not assigned
      assignGrowthProfile(tumor);

      // Small chance of sudden growth spike (2% per month, only for non-aggressive tumors)
      if (!tumor.userData.hasSpiked &&
          tumor.userData.growthProfile.type !== 'aggressive' &&
          Math.random() < 0.02 * deltaMonths) {
        tumor.userData.hasSpiked = true;
        // Store current size at spike time to avoid growth discontinuity
        const sizeAtSpike = tumor.userData.sizeMM || 25;
        tumor.userData.growthProfile = {
          type: 'spiked',
          rate: 0.15 + Math.random() * 0.10, // 15-25% per month - very aggressive
          curve: 'exponential',
          spikeMonth: currentMonth,
          sizeAtSpike: sizeAtSpike
        };
        console.log(`Tumor spiked at month ${currentMonth.toFixed(1)} (size: ${sizeAtSpike.toFixed(1)}mm)!`);
      }

      const initialScale = tumorInitialSizes.get(tumor);
      const monthsActive = tumor.userData.isMetastasis
        ? currentMonth - (tumor.userData.birthMonth || 0)
        : currentMonth;

      // Get current size (track actual size, not just initial)
      const initialSizeMM = tumor.userData.initialSizeMM || tumor.userData.sizeMM || 25;
      if (!tumor.userData.initialSizeMM) tumor.userData.initialSizeMM = initialSizeMM;
      let currentSizeMM = tumor.userData.sizeMM || initialSizeMM;

      // Calculate base growth
      const growthFactor = calculateGrowth(tumor, monthsActive);
      const naturalSize = initialSizeMM * growthFactor;
      const naturalGrowth = naturalSize - currentSizeMM;

      // Apply medication effects
      const medEffect = applyMedicationEffect(tumor, deltaMonths);

      if (medEffect.shrinkAmount > 0) {
        // Tumor is shrinking from medication (net effect: shrink minus reduced growth)
        const reducedGrowth = naturalGrowth * (1 - medEffect.effectiveness);
        currentSizeMM = currentSizeMM + reducedGrowth - medEffect.shrinkAmount;
      } else if (medEffect.growthReduction) {
        // Growth is being slowed/halted (halted response)
        const reducedGrowth = naturalGrowth * (1 - medEffect.growthReduction);
        currentSizeMM = currentSizeMM + reducedGrowth;
      } else if (medEffect.shouldGrow) {
        // Normal growth (no effective medication or resistant)
        currentSizeMM = naturalSize;
      }

      // Cap at 70mm, floor at 1mm
      currentSizeMM = Math.max(1, Math.min(MAX_TUMOR_SIZE, currentSizeMM));
      tumor.userData.sizeMM = currentSizeMM;

      // Calculate target scale from current size
      let targetScale;
      if (tumor.userData.isMetastasis) {
        const metGrowth = Math.min(1, monthsActive / 3);
        targetScale = (currentSizeMM * MM_TO_SCALE) / (CONFIG.tumor.size * 0.5) * metGrowth;
      } else {
        targetScale = (currentSizeMM * MM_TO_SCALE) / CONFIG.tumor.size;
      }

      // Smooth interpolation
      tumor.scale.setScalar(tumor.scale.x + (targetScale - tumor.scale.x) * 0.1);

      // Update dialog if this tumor is selected (4 decimal places when playing)
      if (selectedTumor === tumor && infoMM) {
        infoMM.textContent = tumor.userData.sizeMM.toFixed(4);
      }

      // Record data for spider plot (pass natural size capped at max for projection)
      const cappedNaturalSize = Math.min(MAX_TUMOR_SIZE, naturalSize);
      recordTumorData(tumor, cappedNaturalSize);
    });

    // Update current plot (spider or waterfall)
    drawCurrentPlot();

    // Random chance to spawn metastasis (reduced by medications)
    const metReduction = getMedicationMetReduction();
    const adjustedMetChance = metChancePerMonth * (1 - metReduction);
    if (droppedTumors.length > 0 && Math.random() < adjustedMetChance * deltaMonths) {
      createMetastasis();
    }

    // Update metastasis materials (pulsing)
    if (typeof clock !== 'undefined') {
      const time = clock.getElapsedTime();
      metastases.forEach(met => {
        if (met.userData.material) {
          met.userData.material.uniforms.uTime.value = time;
        }
      });
    }

    // Update tumor burden display
    updateTumorBurden();
  }

  // ============================================
  // TUMOR BURDEN CALCULATION
  // ============================================

  const burdenSldEl = document.getElementById('burden-sld');
  const burdenVolumeEl = document.getElementById('burden-volume');
  const burdenSeverityEl = document.getElementById('burden-severity');

  function updateTumorBurden() {
    if (!burdenSldEl || !burdenVolumeEl || !burdenSeverityEl) return;

    let totalSLD = 0; // Sum of Longest Diameters in mm
    let totalVolume = 0; // Total volume in mm³

    droppedTumors.forEach(tumor => {
      if (tumor.userData.removed) return;
      const sizeMM = tumor.userData.sizeMM || 25;
      totalSLD += sizeMM;
      // Volume of sphere: (4/3) × π × r³
      const radiusMM = sizeMM / 2;
      totalVolume += (4 / 3) * Math.PI * Math.pow(radiusMM, 3);
    });

    // Convert volume to cm³ for display (SLD stays in mm per RECIST)
    const volumeCm3 = totalVolume / 1000; // mm³ to cm³

    // Update display - SLD in mm (standard for RECIST), volume in cm³
    burdenSldEl.textContent = totalSLD.toFixed(0) + ' mm';
    burdenVolumeEl.textContent = volumeCm3.toFixed(1) + ' cm³';

    // Determine severity based on SLD in mm (RECIST-inspired thresholds)
    let severity = 'low';
    let severityText = 'LOW';

    if (totalSLD >= 200) {
      severity = 'critical';
      severityText = 'CRITICAL';
    } else if (totalSLD >= 100) {
      severity = 'high';
      severityText = 'HIGH';
    } else if (totalSLD >= 50) {
      severity = 'moderate';
      severityText = 'MODERATE';
    }

    burdenSeverityEl.className = 'burden-severity ' + severity;
    burdenSeverityEl.textContent = severityText;
  }

  // Initial burden update
  updateTumorBurden();

  // ============================================
  // SPIDER PLOT
  // ============================================

  const spiderPlot = document.getElementById('spider-plot');
  const plotCanvas = document.getElementById('plot-canvas');
  const plotCtx = plotCanvas ? plotCanvas.getContext('2d') : null;
  const plotScaleBtn = document.getElementById('plot-scale-btn');

  // Plot scale state
  let plotScaled = false;
  const PLOT_BASE_WIDTH = 800;
  const PLOT_BASE_HEIGHT = 500;

  // Scale toggle button
  if (plotScaleBtn && plotCanvas) {
    const yAxis = document.querySelector('.y-axis');
    const yLabel = document.querySelector('.y-label');
    const xAxis = document.querySelector('.x-axis');
    const xLabel = document.querySelector('.x-label');

    plotScaleBtn.addEventListener('click', () => {
      plotScaled = !plotScaled;
      plotScaleBtn.classList.toggle('scaled', plotScaled);
      plotScaleBtn.textContent = plotScaled ? '2x' : '1x';

      const scale = plotScaled ? 2 : 1;

      // Resize spider canvas
      plotCanvas.width = PLOT_BASE_WIDTH * scale;
      plotCanvas.height = PLOT_BASE_HEIGHT * scale;
      plotCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
      plotCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

      // Scale spider Y-axis
      if (yAxis) {
        yAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
      }

      // Scale spider X-axis
      if (xAxis) {
        xAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
      }

      // Scale spider X-label
      if (xLabel) {
        xLabel.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
      }

      // Also scale waterfall elements
      const waterfallYAxis = document.querySelector('.waterfall-y');
      const waterfallXAxis = document.querySelector('.waterfall-x');
      const waterfallXLabel = document.querySelector('.waterfall-container .x-label');

      if (waterfallYAxis) {
        waterfallYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
      }
      if (waterfallXAxis) {
        waterfallXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
      }
      if (waterfallXLabel) {
        waterfallXLabel.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
      }

      // Scale all other plot elements
      const plotTypes = ['pfs', 'swimmer', 'sld', 'best-response', 'donut'];
      plotTypes.forEach(type => {
        const yAxis = document.querySelector(`.${type}-y`);
        const xAxis = document.querySelector(`.${type}-x`);
        const xLabel = document.querySelector(`.${type}-container .x-label`);

        if (yAxis) yAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
        if (xAxis) xAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
        if (xLabel) xLabel.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
      });

      // Redraw current plot type
      drawCurrentPlot();
    });
  }

  // ============================================
  // PLOT TYPE TOGGLE (Spider / Waterfall)
  // ============================================

  const waterfallCanvas = document.getElementById('waterfall-canvas');
  const waterfallCtx = waterfallCanvas ? waterfallCanvas.getContext('2d') : null;
  const pfsCanvas = document.getElementById('pfs-canvas');
  const pfsCtx = pfsCanvas ? pfsCanvas.getContext('2d') : null;
  const swimmerCanvas = document.getElementById('swimmer-canvas');
  const swimmerCtx = swimmerCanvas ? swimmerCanvas.getContext('2d') : null;
  const sldCanvas = document.getElementById('sld-canvas');
  const sldCtx = sldCanvas ? sldCanvas.getContext('2d') : null;
  const bestResponseCanvas = document.getElementById('best-response-canvas');
  const bestResponseCtx = bestResponseCanvas ? bestResponseCanvas.getContext('2d') : null;
  const donutCanvas = document.getElementById('donut-canvas');
  const donutCtx = donutCanvas ? donutCanvas.getContext('2d') : null;
  const dorCanvas = document.getElementById('dor-canvas');
  const dorCtx = dorCanvas ? dorCanvas.getContext('2d') : null;
  const heatmapCanvas = document.getElementById('heatmap-canvas');
  const heatmapCtx = heatmapCanvas ? heatmapCanvas.getContext('2d') : null;
  const growthRateCanvas = document.getElementById('growth-rate-canvas');
  const growthRateCtx = growthRateCanvas ? growthRateCanvas.getContext('2d') : null;
  const targetCanvas = document.getElementById('target-canvas');
  const targetCtx = targetCanvas ? targetCanvas.getContext('2d') : null;

  const spiderContainer = document.querySelector('.plot-container:not(.waterfall-container):not(.pfs-container):not(.swimmer-container):not(.sld-container):not(.best-response-container):not(.donut-container):not(.dor-container):not(.heatmap-container):not(.growth-rate-container):not(.target-container)');
  const waterfallContainer = document.querySelector('.waterfall-container');
  const pfsContainer = document.querySelector('.pfs-container');
  const swimmerContainer = document.querySelector('.swimmer-container');
  const sldContainer = document.querySelector('.sld-container');
  const bestResponseContainer = document.querySelector('.best-response-container');
  const donutContainer = document.querySelector('.donut-container');
  const dorContainer = document.querySelector('.dor-container');
  const heatmapContainer = document.querySelector('.heatmap-container');
  const growthRateContainer = document.querySelector('.growth-rate-container');
  const targetContainer = document.querySelector('.target-container');
  const plotTypeSelect = document.getElementById('plot-type-select');
  const waterfallXAxis = document.getElementById('waterfall-x-axis');

  let currentPlotType = 'spider';

  // All plot containers for easy iteration
  const allPlotContainers = [
    spiderContainer, waterfallContainer, pfsContainer, swimmerContainer,
    sldContainer, bestResponseContainer, donutContainer, dorContainer,
    heatmapContainer, growthRateContainer, targetContainer
  ];

  // Dropdown to switch between plot types
  if (plotTypeSelect) {
    plotTypeSelect.addEventListener('change', (e) => {
      currentPlotType = e.target.value;

      // Hide all containers
      allPlotContainers.forEach(c => { if (c) c.style.display = 'none'; });

      // Show selected container and draw
      switch (currentPlotType) {
        case 'spider':
          if (spiderContainer) spiderContainer.style.display = 'flex';
          drawSpiderPlot();
          break;
        case 'waterfall':
          if (waterfallContainer) waterfallContainer.style.display = 'flex';
          drawWaterfallPlot();
          break;
        case 'pfs':
          if (pfsContainer) pfsContainer.style.display = 'flex';
          drawPFSPlot();
          break;
        case 'swimmer':
          if (swimmerContainer) swimmerContainer.style.display = 'flex';
          drawSwimmerPlot();
          break;
        case 'sld':
          if (sldContainer) sldContainer.style.display = 'flex';
          drawSLDPlot();
          break;
        case 'bestResponse':
          if (bestResponseContainer) bestResponseContainer.style.display = 'flex';
          drawBestResponsePlot();
          break;
        case 'responseDonut':
          if (donutContainer) donutContainer.style.display = 'flex';
          drawResponseDonut();
          break;
        case 'dor':
          if (dorContainer) dorContainer.style.display = 'flex';
          drawDORPlot();
          break;
        case 'heatmap':
          if (heatmapContainer) heatmapContainer.style.display = 'flex';
          drawHeatmapPlot();
          break;
        case 'growthRate':
          if (growthRateContainer) growthRateContainer.style.display = 'flex';
          drawGrowthRatePlot();
          break;
        case 'targetNonTarget':
          if (targetContainer) targetContainer.style.display = 'flex';
          drawTargetNonTargetPlot();
          break;
      }
    });
  }

  // Draw waterfall plot
  function drawWaterfallPlot() {
    if (!waterfallCtx || !waterfallCanvas) return;

    const scale = plotScaled ? 2 : 1;
    waterfallCanvas.width = PLOT_BASE_WIDTH * scale;
    waterfallCanvas.height = PLOT_BASE_HEIGHT * scale;
    waterfallCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    waterfallCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    // Update waterfall y-axis height
    const waterfallYAxis = document.querySelector('.waterfall-y');
    if (waterfallYAxis) {
      waterfallYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    }

    // Clear canvas
    waterfallCtx.clearRect(0, 0, waterfallCanvas.width, waterfallCanvas.height);

    // Gather tumor data
    const tumors = [];
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 1) return;

      // Find baseline (first point or initial size)
      const baselinePoint = data.points.find(p => p.month <= 0) || data.points[0];
      const baseline = baselinePoint.size;

      // Find current size (latest point)
      const currentPoint = data.points[data.points.length - 1];
      const current = currentPoint.size;

      // Calculate percent change
      const percentChange = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

      // Find associated tumor for region info
      const tumor = droppedTumors.find(t => t.userData.plotId === tumorId);
      const region = tumor?.userData?.region || `Tumor ${tumorId + 1}`;

      tumors.push({
        id: tumorId,
        region: region,
        baseline: baseline,
        current: current,
        percentChange: percentChange,
        removed: data.removed
      });
    });

    // Sort by percent change (most shrinkage first, most growth last)
    tumors.sort((a, b) => a.percentChange - b.percentChange);

    // Update X-axis labels
    if (waterfallXAxis) {
      waterfallXAxis.innerHTML = tumors.map(t =>
        `<span title="${t.region}: ${t.percentChange.toFixed(1)}%">${t.region}</span>`
      ).join('');
      waterfallXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    }

    // Plot dimensions
    const padding = { left: 10, right: 10, top: 30, bottom: 30 };
    const plotWidth = waterfallCanvas.width - padding.left - padding.right;
    const plotHeight = waterfallCanvas.height - padding.top - padding.bottom;

    // Y-axis range: -100% to +100%
    const yMin = -100;
    const yMax = 100;
    const yRange = yMax - yMin;

    // Helper to convert percent to Y coordinate
    const percentToY = (pct) => {
      const clamped = Math.max(yMin, Math.min(yMax, pct));
      return padding.top + (1 - (clamped - yMin) / yRange) * plotHeight;
    };

    // Draw zero line
    const zeroY = percentToY(0);
    waterfallCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    waterfallCtx.lineWidth = 1;
    waterfallCtx.setLineDash([5, 5]);
    waterfallCtx.beginPath();
    waterfallCtx.moveTo(padding.left, zeroY);
    waterfallCtx.lineTo(waterfallCanvas.width - padding.right, zeroY);
    waterfallCtx.stroke();
    waterfallCtx.setLineDash([]);

    // Draw RECIST thresholds
    // Progressive Disease: +20%
    const pdY = percentToY(20);
    waterfallCtx.strokeStyle = 'rgba(203, 107, 107, 0.4)';
    waterfallCtx.setLineDash([3, 3]);
    waterfallCtx.beginPath();
    waterfallCtx.moveTo(padding.left, pdY);
    waterfallCtx.lineTo(waterfallCanvas.width - padding.right, pdY);
    waterfallCtx.stroke();

    // Partial Response: -30%
    const prY = percentToY(-30);
    waterfallCtx.strokeStyle = 'rgba(107, 203, 119, 0.4)';
    waterfallCtx.beginPath();
    waterfallCtx.moveTo(padding.left, prY);
    waterfallCtx.lineTo(waterfallCanvas.width - padding.right, prY);
    waterfallCtx.stroke();
    waterfallCtx.setLineDash([]);

    // Draw threshold labels
    waterfallCtx.font = `${10 * scale}px system-ui`;
    waterfallCtx.fillStyle = 'rgba(203, 107, 107, 0.6)';
    waterfallCtx.textAlign = 'right';
    waterfallCtx.fillText('PD +20%', waterfallCanvas.width - padding.right - 5, pdY - 3);
    waterfallCtx.fillStyle = 'rgba(107, 203, 119, 0.6)';
    waterfallCtx.fillText('PR -30%', waterfallCanvas.width - padding.right - 5, prY + 12);

    if (tumors.length === 0) {
      // No data message
      waterfallCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      waterfallCtx.font = `${14 * scale}px system-ui`;
      waterfallCtx.textAlign = 'center';
      waterfallCtx.fillText('No tumor data - start simulation', waterfallCanvas.width / 2, waterfallCanvas.height / 2);
      return;
    }

    // Draw bars
    const barWidth = Math.min(60 * scale, (plotWidth / tumors.length) * 0.7);
    const barGap = (plotWidth - barWidth * tumors.length) / (tumors.length + 1);

    tumors.forEach((tumor, i) => {
      const x = padding.left + barGap + i * (barWidth + barGap);
      const barHeight = Math.abs(tumor.percentChange / yRange) * plotHeight;

      // Determine color based on change
      let color;
      if (tumor.removed) {
        color = 'rgba(100, 100, 110, 0.6)'; // Gray for removed
      } else if (tumor.percentChange <= -30) {
        color = 'rgba(107, 203, 119, 0.8)'; // Green - Partial Response
      } else if (tumor.percentChange >= 20) {
        color = 'rgba(203, 107, 107, 0.8)'; // Red - Progressive Disease
      } else if (tumor.percentChange < 0) {
        color = 'rgba(107, 180, 203, 0.8)'; // Cyan - Stable/shrinking
      } else {
        color = 'rgba(203, 180, 107, 0.8)'; // Yellow - Stable/growing
      }

      // Draw bar
      waterfallCtx.fillStyle = color;
      if (tumor.percentChange >= 0) {
        // Growth - bar goes up from zero line
        waterfallCtx.fillRect(x, zeroY - barHeight, barWidth, barHeight);
      } else {
        // Shrinkage - bar goes down from zero line
        waterfallCtx.fillRect(x, zeroY, barWidth, barHeight);
      }

      // Draw bar border
      waterfallCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      waterfallCtx.lineWidth = 1;
      if (tumor.percentChange >= 0) {
        waterfallCtx.strokeRect(x, zeroY - barHeight, barWidth, barHeight);
      } else {
        waterfallCtx.strokeRect(x, zeroY, barWidth, barHeight);
      }

      // Draw percent label on bar
      waterfallCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      waterfallCtx.font = `bold ${11 * scale}px system-ui`;
      waterfallCtx.textAlign = 'center';
      const labelY = tumor.percentChange >= 0
        ? zeroY - barHeight - 5
        : zeroY + barHeight + 12 * scale;
      waterfallCtx.fillText(
        `${tumor.percentChange >= 0 ? '+' : ''}${tumor.percentChange.toFixed(0)}%`,
        x + barWidth / 2,
        labelY
      );
    });

    // Draw title
    waterfallCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    waterfallCtx.font = `bold ${12 * scale}px system-ui`;
    waterfallCtx.textAlign = 'left';
    waterfallCtx.fillText(`Month ${currentMonth.toFixed(1)} - Best % Change from Baseline`, padding.left, 18 * scale);
  }

  // Draw Progression-Free Survival (Kaplan-Meier style) plot
  function drawPFSPlot() {
    if (!pfsCtx || !pfsCanvas) return;

    const scale = plotScaled ? 2 : 1;
    pfsCanvas.width = PLOT_BASE_WIDTH * scale;
    pfsCanvas.height = PLOT_BASE_HEIGHT * scale;
    pfsCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    pfsCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    // Update PFS y-axis height
    const pfsYAxis = document.querySelector('.pfs-y');
    const pfsXAxis = document.querySelector('.pfs-x');
    if (pfsYAxis) pfsYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    if (pfsXAxis) pfsXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';

    // Clear canvas
    pfsCtx.clearRect(0, 0, pfsCanvas.width, pfsCanvas.height);

    // Plot dimensions
    const padding = { left: 10, right: 20, top: 30, bottom: 20 };
    const plotWidth = pfsCanvas.width - padding.left - padding.right;
    const plotHeight = pfsCanvas.height - padding.top - padding.bottom;

    // Progression threshold (RECIST: +20% is progressive disease)
    const PROGRESSION_THRESHOLD = 20; // percent

    // Gather progression events from tumor data
    const progressionEvents = []; // { month, tumorId }
    let totalTumors = 0;

    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 1) return;
      if (data.removed) return; // Don't count surgically removed tumors

      totalTumors++;

      // Find baseline
      const baselinePoint = data.points.find(p => p.month <= 0) || data.points[0];
      const baseline = baselinePoint.size;

      // Find first time tumor exceeds progression threshold
      let hasProgressed = false;
      for (const point of data.points) {
        if (point.month <= 0) continue; // Skip baseline/history
        const percentChange = baseline > 0 ? ((point.size - baseline) / baseline) * 100 : 0;
        if (percentChange >= PROGRESSION_THRESHOLD && !hasProgressed) {
          progressionEvents.push({ month: point.month, tumorId });
          hasProgressed = true;
          break;
        }
      }
    });

    // Sort events by month
    progressionEvents.sort((a, b) => a.month - b.month);

    // Helper functions
    const monthToX = (month) => padding.left + (month / maxMonths) * plotWidth;
    const pctToY = (pct) => padding.top + (1 - pct / 100) * plotHeight;

    // Draw grid lines
    pfsCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    pfsCtx.lineWidth = 1;
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = pctToY(pct);
      pfsCtx.beginPath();
      pfsCtx.moveTo(padding.left, y);
      pfsCtx.lineTo(pfsCanvas.width - padding.right, y);
      pfsCtx.stroke();
    }
    for (let month = 0; month <= maxMonths; month += 3) {
      const x = monthToX(month);
      pfsCtx.beginPath();
      pfsCtx.moveTo(x, padding.top);
      pfsCtx.lineTo(x, pfsCanvas.height - padding.bottom);
      pfsCtx.stroke();
    }

    // Draw 50% reference line (median)
    pfsCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    pfsCtx.setLineDash([5, 5]);
    pfsCtx.beginPath();
    pfsCtx.moveTo(padding.left, pctToY(50));
    pfsCtx.lineTo(pfsCanvas.width - padding.right, pctToY(50));
    pfsCtx.stroke();
    pfsCtx.setLineDash([]);

    if (totalTumors === 0) {
      // No data message
      pfsCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      pfsCtx.font = `${14 * scale}px system-ui`;
      pfsCtx.textAlign = 'center';
      pfsCtx.fillText('No tumor data - start simulation', pfsCanvas.width / 2, pfsCanvas.height / 2);
      return;
    }

    // Build Kaplan-Meier curve points
    const kmPoints = [{ month: 0, survival: 100 }];
    let atRisk = totalTumors;

    progressionEvents.forEach(event => {
      // Step down at each progression event
      const survivalBefore = (atRisk / totalTumors) * 100;
      atRisk--;
      const survivalAfter = (atRisk / totalTumors) * 100;

      // Add horizontal line to this month, then step down
      kmPoints.push({ month: event.month, survival: survivalBefore, step: true });
      kmPoints.push({ month: event.month, survival: survivalAfter });
    });

    // Extend to current month if still have survivors
    if (atRisk > 0) {
      const finalSurvival = (atRisk / totalTumors) * 100;
      kmPoints.push({ month: currentMonth, survival: finalSurvival });
    }

    // Draw the Kaplan-Meier curve
    pfsCtx.strokeStyle = '#6BC8CB';
    pfsCtx.lineWidth = 3 * scale;
    pfsCtx.lineCap = 'square';
    pfsCtx.beginPath();

    let lastX = monthToX(0);
    let lastY = pctToY(100);
    pfsCtx.moveTo(lastX, lastY);

    for (let i = 1; i < kmPoints.length; i++) {
      const point = kmPoints[i];
      const x = monthToX(point.month);
      const y = pctToY(point.survival);

      if (point.step) {
        // Horizontal line to this point (before step down)
        pfsCtx.lineTo(x, lastY);
      } else {
        // Vertical step down, then continue
        if (kmPoints[i - 1]?.step) {
          pfsCtx.lineTo(x, y);
        } else {
          pfsCtx.lineTo(x, lastY);
          pfsCtx.lineTo(x, y);
        }
      }

      lastX = x;
      lastY = y;
    }

    pfsCtx.stroke();

    // Draw confidence band (simplified - just a shaded area)
    if (totalTumors >= 2) {
      pfsCtx.fillStyle = 'rgba(107, 200, 203, 0.15)';
      pfsCtx.beginPath();
      pfsCtx.moveTo(monthToX(0), pctToY(100));

      // Upper bound (simplified)
      for (let i = 1; i < kmPoints.length; i++) {
        const point = kmPoints[i];
        const x = monthToX(point.month);
        const upperY = pctToY(Math.min(100, point.survival + 15));
        if (point.step) {
          pfsCtx.lineTo(x, pctToY(Math.min(100, kmPoints[i - 1].survival + 15)));
        }
        pfsCtx.lineTo(x, upperY);
      }

      // Lower bound (reverse)
      for (let i = kmPoints.length - 1; i >= 1; i--) {
        const point = kmPoints[i];
        const x = monthToX(point.month);
        const lowerY = pctToY(Math.max(0, point.survival - 15));
        pfsCtx.lineTo(x, lowerY);
        if (point.step && i > 1) {
          pfsCtx.lineTo(x, pctToY(Math.max(0, kmPoints[i - 1].survival - 15)));
        }
      }

      pfsCtx.lineTo(monthToX(0), pctToY(100));
      pfsCtx.fill();
    }

    // Draw event markers (tick marks for progression events)
    pfsCtx.strokeStyle = '#6BC8CB';
    pfsCtx.lineWidth = 2 * scale;
    progressionEvents.forEach(event => {
      const x = monthToX(event.month);
      // Find survival at this point
      const survivalAtEvent = kmPoints.find(p => p.month === event.month && !p.step)?.survival || 0;
      const y = pctToY(survivalAtEvent);

      // Draw small vertical tick
      pfsCtx.beginPath();
      pfsCtx.moveTo(x, y - 5 * scale);
      pfsCtx.lineTo(x, y + 5 * scale);
      pfsCtx.stroke();
    });

    // Draw current survival percentage
    const currentSurvival = atRisk > 0 ? (atRisk / totalTumors) * 100 : 0;
    pfsCtx.fillStyle = '#6BC8CB';
    pfsCtx.font = `bold ${16 * scale}px system-ui`;
    pfsCtx.textAlign = 'right';
    pfsCtx.fillText(
      `${currentSurvival.toFixed(0)}% PFS`,
      pfsCanvas.width - padding.right - 10,
      padding.top + 25 * scale
    );

    // Draw statistics
    pfsCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    pfsCtx.font = `${11 * scale}px system-ui`;
    pfsCtx.textAlign = 'right';
    pfsCtx.fillText(
      `${atRisk}/${totalTumors} tumors progression-free`,
      pfsCanvas.width - padding.right - 10,
      padding.top + 45 * scale
    );
    pfsCtx.fillText(
      `${progressionEvents.length} progression event${progressionEvents.length !== 1 ? 's' : ''}`,
      pfsCanvas.width - padding.right - 10,
      padding.top + 60 * scale
    );

    // Find and display median PFS if crossed 50%
    const medianEvent = kmPoints.find(p => p.survival <= 50 && !p.step);
    if (medianEvent) {
      pfsCtx.fillStyle = 'rgba(255, 200, 100, 0.8)';
      pfsCtx.fillText(
        `Median PFS: ${medianEvent.month.toFixed(1)} mo`,
        pfsCanvas.width - padding.right - 10,
        padding.top + 80 * scale
      );

      // Draw median line
      pfsCtx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
      pfsCtx.setLineDash([3, 3]);
      pfsCtx.beginPath();
      pfsCtx.moveTo(monthToX(medianEvent.month), pctToY(50));
      pfsCtx.lineTo(monthToX(medianEvent.month), pfsCanvas.height - padding.bottom);
      pfsCtx.stroke();
      pfsCtx.setLineDash([]);
    }

    // Draw title
    pfsCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    pfsCtx.font = `bold ${12 * scale}px system-ui`;
    pfsCtx.textAlign = 'left';
    pfsCtx.fillText('Progression-Free Survival (RECIST: PD ≥+20%)', padding.left, 18 * scale);
  }

  // Draw Swimmer Plot - horizontal bars for each tumor with event markers
  function drawSwimmerPlot() {
    if (!swimmerCtx || !swimmerCanvas) return;

    const scale = plotScaled ? 2 : 1;
    swimmerCanvas.width = PLOT_BASE_WIDTH * scale;
    swimmerCanvas.height = PLOT_BASE_HEIGHT * scale;
    swimmerCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    swimmerCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    // Update axes
    const swimmerYAxis = document.getElementById('swimmer-y-axis');
    const swimmerXAxis = document.querySelector('.swimmer-x');
    if (swimmerYAxis) swimmerYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    if (swimmerXAxis) swimmerXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';

    swimmerCtx.clearRect(0, 0, swimmerCanvas.width, swimmerCanvas.height);

    const padding = { left: 10, right: 20, top: 30, bottom: 20 };
    const plotWidth = swimmerCanvas.width - padding.left - padding.right;
    const plotHeight = swimmerCanvas.height - padding.top - padding.bottom;

    // Gather tumor data
    const tumors = [];
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 1) return;
      const tumor = droppedTumors.find(t => t.userData.plotId === tumorId);
      const region = tumor?.userData?.region || `Tumor ${tumorId + 1}`;
      const baseline = data.points.find(p => p.month <= 0)?.size || data.points[0].size;

      // Track events
      let bestResponse = 0;
      let progressedAt = null;
      let respondedAt = null;

      data.points.forEach(p => {
        if (p.month <= 0) return;
        const pctChange = baseline > 0 ? ((p.size - baseline) / baseline) * 100 : 0;
        if (pctChange < bestResponse) {
          bestResponse = pctChange;
          if (pctChange <= -30 && !respondedAt) respondedAt = p.month;
        }
        if (pctChange >= 20 && !progressedAt) progressedAt = p.month;
      });

      tumors.push({
        id: tumorId,
        region,
        removed: data.removed,
        removedAt: data.removedAtMonth,
        progressedAt,
        respondedAt,
        bestResponse,
        lastMonth: data.points[data.points.length - 1].month
      });
    });

    // Update Y-axis labels
    if (swimmerYAxis) {
      swimmerYAxis.innerHTML = tumors.map(t =>
        `<span title="${t.region}">${t.region}</span>`
      ).join('');
    }

    if (tumors.length === 0) {
      swimmerCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      swimmerCtx.font = `${14 * scale}px system-ui`;
      swimmerCtx.textAlign = 'center';
      swimmerCtx.fillText('No tumor data - start simulation', swimmerCanvas.width / 2, swimmerCanvas.height / 2);
      return;
    }

    const monthToX = (month) => padding.left + (month / maxMonths) * plotWidth;
    const barHeight = Math.min(30 * scale, (plotHeight / tumors.length) * 0.7);
    const barGap = (plotHeight - barHeight * tumors.length) / (tumors.length + 1);

    // Draw grid lines
    swimmerCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    swimmerCtx.lineWidth = 1;
    for (let month = 0; month <= maxMonths; month += 3) {
      const x = monthToX(month);
      swimmerCtx.beginPath();
      swimmerCtx.moveTo(x, padding.top);
      swimmerCtx.lineTo(x, swimmerCanvas.height - padding.bottom);
      swimmerCtx.stroke();
    }

    // Draw current time line
    swimmerCtx.strokeStyle = 'rgba(107, 200, 203, 0.5)';
    swimmerCtx.lineWidth = 2;
    swimmerCtx.setLineDash([5, 5]);
    swimmerCtx.beginPath();
    swimmerCtx.moveTo(monthToX(currentMonth), padding.top);
    swimmerCtx.lineTo(monthToX(currentMonth), swimmerCanvas.height - padding.bottom);
    swimmerCtx.stroke();
    swimmerCtx.setLineDash([]);

    // Draw bars for each tumor
    tumors.forEach((tumor, i) => {
      const y = padding.top + barGap + i * (barHeight + barGap);
      const endMonth = tumor.removed ? tumor.removedAt : tumor.lastMonth;
      const barWidth = monthToX(endMonth) - padding.left;

      // Determine bar color based on best response
      let barColor;
      if (tumor.removed) {
        barColor = 'rgba(100, 100, 110, 0.6)';
      } else if (tumor.bestResponse <= -30) {
        barColor = 'rgba(107, 203, 119, 0.7)'; // PR - green
      } else if (tumor.progressedAt !== null) {
        barColor = 'rgba(203, 107, 107, 0.7)'; // PD - red
      } else {
        barColor = 'rgba(107, 180, 203, 0.7)'; // SD - cyan
      }

      // Draw bar
      swimmerCtx.fillStyle = barColor;
      swimmerCtx.fillRect(padding.left, y, barWidth, barHeight);
      swimmerCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      swimmerCtx.lineWidth = 1;
      swimmerCtx.strokeRect(padding.left, y, barWidth, barHeight);

      // Draw event markers
      const markerY = y + barHeight / 2;

      // Response marker (triangle down - green)
      if (tumor.respondedAt !== null) {
        const mx = monthToX(tumor.respondedAt);
        swimmerCtx.fillStyle = '#6BCB77';
        swimmerCtx.beginPath();
        swimmerCtx.moveTo(mx, markerY - 8 * scale);
        swimmerCtx.lineTo(mx - 6 * scale, markerY + 4 * scale);
        swimmerCtx.lineTo(mx + 6 * scale, markerY + 4 * scale);
        swimmerCtx.closePath();
        swimmerCtx.fill();
      }

      // Progression marker (triangle up - red)
      if (tumor.progressedAt !== null) {
        const mx = monthToX(tumor.progressedAt);
        swimmerCtx.fillStyle = '#CB6B6B';
        swimmerCtx.beginPath();
        swimmerCtx.moveTo(mx, markerY + 8 * scale);
        swimmerCtx.lineTo(mx - 6 * scale, markerY - 4 * scale);
        swimmerCtx.lineTo(mx + 6 * scale, markerY - 4 * scale);
        swimmerCtx.closePath();
        swimmerCtx.fill();
      }

      // Surgical removal marker (X)
      if (tumor.removed && tumor.removedAt !== null) {
        const mx = monthToX(tumor.removedAt);
        swimmerCtx.strokeStyle = '#ffffff';
        swimmerCtx.lineWidth = 2 * scale;
        swimmerCtx.beginPath();
        swimmerCtx.moveTo(mx - 5 * scale, markerY - 5 * scale);
        swimmerCtx.lineTo(mx + 5 * scale, markerY + 5 * scale);
        swimmerCtx.moveTo(mx + 5 * scale, markerY - 5 * scale);
        swimmerCtx.lineTo(mx - 5 * scale, markerY + 5 * scale);
        swimmerCtx.stroke();
      }
    });

    // Draw legend
    const legendY = padding.top + 5;
    swimmerCtx.font = `${10 * scale}px system-ui`;

    swimmerCtx.fillStyle = '#6BCB77';
    swimmerCtx.beginPath();
    swimmerCtx.moveTo(swimmerCanvas.width - 200 * scale, legendY);
    swimmerCtx.lineTo(swimmerCanvas.width - 206 * scale, legendY + 8 * scale);
    swimmerCtx.lineTo(swimmerCanvas.width - 194 * scale, legendY + 8 * scale);
    swimmerCtx.fill();
    swimmerCtx.fillStyle = 'rgba(255,255,255,0.7)';
    swimmerCtx.fillText('PR', swimmerCanvas.width - 188 * scale, legendY + 8 * scale);

    swimmerCtx.fillStyle = '#CB6B6B';
    swimmerCtx.beginPath();
    swimmerCtx.moveTo(swimmerCanvas.width - 140 * scale, legendY + 8 * scale);
    swimmerCtx.lineTo(swimmerCanvas.width - 146 * scale, legendY);
    swimmerCtx.lineTo(swimmerCanvas.width - 134 * scale, legendY);
    swimmerCtx.fill();
    swimmerCtx.fillStyle = 'rgba(255,255,255,0.7)';
    swimmerCtx.fillText('PD', swimmerCanvas.width - 128 * scale, legendY + 8 * scale);

    swimmerCtx.strokeStyle = '#ffffff';
    swimmerCtx.lineWidth = 2 * scale;
    swimmerCtx.beginPath();
    swimmerCtx.moveTo(swimmerCanvas.width - 80 * scale, legendY);
    swimmerCtx.lineTo(swimmerCanvas.width - 70 * scale, legendY + 10 * scale);
    swimmerCtx.moveTo(swimmerCanvas.width - 70 * scale, legendY);
    swimmerCtx.lineTo(swimmerCanvas.width - 80 * scale, legendY + 10 * scale);
    swimmerCtx.stroke();
    swimmerCtx.fillStyle = 'rgba(255,255,255,0.7)';
    swimmerCtx.fillText('Surgery', swimmerCanvas.width - 65 * scale, legendY + 8 * scale);

    // Title
    swimmerCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    swimmerCtx.font = `bold ${12 * scale}px system-ui`;
    swimmerCtx.textAlign = 'left';
    swimmerCtx.fillText('Swimmer Plot - Treatment Timeline', padding.left, 18 * scale);
  }

  // Draw SLD (Sum of Longest Diameters) Over Time
  function drawSLDPlot() {
    if (!sldCtx || !sldCanvas) return;

    const scale = plotScaled ? 2 : 1;
    sldCanvas.width = PLOT_BASE_WIDTH * scale;
    sldCanvas.height = PLOT_BASE_HEIGHT * scale;
    sldCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    sldCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    const sldYAxis = document.getElementById('sld-y-axis');
    const sldXAxis = document.querySelector('.sld-x');
    if (sldYAxis) sldYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    if (sldXAxis) sldXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';

    sldCtx.clearRect(0, 0, sldCanvas.width, sldCanvas.height);

    const padding = { left: 10, right: 20, top: 30, bottom: 20 };
    const plotWidth = sldCanvas.width - padding.left - padding.right;
    const plotHeight = sldCanvas.height - padding.top - padding.bottom;

    // Calculate SLD at each time point
    const sldData = [];
    let maxSLD = 0;
    let baselineSLD = 0;

    // Get all unique months from all tumors
    const allMonths = new Set();
    tumorGrowthData.forEach(data => {
      data.points.forEach(p => allMonths.add(p.month));
    });
    const sortedMonths = [...allMonths].sort((a, b) => a - b);

    sortedMonths.forEach(month => {
      let sld = 0;
      tumorGrowthData.forEach((data, tumorId) => {
        if (data.removed && data.removedAtMonth <= month) return;
        // Find size at this month or interpolate
        const point = data.points.find(p => p.month === month);
        if (point) {
          sld += point.size;
        } else {
          // Find closest earlier point
          const earlier = data.points.filter(p => p.month <= month).pop();
          if (earlier) sld += earlier.size;
        }
      });
      sldData.push({ month, sld });
      if (sld > maxSLD) maxSLD = sld;
      if (month === 0) baselineSLD = sld;
    });

    // Update Y-axis
    if (sldYAxis) {
      const maxY = Math.ceil(maxSLD / 50) * 50 || 100;
      sldYAxis.innerHTML = [maxY, maxY * 0.75, maxY * 0.5, maxY * 0.25, 0]
        .map(v => `<span>${v.toFixed(0)}</span>`).join('');
    }

    if (sldData.length === 0) {
      sldCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      sldCtx.font = `${14 * scale}px system-ui`;
      sldCtx.textAlign = 'center';
      sldCtx.fillText('No tumor data - start simulation', sldCanvas.width / 2, sldCanvas.height / 2);
      return;
    }

    const maxY = Math.ceil(maxSLD / 50) * 50 || 100;
    const monthToX = (month) => padding.left + (month / maxMonths) * plotWidth;
    const sldToY = (sld) => padding.top + (1 - sld / maxY) * plotHeight;

    // Draw grid
    sldCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    sldCtx.lineWidth = 1;
    for (let y = 0; y <= maxY; y += maxY / 4) {
      sldCtx.beginPath();
      sldCtx.moveTo(padding.left, sldToY(y));
      sldCtx.lineTo(sldCanvas.width - padding.right, sldToY(y));
      sldCtx.stroke();
    }
    for (let month = 0; month <= maxMonths; month += 3) {
      sldCtx.beginPath();
      sldCtx.moveTo(monthToX(month), padding.top);
      sldCtx.lineTo(monthToX(month), sldCanvas.height - padding.bottom);
      sldCtx.stroke();
    }

    // Draw RECIST thresholds relative to baseline
    if (baselineSLD > 0) {
      // PR threshold (-30%)
      const prThreshold = baselineSLD * 0.7;
      sldCtx.strokeStyle = 'rgba(107, 203, 119, 0.4)';
      sldCtx.setLineDash([3, 3]);
      sldCtx.beginPath();
      sldCtx.moveTo(padding.left, sldToY(prThreshold));
      sldCtx.lineTo(sldCanvas.width - padding.right, sldToY(prThreshold));
      sldCtx.stroke();

      // PD threshold (+20%)
      const pdThreshold = baselineSLD * 1.2;
      if (pdThreshold <= maxY) {
        sldCtx.strokeStyle = 'rgba(203, 107, 107, 0.4)';
        sldCtx.beginPath();
        sldCtx.moveTo(padding.left, sldToY(pdThreshold));
        sldCtx.lineTo(sldCanvas.width - padding.right, sldToY(pdThreshold));
        sldCtx.stroke();
      }
      sldCtx.setLineDash([]);

      // Labels
      sldCtx.font = `${10 * scale}px system-ui`;
      sldCtx.fillStyle = 'rgba(107, 203, 119, 0.6)';
      sldCtx.textAlign = 'right';
      sldCtx.fillText('PR -30%', sldCanvas.width - padding.right - 5, sldToY(prThreshold) - 3);
      if (pdThreshold <= maxY) {
        sldCtx.fillStyle = 'rgba(203, 107, 107, 0.6)';
        sldCtx.fillText('PD +20%', sldCanvas.width - padding.right - 5, sldToY(pdThreshold) - 3);
      }
    }

    // Draw the SLD line
    sldCtx.strokeStyle = '#6BC8CB';
    sldCtx.lineWidth = 3 * scale;
    sldCtx.lineJoin = 'round';
    sldCtx.beginPath();
    sldData.forEach((d, i) => {
      const x = monthToX(d.month);
      const y = sldToY(d.sld);
      if (i === 0) sldCtx.moveTo(x, y);
      else sldCtx.lineTo(x, y);
    });
    sldCtx.stroke();

    // Draw data points
    sldCtx.fillStyle = '#6BC8CB';
    sldData.forEach(d => {
      const x = monthToX(d.month);
      const y = sldToY(d.sld);
      sldCtx.beginPath();
      sldCtx.arc(x, y, 4 * scale, 0, Math.PI * 2);
      sldCtx.fill();
    });

    // Current SLD value
    const currentSLD = sldData[sldData.length - 1]?.sld || 0;
    const pctChange = baselineSLD > 0 ? ((currentSLD - baselineSLD) / baselineSLD) * 100 : 0;
    sldCtx.fillStyle = '#6BC8CB';
    sldCtx.font = `bold ${16 * scale}px system-ui`;
    sldCtx.textAlign = 'right';
    sldCtx.fillText(`SLD: ${currentSLD.toFixed(1)} mm`, sldCanvas.width - padding.right - 10, padding.top + 25 * scale);
    sldCtx.font = `${12 * scale}px system-ui`;
    sldCtx.fillStyle = pctChange < 0 ? '#6BCB77' : pctChange > 0 ? '#CB6B6B' : 'rgba(255,255,255,0.7)';
    sldCtx.fillText(`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}% from baseline`, sldCanvas.width - padding.right - 10, padding.top + 42 * scale);

    // Title
    sldCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    sldCtx.font = `bold ${12 * scale}px system-ui`;
    sldCtx.textAlign = 'left';
    sldCtx.fillText('Sum of Longest Diameters (RECIST Target Lesions)', padding.left, 18 * scale);
  }

  // Draw Best Overall Response Bar Chart
  function drawBestResponsePlot() {
    if (!bestResponseCtx || !bestResponseCanvas) return;

    const scale = plotScaled ? 2 : 1;
    bestResponseCanvas.width = PLOT_BASE_WIDTH * scale;
    bestResponseCanvas.height = PLOT_BASE_HEIGHT * scale;
    bestResponseCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    bestResponseCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    const bestResponseYAxis = document.querySelector('.best-response-y');
    const bestResponseXAxis = document.getElementById('best-response-x-axis');
    if (bestResponseYAxis) bestResponseYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    if (bestResponseXAxis) bestResponseXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';

    bestResponseCtx.clearRect(0, 0, bestResponseCanvas.width, bestResponseCanvas.height);

    const padding = { left: 10, right: 10, top: 30, bottom: 30 };
    const plotWidth = bestResponseCanvas.width - padding.left - padding.right;
    const plotHeight = bestResponseCanvas.height - padding.top - padding.bottom;

    // Gather best response for each tumor
    const tumors = [];
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 1) return;
      const tumor = droppedTumors.find(t => t.userData.plotId === tumorId);
      const region = tumor?.userData?.region || `Tumor ${tumorId + 1}`;
      const baseline = data.points.find(p => p.month <= 0)?.size || data.points[0].size;

      let bestChange = 0;
      data.points.forEach(p => {
        if (p.month <= 0) return;
        const pctChange = baseline > 0 ? ((p.size - baseline) / baseline) * 100 : 0;
        if (pctChange < bestChange) bestChange = pctChange;
      });

      tumors.push({ id: tumorId, region, bestChange, removed: data.removed });
    });

    // Sort by best response
    tumors.sort((a, b) => a.bestChange - b.bestChange);

    // Update X-axis labels
    if (bestResponseXAxis) {
      bestResponseXAxis.innerHTML = tumors.map(t =>
        `<span title="${t.region}: ${t.bestChange.toFixed(1)}%">${t.region}</span>`
      ).join('');
    }

    if (tumors.length === 0) {
      bestResponseCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      bestResponseCtx.font = `${14 * scale}px system-ui`;
      bestResponseCtx.textAlign = 'center';
      bestResponseCtx.fillText('No tumor data - start simulation', bestResponseCanvas.width / 2, bestResponseCanvas.height / 2);
      return;
    }

    const yMin = -100, yMax = 100, yRange = yMax - yMin;
    const pctToY = (pct) => padding.top + (1 - (pct - yMin) / yRange) * plotHeight;
    const zeroY = pctToY(0);

    // Draw grid and thresholds
    bestResponseCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    bestResponseCtx.lineWidth = 1;
    bestResponseCtx.setLineDash([5, 5]);
    bestResponseCtx.beginPath();
    bestResponseCtx.moveTo(padding.left, zeroY);
    bestResponseCtx.lineTo(bestResponseCanvas.width - padding.right, zeroY);
    bestResponseCtx.stroke();
    bestResponseCtx.setLineDash([]);

    // PR line
    bestResponseCtx.strokeStyle = 'rgba(107, 203, 119, 0.4)';
    bestResponseCtx.setLineDash([3, 3]);
    bestResponseCtx.beginPath();
    bestResponseCtx.moveTo(padding.left, pctToY(-30));
    bestResponseCtx.lineTo(bestResponseCanvas.width - padding.right, pctToY(-30));
    bestResponseCtx.stroke();

    // PD line
    bestResponseCtx.strokeStyle = 'rgba(203, 107, 107, 0.4)';
    bestResponseCtx.beginPath();
    bestResponseCtx.moveTo(padding.left, pctToY(20));
    bestResponseCtx.lineTo(bestResponseCanvas.width - padding.right, pctToY(20));
    bestResponseCtx.stroke();
    bestResponseCtx.setLineDash([]);

    // Labels
    bestResponseCtx.font = `${10 * scale}px system-ui`;
    bestResponseCtx.textAlign = 'right';
    bestResponseCtx.fillStyle = 'rgba(107, 203, 119, 0.6)';
    bestResponseCtx.fillText('PR -30%', bestResponseCanvas.width - padding.right - 5, pctToY(-30) + 12);
    bestResponseCtx.fillStyle = 'rgba(203, 107, 107, 0.6)';
    bestResponseCtx.fillText('PD +20%', bestResponseCanvas.width - padding.right - 5, pctToY(20) - 3);

    // Draw bars
    const barWidth = Math.min(60 * scale, (plotWidth / tumors.length) * 0.7);
    const barGap = (plotWidth - barWidth * tumors.length) / (tumors.length + 1);

    tumors.forEach((tumor, i) => {
      const x = padding.left + barGap + i * (barWidth + barGap);
      const barHeight = Math.abs(tumor.bestChange / yRange) * plotHeight;

      let color;
      if (tumor.removed) {
        color = 'rgba(100, 100, 110, 0.6)';
      } else if (tumor.bestChange <= -30) {
        color = 'rgba(107, 203, 119, 0.8)';
      } else if (tumor.bestChange < 0) {
        color = 'rgba(107, 180, 203, 0.8)';
      } else {
        color = 'rgba(203, 180, 107, 0.8)';
      }

      bestResponseCtx.fillStyle = color;
      if (tumor.bestChange >= 0) {
        bestResponseCtx.fillRect(x, zeroY - barHeight, barWidth, barHeight);
      } else {
        bestResponseCtx.fillRect(x, zeroY, barWidth, barHeight);
      }

      bestResponseCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      bestResponseCtx.lineWidth = 1;
      if (tumor.bestChange >= 0) {
        bestResponseCtx.strokeRect(x, zeroY - barHeight, barWidth, barHeight);
      } else {
        bestResponseCtx.strokeRect(x, zeroY, barWidth, barHeight);
      }

      // Label
      bestResponseCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      bestResponseCtx.font = `bold ${11 * scale}px system-ui`;
      bestResponseCtx.textAlign = 'center';
      const labelY = tumor.bestChange >= 0 ? zeroY - barHeight - 5 : zeroY + barHeight + 12 * scale;
      bestResponseCtx.fillText(`${tumor.bestChange.toFixed(0)}%`, x + barWidth / 2, labelY);
    });

    // Title
    bestResponseCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    bestResponseCtx.font = `bold ${12 * scale}px system-ui`;
    bestResponseCtx.textAlign = 'left';
    bestResponseCtx.fillText('Best Overall Response (% Change from Baseline)', padding.left, 18 * scale);
  }

  // Draw Response Categories Donut Chart
  function drawResponseDonut() {
    if (!donutCtx || !donutCanvas) return;

    const scale = plotScaled ? 2 : 1;
    donutCanvas.width = PLOT_BASE_WIDTH * scale;
    donutCanvas.height = PLOT_BASE_HEIGHT * scale;
    donutCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    donutCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    donutCtx.clearRect(0, 0, donutCanvas.width, donutCanvas.height);

    // Categorize tumors by response
    const categories = {
      CR: { count: 0, color: '#4CAF50', label: 'Complete Response' },
      PR: { count: 0, color: '#6BCB77', label: 'Partial Response' },
      SD: { count: 0, color: '#6BC8CB', label: 'Stable Disease' },
      PD: { count: 0, color: '#CB6B6B', label: 'Progressive Disease' }
    };

    let total = 0;
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 1) return;
      if (data.removed) return; // Don't count removed tumors

      const baseline = data.points.find(p => p.month <= 0)?.size || data.points[0].size;
      const current = data.points[data.points.length - 1].size;
      const pctChange = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

      total++;
      if (current === 0 || pctChange <= -100) {
        categories.CR.count++;
      } else if (pctChange <= -30) {
        categories.PR.count++;
      } else if (pctChange >= 20) {
        categories.PD.count++;
      } else {
        categories.SD.count++;
      }
    });

    if (total === 0) {
      donutCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      donutCtx.font = `${14 * scale}px system-ui`;
      donutCtx.textAlign = 'center';
      donutCtx.fillText('No tumor data - start simulation', donutCanvas.width / 2, donutCanvas.height / 2);
      return;
    }

    const centerX = donutCanvas.width / 2;
    const centerY = donutCanvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 60 * scale;
    const innerRadius = outerRadius * 0.55;

    // Draw donut segments
    let startAngle = -Math.PI / 2; // Start at top
    const categoryOrder = ['CR', 'PR', 'SD', 'PD'];

    categoryOrder.forEach(key => {
      const cat = categories[key];
      if (cat.count === 0) return;

      const sliceAngle = (cat.count / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      donutCtx.beginPath();
      donutCtx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      donutCtx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      donutCtx.closePath();
      donutCtx.fillStyle = cat.color;
      donutCtx.fill();

      // Draw slice border
      donutCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      donutCtx.lineWidth = 2;
      donutCtx.stroke();

      // Draw label line and text
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = outerRadius + 20 * scale;
      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;

      // Percentage label on slice
      if (sliceAngle > 0.3) { // Only show if big enough
        const pctRadius = (outerRadius + innerRadius) / 2;
        const pctX = centerX + Math.cos(midAngle) * pctRadius;
        const pctY = centerY + Math.sin(midAngle) * pctRadius;
        donutCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        donutCtx.font = `bold ${14 * scale}px system-ui`;
        donutCtx.textAlign = 'center';
        donutCtx.textBaseline = 'middle';
        donutCtx.fillText(`${Math.round(cat.count / total * 100)}%`, pctX, pctY);
      }

      startAngle = endAngle;
    });

    // Center text
    donutCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    donutCtx.font = `bold ${24 * scale}px system-ui`;
    donutCtx.textAlign = 'center';
    donutCtx.textBaseline = 'middle';
    donutCtx.fillText(`${total}`, centerX, centerY - 10 * scale);
    donutCtx.font = `${12 * scale}px system-ui`;
    donutCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    donutCtx.fillText('tumors', centerX, centerY + 12 * scale);

    // Legend
    const legendX = 30 * scale;
    let legendY = donutCanvas.height - 100 * scale;
    donutCtx.textAlign = 'left';
    donutCtx.textBaseline = 'middle';

    categoryOrder.forEach(key => {
      const cat = categories[key];

      // Color box
      donutCtx.fillStyle = cat.color;
      donutCtx.fillRect(legendX, legendY - 6 * scale, 14 * scale, 14 * scale);

      // Label
      donutCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      donutCtx.font = `${12 * scale}px system-ui`;
      donutCtx.fillText(`${key}: ${cat.label} (${cat.count})`, legendX + 20 * scale, legendY);

      legendY += 20 * scale;
    });

    // Title
    donutCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    donutCtx.font = `bold ${12 * scale}px system-ui`;
    donutCtx.textAlign = 'left';
    donutCtx.textBaseline = 'top';
    donutCtx.fillText(`Response Categories (Month ${currentMonth.toFixed(1)})`, 15 * scale, 15 * scale);

    // Overall response assessment
    let overallResponse = 'NE';
    if (categories.PD.count > 0) overallResponse = 'PD';
    else if (categories.CR.count === total) overallResponse = 'CR';
    else if (categories.CR.count + categories.PR.count > 0) overallResponse = 'PR';
    else overallResponse = 'SD';

    donutCtx.textAlign = 'right';
    donutCtx.fillStyle = categories[overallResponse]?.color || '#6BC8CB';
    donutCtx.font = `bold ${16 * scale}px system-ui`;
    donutCtx.fillText(`Overall: ${overallResponse}`, donutCanvas.width - 15 * scale, 15 * scale);
  }

  // Draw Duration of Response (DOR) Plot
  function drawDORPlot() {
    if (!dorCtx || !dorCanvas) return;

    const scale = plotScaled ? 2 : 1;
    dorCanvas.width = PLOT_BASE_WIDTH * scale;
    dorCanvas.height = PLOT_BASE_HEIGHT * scale;
    dorCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    dorCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    const dorYAxis = document.getElementById('dor-y-axis');
    const dorXAxis = document.querySelector('.dor-x');
    if (dorYAxis) dorYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    if (dorXAxis) dorXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';

    dorCtx.clearRect(0, 0, dorCanvas.width, dorCanvas.height);

    const padding = { left: 10, right: 20, top: 30, bottom: 20 };
    const plotWidth = dorCanvas.width - padding.left - padding.right;
    const plotHeight = dorCanvas.height - padding.top - padding.bottom;

    // Find tumors that achieved response (PR or CR)
    const responders = [];
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 1) return;
      const tumor = droppedTumors.find(t => t.userData.plotId === tumorId);
      const region = tumor?.userData?.region || `Tumor ${tumorId + 1}`;
      const baseline = data.points.find(p => p.month <= 0)?.size || data.points[0].size;

      let responseStart = null;
      let responseEnd = null;
      let bestChange = 0;

      for (const p of data.points) {
        if (p.month <= 0) continue;
        const pctChange = baseline > 0 ? ((p.size - baseline) / baseline) * 100 : 0;

        if (pctChange < bestChange) bestChange = pctChange;

        // Response starts when reaching -30%
        if (pctChange <= -30 && responseStart === null) {
          responseStart = p.month;
        }

        // Response ends when back above -30% or progression
        if (responseStart !== null && responseEnd === null && pctChange > -30) {
          responseEnd = p.month;
        }
      }

      if (responseStart !== null) {
        responders.push({
          id: tumorId,
          region,
          responseStart,
          responseEnd: responseEnd || (data.removed ? data.removedAtMonth : currentMonth),
          ongoing: responseEnd === null && !data.removed,
          removed: data.removed,
          bestChange
        });
      }
    });

    // Sort by duration (longest first)
    responders.sort((a, b) => (b.responseEnd - b.responseStart) - (a.responseEnd - a.responseStart));

    // Update Y-axis labels
    if (dorYAxis) {
      dorYAxis.innerHTML = responders.map(r =>
        `<span title="${r.region}">${r.region}</span>`
      ).join('');
    }

    if (responders.length === 0) {
      dorCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      dorCtx.font = `${14 * scale}px system-ui`;
      dorCtx.textAlign = 'center';
      dorCtx.fillText('No responding tumors (PR/CR) yet', dorCanvas.width / 2, dorCanvas.height / 2);
      return;
    }

    const monthToX = (month) => padding.left + (month / maxMonths) * plotWidth;
    const barHeight = Math.min(30 * scale, (plotHeight / responders.length) * 0.7);
    const barGap = (plotHeight - barHeight * responders.length) / (responders.length + 1);

    // Draw grid
    dorCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    dorCtx.lineWidth = 1;
    for (let month = 0; month <= maxMonths; month += 3) {
      const x = monthToX(month);
      dorCtx.beginPath();
      dorCtx.moveTo(x, padding.top);
      dorCtx.lineTo(x, dorCanvas.height - padding.bottom);
      dorCtx.stroke();
    }

    // Draw bars
    responders.forEach((r, i) => {
      const y = padding.top + barGap + i * (barHeight + barGap);
      const startX = monthToX(r.responseStart);
      const endX = monthToX(r.responseEnd);
      const barWidth = endX - startX;

      // Bar color - green gradient based on best response
      const intensity = Math.min(1, Math.abs(r.bestChange) / 100);
      dorCtx.fillStyle = r.removed
        ? 'rgba(100, 100, 110, 0.6)'
        : `rgba(${107 - intensity * 30}, ${203}, ${119 - intensity * 20}, 0.8)`;

      dorCtx.fillRect(startX, y, barWidth, barHeight);

      // Border
      dorCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      dorCtx.strokeRect(startX, y, barWidth, barHeight);

      // Ongoing arrow if still responding
      if (r.ongoing) {
        dorCtx.fillStyle = '#6BCB77';
        dorCtx.beginPath();
        dorCtx.moveTo(endX, y + barHeight / 2);
        dorCtx.lineTo(endX - 8 * scale, y + 2);
        dorCtx.lineTo(endX - 8 * scale, y + barHeight - 2);
        dorCtx.closePath();
        dorCtx.fill();
      }

      // Duration label
      const duration = r.responseEnd - r.responseStart;
      dorCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      dorCtx.font = `bold ${10 * scale}px system-ui`;
      dorCtx.textAlign = 'center';
      dorCtx.fillText(`${duration.toFixed(1)} mo`, startX + barWidth / 2, y + barHeight / 2 + 4 * scale);
    });

    // Stats
    const avgDuration = responders.reduce((sum, r) => sum + (r.responseEnd - r.responseStart), 0) / responders.length;
    dorCtx.fillStyle = '#6BCB77';
    dorCtx.font = `bold ${14 * scale}px system-ui`;
    dorCtx.textAlign = 'right';
    dorCtx.fillText(`${responders.length} responder${responders.length !== 1 ? 's' : ''}`, dorCanvas.width - padding.right - 10, padding.top + 20 * scale);
    dorCtx.font = `${12 * scale}px system-ui`;
    dorCtx.fillText(`Avg duration: ${avgDuration.toFixed(1)} mo`, dorCanvas.width - padding.right - 10, padding.top + 38 * scale);

    // Title
    dorCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    dorCtx.font = `bold ${12 * scale}px system-ui`;
    dorCtx.textAlign = 'left';
    dorCtx.fillText('Duration of Response (Time in PR/CR)', padding.left, 18 * scale);
  }

  // Draw Heatmap Plot
  function drawHeatmapPlot() {
    if (!heatmapCtx || !heatmapCanvas) return;

    const scale = plotScaled ? 2 : 1;
    heatmapCanvas.width = PLOT_BASE_WIDTH * scale;
    heatmapCanvas.height = PLOT_BASE_HEIGHT * scale;
    heatmapCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    heatmapCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    const heatmapYAxis = document.getElementById('heatmap-y-axis');
    const heatmapXAxis = document.querySelector('.heatmap-x');
    if (heatmapYAxis) heatmapYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    if (heatmapXAxis) heatmapXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';

    heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

    const padding = { left: 10, right: 80, top: 30, bottom: 20 };
    const plotWidth = heatmapCanvas.width - padding.left - padding.right;
    const plotHeight = heatmapCanvas.height - padding.top - padding.bottom;

    // Gather tumor data
    const tumors = [];
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 1) return;
      const tumor = droppedTumors.find(t => t.userData.plotId === tumorId);
      const region = tumor?.userData?.region || `Tumor ${tumorId + 1}`;
      const baseline = data.points.find(p => p.month <= 0)?.size || data.points[0].size;

      const percentChanges = [];
      data.points.forEach(p => {
        if (p.month < 0) return;
        const pctChange = baseline > 0 ? ((p.size - baseline) / baseline) * 100 : 0;
        percentChanges.push({ month: p.month, pctChange });
      });

      tumors.push({ id: tumorId, region, percentChanges, removed: data.removed });
    });

    // Update Y-axis labels
    if (heatmapYAxis) {
      heatmapYAxis.innerHTML = tumors.map(t =>
        `<span title="${t.region}">${t.region}</span>`
      ).join('');
    }

    if (tumors.length === 0) {
      heatmapCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      heatmapCtx.font = `${14 * scale}px system-ui`;
      heatmapCtx.textAlign = 'center';
      heatmapCtx.fillText('No tumor data - start simulation', heatmapCanvas.width / 2, heatmapCanvas.height / 2);
      return;
    }

    const cellWidth = plotWidth / (maxMonths + 1);
    const cellHeight = plotHeight / tumors.length;

    // Color function: green for shrinkage, red for growth
    const getColor = (pctChange) => {
      if (pctChange <= -30) return 'rgba(76, 175, 80, 0.9)';  // CR/PR green
      if (pctChange <= -15) return 'rgba(107, 203, 119, 0.8)';
      if (pctChange < 0) return 'rgba(107, 180, 203, 0.7)';
      if (pctChange < 10) return 'rgba(180, 180, 150, 0.6)';
      if (pctChange < 20) return 'rgba(203, 180, 107, 0.7)';
      return 'rgba(203, 107, 107, 0.8)';  // PD red
    };

    // Draw cells
    tumors.forEach((tumor, row) => {
      const y = padding.top + row * cellHeight;

      // Draw baseline cell (month 0)
      heatmapCtx.fillStyle = 'rgba(100, 120, 140, 0.5)';
      heatmapCtx.fillRect(padding.left, y, cellWidth, cellHeight - 2);

      // Draw cells for each month
      tumor.percentChanges.forEach(pc => {
        if (pc.month < 0) return;
        const x = padding.left + pc.month * (plotWidth / maxMonths);
        const width = plotWidth / maxMonths;

        heatmapCtx.fillStyle = getColor(pc.pctChange);
        heatmapCtx.fillRect(x, y, width - 1, cellHeight - 2);

        // Cell border
        heatmapCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        heatmapCtx.strokeRect(x, y, width - 1, cellHeight - 2);
      });

      // Removed indicator
      if (tumor.removed) {
        heatmapCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        heatmapCtx.font = `${10 * scale}px system-ui`;
        heatmapCtx.textAlign = 'right';
        heatmapCtx.fillText('✕', padding.left + plotWidth - 5, y + cellHeight / 2 + 4);
      }
    });

    // Draw color legend
    const legendX = heatmapCanvas.width - padding.right + 10;
    const legendY = padding.top + 20;
    const legendHeight = 150 * scale;
    const legendWidth = 15 * scale;

    // Gradient legend
    const gradient = heatmapCtx.createLinearGradient(0, legendY, 0, legendY + legendHeight);
    gradient.addColorStop(0, 'rgba(203, 107, 107, 0.8)');
    gradient.addColorStop(0.3, 'rgba(203, 180, 107, 0.7)');
    gradient.addColorStop(0.5, 'rgba(180, 180, 150, 0.6)');
    gradient.addColorStop(0.7, 'rgba(107, 180, 203, 0.7)');
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0.9)');

    heatmapCtx.fillStyle = gradient;
    heatmapCtx.fillRect(legendX, legendY, legendWidth, legendHeight);
    heatmapCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    heatmapCtx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Legend labels
    heatmapCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    heatmapCtx.font = `${9 * scale}px system-ui`;
    heatmapCtx.textAlign = 'left';
    heatmapCtx.fillText('+50%', legendX + legendWidth + 5, legendY + 8);
    heatmapCtx.fillText('0%', legendX + legendWidth + 5, legendY + legendHeight / 2 + 4);
    heatmapCtx.fillText('-50%', legendX + legendWidth + 5, legendY + legendHeight - 2);

    // Title
    heatmapCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    heatmapCtx.font = `bold ${12 * scale}px system-ui`;
    heatmapCtx.textAlign = 'left';
    heatmapCtx.fillText('Tumor Response Heatmap (% Change)', padding.left, 18 * scale);
  }

  // Draw Growth Rate Plot
  function drawGrowthRatePlot() {
    if (!growthRateCtx || !growthRateCanvas) return;

    const scale = plotScaled ? 2 : 1;
    growthRateCanvas.width = PLOT_BASE_WIDTH * scale;
    growthRateCanvas.height = PLOT_BASE_HEIGHT * scale;
    growthRateCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    growthRateCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    const growthRateYAxis = document.querySelector('.growth-rate-y');
    const growthRateXAxis = document.querySelector('.growth-rate-x');
    if (growthRateYAxis) growthRateYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    if (growthRateXAxis) growthRateXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';

    growthRateCtx.clearRect(0, 0, growthRateCanvas.width, growthRateCanvas.height);

    const padding = { left: 10, right: 20, top: 30, bottom: 20 };
    const plotWidth = growthRateCanvas.width - padding.left - padding.right;
    const plotHeight = growthRateCanvas.height - padding.top - padding.bottom;

    // Calculate growth rates for each tumor
    const tumorRates = [];
    const lineColors = ['#6BC8CB', '#CB6B6B', '#6BCB77', '#CBB86B', '#B86BCB', '#6B8BCB', '#CB8B6B'];

    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 2) return;
      const tumor = droppedTumors.find(t => t.userData.plotId === tumorId);
      const region = tumor?.userData?.region || `Tumor ${tumorId + 1}`;

      const rates = [];
      for (let i = 1; i < data.points.length; i++) {
        const p1 = data.points[i - 1];
        const p2 = data.points[i];
        if (p2.month <= 0) continue;

        const deltaSize = p2.size - p1.size;
        const deltaTime = p2.month - p1.month;
        const rate = deltaTime > 0 ? deltaSize / deltaTime : 0; // mm/month

        rates.push({ month: p2.month, rate });
      }

      if (rates.length > 0) {
        tumorRates.push({ id: tumorId, region, rates, removed: data.removed });
      }
    });

    if (tumorRates.length === 0) {
      growthRateCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      growthRateCtx.font = `${14 * scale}px system-ui`;
      growthRateCtx.textAlign = 'center';
      growthRateCtx.fillText('No growth data - start simulation', growthRateCanvas.width / 2, growthRateCanvas.height / 2);
      return;
    }

    // Find max rate for scaling
    let maxRate = 20;
    tumorRates.forEach(t => {
      t.rates.forEach(r => {
        if (Math.abs(r.rate) > maxRate) maxRate = Math.abs(r.rate);
      });
    });
    maxRate = Math.ceil(maxRate / 5) * 5;

    // Update Y-axis
    if (growthRateYAxis) {
      growthRateYAxis.innerHTML = [maxRate, maxRate/2, 0, -maxRate/2, -maxRate]
        .map(v => `<span>${v >= 0 ? '+' : ''}${v.toFixed(0)}</span>`).join('');
    }

    const monthToX = (month) => padding.left + (month / maxMonths) * plotWidth;
    const rateToY = (rate) => padding.top + (1 - (rate + maxRate) / (2 * maxRate)) * plotHeight;
    const zeroY = rateToY(0);

    // Draw grid
    growthRateCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    growthRateCtx.lineWidth = 1;
    for (let r = -maxRate; r <= maxRate; r += maxRate / 2) {
      growthRateCtx.beginPath();
      growthRateCtx.moveTo(padding.left, rateToY(r));
      growthRateCtx.lineTo(growthRateCanvas.width - padding.right, rateToY(r));
      growthRateCtx.stroke();
    }
    for (let month = 0; month <= maxMonths; month += 3) {
      growthRateCtx.beginPath();
      growthRateCtx.moveTo(monthToX(month), padding.top);
      growthRateCtx.lineTo(monthToX(month), growthRateCanvas.height - padding.bottom);
      growthRateCtx.stroke();
    }

    // Zero line
    growthRateCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    growthRateCtx.lineWidth = 2;
    growthRateCtx.beginPath();
    growthRateCtx.moveTo(padding.left, zeroY);
    growthRateCtx.lineTo(growthRateCanvas.width - padding.right, zeroY);
    growthRateCtx.stroke();

    // Draw lines for each tumor
    tumorRates.forEach((tumor, idx) => {
      const color = lineColors[idx % lineColors.length];
      growthRateCtx.strokeStyle = tumor.removed ? 'rgba(100, 100, 110, 0.5)' : color;
      growthRateCtx.lineWidth = 2 * scale;
      growthRateCtx.lineJoin = 'round';

      growthRateCtx.beginPath();
      tumor.rates.forEach((r, i) => {
        const x = monthToX(r.month);
        const y = rateToY(r.rate);
        if (i === 0) growthRateCtx.moveTo(x, y);
        else growthRateCtx.lineTo(x, y);
      });
      growthRateCtx.stroke();

      // Data points
      growthRateCtx.fillStyle = tumor.removed ? 'rgba(100, 100, 110, 0.5)' : color;
      tumor.rates.forEach(r => {
        growthRateCtx.beginPath();
        growthRateCtx.arc(monthToX(r.month), rateToY(r.rate), 3 * scale, 0, Math.PI * 2);
        growthRateCtx.fill();
      });
    });

    // Legend
    const legendX = growthRateCanvas.width - padding.right - 120 * scale;
    let legendY = padding.top + 5;
    growthRateCtx.font = `${10 * scale}px system-ui`;
    tumorRates.slice(0, 5).forEach((tumor, idx) => {
      const color = lineColors[idx % lineColors.length];
      growthRateCtx.fillStyle = tumor.removed ? 'rgba(100, 100, 110, 0.5)' : color;
      growthRateCtx.fillRect(legendX, legendY, 12 * scale, 10 * scale);
      growthRateCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      growthRateCtx.textAlign = 'left';
      growthRateCtx.fillText(tumor.region.substring(0, 12), legendX + 16 * scale, legendY + 9 * scale);
      legendY += 14 * scale;
    });

    // Title
    growthRateCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    growthRateCtx.font = `bold ${12 * scale}px system-ui`;
    growthRateCtx.textAlign = 'left';
    growthRateCtx.fillText('Tumor Growth Rate (mm/month)', padding.left, 18 * scale);
  }

  // Draw Target vs Non-Target Lesion Plot
  function drawTargetNonTargetPlot() {
    if (!targetCtx || !targetCanvas) return;

    const scale = plotScaled ? 2 : 1;
    targetCanvas.width = PLOT_BASE_WIDTH * scale;
    targetCanvas.height = PLOT_BASE_HEIGHT * scale;
    targetCanvas.style.width = (PLOT_BASE_WIDTH * scale) + 'px';
    targetCanvas.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';

    const targetYAxis = document.querySelector('.target-y');
    const targetXAxis = document.querySelector('.target-x');
    if (targetYAxis) targetYAxis.style.height = (PLOT_BASE_HEIGHT * scale) + 'px';
    if (targetXAxis) targetXAxis.style.width = (PLOT_BASE_WIDTH * scale) + 'px';

    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    const padding = { left: 10, right: 20, top: 30, bottom: 20 };
    const plotWidth = targetCanvas.width - padding.left - padding.right;
    const plotHeight = targetCanvas.height - padding.top - padding.bottom;

    // Classify tumors: largest 5 are "target", rest are "non-target" (RECIST rule)
    const allTumors = [];
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 1) return;
      const baseline = data.points.find(p => p.month <= 0)?.size || data.points[0].size;
      allTumors.push({ tumorId, data, baseline });
    });

    // Sort by baseline size and classify
    allTumors.sort((a, b) => b.baseline - a.baseline);
    const targetTumors = allTumors.slice(0, 5);
    const nonTargetTumors = allTumors.slice(5);

    // Calculate aggregate % change for target lesions (sum)
    const targetData = [];
    const nonTargetData = [];

    // Get all months
    const allMonths = new Set();
    allTumors.forEach(t => {
      t.data.points.forEach(p => { if (p.month >= 0) allMonths.add(p.month); });
    });
    const sortedMonths = [...allMonths].sort((a, b) => a - b);

    // Calculate target SLD % change
    const targetBaseline = targetTumors.reduce((sum, t) => sum + t.baseline, 0);
    sortedMonths.forEach(month => {
      let targetSum = 0;
      targetTumors.forEach(t => {
        const point = t.data.points.find(p => p.month === month);
        if (point) targetSum += point.size;
        else {
          const earlier = t.data.points.filter(p => p.month <= month).pop();
          if (earlier) targetSum += earlier.size;
        }
      });
      const pctChange = targetBaseline > 0 ? ((targetSum - targetBaseline) / targetBaseline) * 100 : 0;
      targetData.push({ month, pctChange });
    });

    // Non-target: track if any have "unequivocal progression"
    const nonTargetBaseline = nonTargetTumors.reduce((sum, t) => sum + t.baseline, 0);
    sortedMonths.forEach(month => {
      let nonTargetSum = 0;
      nonTargetTumors.forEach(t => {
        const point = t.data.points.find(p => p.month === month);
        if (point) nonTargetSum += point.size;
        else {
          const earlier = t.data.points.filter(p => p.month <= month).pop();
          if (earlier) nonTargetSum += earlier.size;
        }
      });
      const pctChange = nonTargetBaseline > 0 ? ((nonTargetSum - nonTargetBaseline) / nonTargetBaseline) * 100 : 0;
      nonTargetData.push({ month, pctChange });
    });

    if (targetData.length === 0) {
      targetCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      targetCtx.font = `${14 * scale}px system-ui`;
      targetCtx.textAlign = 'center';
      targetCtx.fillText('No tumor data - start simulation', targetCanvas.width / 2, targetCanvas.height / 2);
      return;
    }

    const monthToX = (month) => padding.left + (month / maxMonths) * plotWidth;
    const pctToY = (pct) => padding.top + (1 - (pct + 100) / 200) * plotHeight;
    const zeroY = pctToY(0);

    // Draw grid
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    targetCtx.lineWidth = 1;
    for (let pct = -100; pct <= 100; pct += 50) {
      targetCtx.beginPath();
      targetCtx.moveTo(padding.left, pctToY(pct));
      targetCtx.lineTo(targetCanvas.width - padding.right, pctToY(pct));
      targetCtx.stroke();
    }
    for (let month = 0; month <= maxMonths; month += 3) {
      targetCtx.beginPath();
      targetCtx.moveTo(monthToX(month), padding.top);
      targetCtx.lineTo(monthToX(month), targetCanvas.height - padding.bottom);
      targetCtx.stroke();
    }

    // RECIST thresholds
    targetCtx.setLineDash([3, 3]);
    targetCtx.strokeStyle = 'rgba(107, 203, 119, 0.5)';
    targetCtx.beginPath();
    targetCtx.moveTo(padding.left, pctToY(-30));
    targetCtx.lineTo(targetCanvas.width - padding.right, pctToY(-30));
    targetCtx.stroke();

    targetCtx.strokeStyle = 'rgba(203, 107, 107, 0.5)';
    targetCtx.beginPath();
    targetCtx.moveTo(padding.left, pctToY(20));
    targetCtx.lineTo(targetCanvas.width - padding.right, pctToY(20));
    targetCtx.stroke();
    targetCtx.setLineDash([]);

    // Labels
    targetCtx.font = `${10 * scale}px system-ui`;
    targetCtx.textAlign = 'right';
    targetCtx.fillStyle = 'rgba(107, 203, 119, 0.6)';
    targetCtx.fillText('PR -30%', targetCanvas.width - padding.right - 5, pctToY(-30) + 12);
    targetCtx.fillStyle = 'rgba(203, 107, 107, 0.6)';
    targetCtx.fillText('PD +20%', targetCanvas.width - padding.right - 5, pctToY(20) - 3);

    // Zero line
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.moveTo(padding.left, zeroY);
    targetCtx.lineTo(targetCanvas.width - padding.right, zeroY);
    targetCtx.stroke();

    // Draw TARGET line (cyan)
    targetCtx.strokeStyle = '#6BC8CB';
    targetCtx.lineWidth = 3 * scale;
    targetCtx.lineJoin = 'round';
    targetCtx.beginPath();
    targetData.forEach((d, i) => {
      const x = monthToX(d.month);
      const y = pctToY(d.pctChange);
      if (i === 0) targetCtx.moveTo(x, y);
      else targetCtx.lineTo(x, y);
    });
    targetCtx.stroke();

    // Draw NON-TARGET line (orange) if any exist
    if (nonTargetTumors.length > 0 && nonTargetData.length > 0) {
      targetCtx.strokeStyle = '#CB8B6B';
      targetCtx.lineWidth = 3 * scale;
      targetCtx.beginPath();
      nonTargetData.forEach((d, i) => {
        const x = monthToX(d.month);
        const y = pctToY(d.pctChange);
        if (i === 0) targetCtx.moveTo(x, y);
        else targetCtx.lineTo(x, y);
      });
      targetCtx.stroke();
    }

    // Data points
    targetCtx.fillStyle = '#6BC8CB';
    targetData.forEach(d => {
      targetCtx.beginPath();
      targetCtx.arc(monthToX(d.month), pctToY(d.pctChange), 4 * scale, 0, Math.PI * 2);
      targetCtx.fill();
    });

    if (nonTargetTumors.length > 0) {
      targetCtx.fillStyle = '#CB8B6B';
      nonTargetData.forEach(d => {
        targetCtx.beginPath();
        targetCtx.arc(monthToX(d.month), pctToY(d.pctChange), 4 * scale, 0, Math.PI * 2);
        targetCtx.fill();
      });
    }

    // Legend
    targetCtx.font = `${11 * scale}px system-ui`;
    targetCtx.fillStyle = '#6BC8CB';
    targetCtx.fillRect(targetCanvas.width - 180 * scale, padding.top + 5, 12 * scale, 12 * scale);
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    targetCtx.textAlign = 'left';
    targetCtx.fillText(`Target (${targetTumors.length})`, targetCanvas.width - 165 * scale, padding.top + 15);

    if (nonTargetTumors.length > 0) {
      targetCtx.fillStyle = '#CB8B6B';
      targetCtx.fillRect(targetCanvas.width - 180 * scale, padding.top + 22, 12 * scale, 12 * scale);
      targetCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      targetCtx.fillText(`Non-Target (${nonTargetTumors.length})`, targetCanvas.width - 165 * scale, padding.top + 32);
    }

    // Current values
    const currentTarget = targetData[targetData.length - 1]?.pctChange || 0;
    const currentNonTarget = nonTargetData[nonTargetData.length - 1]?.pctChange || 0;

    targetCtx.font = `bold ${14 * scale}px system-ui`;
    targetCtx.textAlign = 'right';
    targetCtx.fillStyle = currentTarget < 0 ? '#6BCB77' : currentTarget > 20 ? '#CB6B6B' : '#6BC8CB';
    targetCtx.fillText(`Target: ${currentTarget >= 0 ? '+' : ''}${currentTarget.toFixed(1)}%`, targetCanvas.width - padding.right - 10, targetCanvas.height - padding.bottom - 25 * scale);

    if (nonTargetTumors.length > 0) {
      targetCtx.fillStyle = currentNonTarget < 0 ? '#6BCB77' : currentNonTarget > 20 ? '#CB6B6B' : '#CB8B6B';
      targetCtx.fillText(`Non-Target: ${currentNonTarget >= 0 ? '+' : ''}${currentNonTarget.toFixed(1)}%`, targetCanvas.width - padding.right - 10, targetCanvas.height - padding.bottom - 8 * scale);
    }

    // Title
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    targetCtx.font = `bold ${12 * scale}px system-ui`;
    targetCtx.textAlign = 'left';
    targetCtx.fillText('Target vs Non-Target Lesions (RECIST)', padding.left, 18 * scale);
  }

  // Helper to draw the currently active plot type
  function drawCurrentPlot() {
    switch (currentPlotType) {
      case 'waterfall': drawWaterfallPlot(); break;
      case 'pfs': drawPFSPlot(); break;
      case 'swimmer': drawSwimmerPlot(); break;
      case 'sld': drawSLDPlot(); break;
      case 'bestResponse': drawBestResponsePlot(); break;
      case 'responseDonut': drawResponseDonut(); break;
      case 'dor': drawDORPlot(); break;
      case 'heatmap': drawHeatmapPlot(); break;
      case 'growthRate': drawGrowthRatePlot(); break;
      case 'targetNonTarget': drawTargetNonTargetPlot(); break;
      default: drawSpiderPlot();
    }
  }

  // Click on plot line to select tumor
  if (plotCanvas) {
    plotCanvas.addEventListener('click', (e) => {
      const rect = plotCanvas.getBoundingClientRect();
      const scaleX = plotCanvas.width / rect.width;
      const scaleY = plotCanvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Plot dimensions (must match drawSpiderPlot)
      const padding = { left: 5, right: 10, top: 10, bottom: 10 };
      const plotWidth = plotCanvas.width - padding.left - padding.right;
      const plotHeight = plotCanvas.height - padding.top - padding.bottom;
      const maxSize = 70;

      // Find closest tumor line
      let closestTumorId = null;
      let closestDistance = 15; // Max distance in pixels to count as a click

      tumorGrowthData.forEach((data, tumorId) => {
        if (data.points.length < 2) return;
        if (data.removed) return; // Can't select removed tumors

        // Check distance to each line segment
        for (let i = 1; i < data.points.length; i++) {
          const p1 = data.points[i - 1];
          const p2 = data.points[i];

          const x1 = padding.left + (p1.month / maxMonths) * plotWidth;
          const y1 = plotCanvas.height - padding.bottom - (p1.size / maxSize) * plotHeight;
          const x2 = padding.left + (p2.month / maxMonths) * plotWidth;
          const y2 = plotCanvas.height - padding.bottom - (p2.size / maxSize) * plotHeight;

          // Distance from point to line segment
          const dist = pointToLineDistance(clickX, clickY, x1, y1, x2, y2);
          if (dist < closestDistance) {
            closestDistance = dist;
            closestTumorId = tumorId;
          }
        }
      });

      // If we found a tumor line, select it
      if (closestTumorId !== null) {
        // Find the tumor with this plotId
        const tumor = droppedTumors.find(t => t.userData.plotId === closestTumorId);
        if (tumor) {
          // Get position for dialog (use click position on screen)
          showInfoDialog(tumor, e.clientX + 10, e.clientY + 10);
        }
      }
    });
  }

  // Helper: distance from point to line segment
  function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Track tumor data over time: { tumorId: [{month, size}, ...] }
  const tumorGrowthData = new Map();
  let tumorIdCounter = 0;

  // Extended clear function for API (clears graph data)
  function clearAllTumorsExtended() {
    tumorGrowthData.clear();
    tumorIdCounter = 0;
  }

  // Line colors for each tumor
  const lineColors = [
    '#8AA5A4', // teal
    '#CC9999', // pink
    '#9966CC', // purple
    '#6699CC', // blue
    '#DAA520', // gold
    '#ff6666', // red (mets)
    '#66ff66', // green
    '#ff66ff', // magenta
  ];

  function initTumorTracking(tumor) {
    if (!tumor.userData.plotId) {
      tumor.userData.plotId = tumorIdCounter++;
      const data = { points: [], removed: false, removedAtMonth: null };

      // Add historical data points if tumor has prior exam data
      const historyMonths = tumor.userData.historyMonths || 0;
      const priorSize = tumor.userData.priorSize;
      const currentSize = tumor.userData.sizeMM || 25;

      if (priorSize && historyMonths > 0) {
        // Add point at prior exam (negative month or 0)
        data.points.push({ month: -historyMonths, size: priorSize, projected: priorSize, isHistory: true });
        // Add point at current exam (month 0)
        data.points.push({ month: 0, size: currentSize, projected: currentSize, isHistory: true });
        console.log(`Added history for tumor: ${priorSize}mm at month -${historyMonths} to ${currentSize}mm at month 0`);
      }

      tumorGrowthData.set(tumor.userData.plotId, data);
    }
  }

  function recordTumorData(tumor, naturalSize) {
    initTumorTracking(tumor);
    const data = tumorGrowthData.get(tumor.userData.plotId);

    // Don't record data for removed tumors
    if (data.removed) return;

    const size = tumor.userData.sizeMM || 25;
    const projectedSize = naturalSize || size; // What size would be without meds

    // Only record if we've moved to a new time point (avoid duplicates)
    if (data.points.length === 0 || Math.abs(data.points[data.points.length - 1].month - currentMonth) > 0.05) {
      data.points.push({ month: currentMonth, size: size, projected: projectedSize });
    } else {
      // Update last point
      data.points[data.points.length - 1].size = size;
      data.points[data.points.length - 1].projected = projectedSize;
    }
  }

  function drawSpiderPlot() {
    if (!plotCtx || !plotCanvas) return;

    const width = plotCanvas.width;
    const height = plotCanvas.height;
    const padding = { left: 5, right: 10, top: 10, bottom: 10 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Calculate time range including history
    let minMonth = 0;
    tumorGrowthData.forEach(data => {
      data.points.forEach(p => {
        if (p.month < minMonth) minMonth = p.month;
      });
    });
    minMonth = Math.floor(minMonth); // Round to whole month
    const totalMonths = maxMonths - minMonth; // Total span from history to simulation end

    // Helper to convert month to X position
    const monthToX = (month) => {
      return padding.left + ((month - minMonth) / totalMonths) * plotWidth;
    };

    // Clear canvas
    plotCtx.clearRect(0, 0, width, height);

    // Draw grid lines
    plotCtx.strokeStyle = 'rgba(95, 123, 122, 0.2)';
    plotCtx.lineWidth = 1;

    // Horizontal grid lines (diameter)
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * plotHeight;
      plotCtx.beginPath();
      plotCtx.moveTo(padding.left, y);
      plotCtx.lineTo(width - padding.right, y);
      plotCtx.stroke();
    }

    // Vertical grid lines (months) - adjusted for history
    const gridStep = totalMonths > 12 ? 3 : (totalMonths > 6 ? 2 : 1);
    for (let m = minMonth; m <= maxMonths; m += gridStep) {
      const x = monthToX(m);
      plotCtx.beginPath();
      plotCtx.moveTo(x, padding.top);
      plotCtx.lineTo(x, height - padding.bottom);
      plotCtx.stroke();

      // Draw month label if at 0 and we have history
      if (m === 0 && minMonth < 0) {
        plotCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        plotCtx.font = '10px system-ui';
        plotCtx.textAlign = 'center';
        plotCtx.fillText('Now', x, height - 2);
      }
    }

    // Draw "HISTORY" label if we have historical data
    if (minMonth < 0) {
      const historyEndX = monthToX(0);
      // Subtle grayish-white with hint of blue, close to background
      plotCtx.fillStyle = 'rgba(200, 205, 215, 0.12)';
      plotCtx.fillRect(padding.left, padding.top, historyEndX - padding.left, plotHeight);

      plotCtx.fillStyle = 'rgba(200, 205, 215, 0.4)';
      plotCtx.font = 'bold 12px system-ui';
      plotCtx.textAlign = 'center';
      plotCtx.fillText('HISTORY', (padding.left + historyEndX) / 2, padding.top + 15);
    }

    // Draw medication start markers (vertical lines with labels)
    for (const [medId, startMonth] of Object.entries(medicationStartTimes)) {
      if (startMonth === null) continue;

      const medX = monthToX(startMonth);
      const color = MEDICATION_COLORS[medId];

      // Draw vertical line
      plotCtx.strokeStyle = color;
      plotCtx.lineWidth = 2;
      plotCtx.setLineDash([6, 3]);
      plotCtx.beginPath();
      plotCtx.moveTo(medX, padding.top);
      plotCtx.lineTo(medX, height - padding.bottom);
      plotCtx.stroke();
      plotCtx.setLineDash([]);

      // Draw marker triangle at top
      plotCtx.fillStyle = color;
      plotCtx.beginPath();
      plotCtx.moveTo(medX, padding.top);
      plotCtx.lineTo(medX - 8, padding.top - 12);
      plotCtx.lineTo(medX + 8, padding.top - 12);
      plotCtx.closePath();
      plotCtx.fill();

      // Draw medication name
      plotCtx.font = 'bold 14px system-ui, sans-serif';
      plotCtx.fillStyle = color;
      plotCtx.textAlign = 'center';
      plotCtx.fillText(MEDICATION_EFFECTS[medId].name, medX, padding.top - 18);
    }

    // Draw current time line
    const timeX = monthToX(currentMonth);
    plotCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    plotCtx.lineWidth = 1;
    plotCtx.setLineDash([4, 4]);
    plotCtx.beginPath();
    plotCtx.moveTo(timeX, padding.top);
    plotCtx.lineTo(timeX, height - padding.bottom);
    plotCtx.stroke();
    plotCtx.setLineDash([]);

    // Max Y value (diameter) - fixed at 70mm cap
    const maxSize = 70;

    // Helper to convert hex color to rgba
    function hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Draw tumor lines (two passes: projections first, then actual)
    let colorIndex = 0;

    // First pass: draw projected trajectories (where tumors would be without meds)
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 2) return;
      if (data.removed) return; // Don't show projection for removed tumors

      // Check if there's any divergence between actual and projected
      const hasDivergence = data.points.some(p =>
        p.projected && Math.abs(p.projected - p.size) > 0.5
      );
      if (!hasDivergence) return;

      // Draw projected line (ghosted gray, dotted)
      plotCtx.strokeStyle = '#555566';
      plotCtx.lineWidth = 2;
      plotCtx.setLineDash([4, 4]);
      plotCtx.beginPath();

      data.points.forEach((point, i) => {
        const projSize = point.projected || point.size;
        const x = monthToX(point.month);
        const y = height - padding.bottom - (projSize / maxSize) * plotHeight;

        if (i === 0) {
          plotCtx.moveTo(x, y);
        } else {
          plotCtx.lineTo(x, y);
        }
      });

      plotCtx.stroke();
      plotCtx.setLineDash([]);
    });

    // Second pass: draw actual tumor lines
    colorIndex = 0;
    tumorGrowthData.forEach((data, tumorId) => {
      if (data.points.length < 2) return;

      const color = lineColors[colorIndex % lineColors.length];
      colorIndex++;

      // Check if tumor was surgically removed
      const isRemoved = data.removed === true;
      // Check if this is historical data (dashed line for history portion)
      const hasHistory = data.points.some(p => p.isHistory);

      if (isRemoved) {
        // Dotted, ghosted gray for surgically removed tumors
        plotCtx.strokeStyle = '#555566';
        plotCtx.lineWidth = 2;
        plotCtx.setLineDash([4, 4]);
      } else {
        plotCtx.strokeStyle = color;
        plotCtx.lineWidth = 2;
        plotCtx.setLineDash([]);
      }

      plotCtx.beginPath();

      data.points.forEach((point, i) => {
        const x = monthToX(point.month);
        const y = height - padding.bottom - (point.size / maxSize) * plotHeight;

        if (i === 0) {
          plotCtx.moveTo(x, y);
        } else {
          // Use dashed line for history portion
          if (point.isHistory && !isRemoved) {
            plotCtx.setLineDash([6, 3]);
          } else if (!isRemoved) {
            plotCtx.setLineDash([]);
          }
          plotCtx.lineTo(x, y);
        }
      });

      plotCtx.stroke();
      plotCtx.setLineDash([]);

      // Draw endpoint dot (smaller and faded if removed)
      if (data.points.length > 0) {
        const lastPoint = data.points[data.points.length - 1];
        const x = monthToX(lastPoint.month);
        const y = height - padding.bottom - (lastPoint.size / maxSize) * plotHeight;

        if (isRemoved) {
          plotCtx.fillStyle = '#555566';
          plotCtx.beginPath();
          plotCtx.arc(x, y, 3, 0, Math.PI * 2);
          plotCtx.fill();
        } else {
          plotCtx.fillStyle = color;
          plotCtx.beginPath();
          plotCtx.arc(x, y, 4, 0, Math.PI * 2);
          plotCtx.fill();
        }
      }
    });
  }

  function simulationTick() {
    if (!isPlaying) return;

    try {
      const now = performance.now() / 1000;
      const delta = now - lastSimTime;
      lastSimTime = now;

      const deltaMonths = delta * playbackSpeed;
      currentMonth = Math.min(currentMonth + deltaMonths, maxMonths);

      updateTimelineUI();
      updateSimulation(deltaMonths);

      if (currentMonth >= maxMonths) {
        isPlaying = false;
        if (playPauseBtn) playPauseBtn.textContent = '▶';
        clearMetNotifications();

        // Trigger timeline end callback for final state determination
        if (onTimelineEndCallback) {
          onTimelineEndCallback();
        }
      }
    } catch (err) {
      console.error('Simulation error:', err);
      isPlaying = false;
    }
  }

  // Start simulation function (can be called externally via API)
  function startSimulationInternal() {
    if (isPlaying) return; // Already playing

    isPlaying = true;
    lastSimTime = performance.now() / 1000;

    // Show spider plot
    if (spiderPlot) {
      spiderPlot.classList.add('visible');
    }

    // Reset if at end
    if (currentMonth >= maxMonths) {
      currentMonth = 0;
    }
  }

  // Play/pause button (may not exist in new UI)
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playPauseBtn.textContent = isPlaying ? '⏸' : '▶';

      // Show/hide spider plot
      if (spiderPlot) {
        if (isPlaying) {
          spiderPlot.classList.add('visible');
        }
        // Don't hide on pause, only when reset
      }

      if (isPlaying) {
        lastSimTime = performance.now() / 1000;
        // Reset if at end
        if (currentMonth >= maxMonths) {
          currentMonth = 0;
          // Reset tumor sizes and growth profiles (skip injuries - managed by index.html)
          droppedTumors.forEach(tumor => {
            if (tumor.userData.isInjury) return; // Don't reset injuries
            if (tumorInitialSizes.has(tumor)) {
              tumor.scale.setScalar(tumorInitialSizes.get(tumor));
            }
            // Reset size data
            tumor.userData.sizeMM = tumor.userData.initialSizeMM || 25;
            // Reset growth profile so it gets reassigned
            tumor.userData.growthProfile = null;
            tumor.userData.hasSpiked = false;
          });
          // Remove metastases
          metastases.forEach(met => {
            if (met.parent) met.parent.remove(met);
            const idx = droppedTumors.indexOf(met);
            if (idx > -1) droppedTumors.splice(idx, 1);
          });
          metastases.length = 0;
          // Clear met notifications
          clearMetNotifications();

          // Clear spider plot data
          tumorGrowthData.clear();
          tumorIdCounter = 0;
          if (plotCtx && plotCanvas) {
            plotCtx.clearRect(0, 0, plotCanvas.width, plotCanvas.height);
          }

          // Reset medication start times (but keep active state)
          for (const medId of Object.keys(medicationStartTimes)) {
            if (activeMedications[medId]) {
              medicationStartTimes[medId] = 0; // Reset to beginning
            }
          }
        }

        // Initialize tracking for existing tumors
        droppedTumors.forEach(tumor => {
          initTumorTracking(tumor);
          recordTumorData(tumor);
        });
      }
    });
  }

  // Reset button
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Stop playback
      isPlaying = false;
      if (playPauseBtn) playPauseBtn.textContent = '▶';

      // Reset time
      currentMonth = 0;
      updateTimelineUI();

      // Clear metastases
      metastases.forEach(met => {
        if (met.parent) met.parent.remove(met);
        const idx = droppedTumors.indexOf(met);
        if (idx > -1) droppedTumors.splice(idx, 1);
      });
      metastases.length = 0;

      // Clear met notifications
      clearMetNotifications();

      // Clear spider plot data
      tumorGrowthData.clear();
      tumorIdCounter = 0;
      if (plotCtx && plotCanvas) {
        plotCtx.clearRect(0, 0, plotCanvas.width, plotCanvas.height);
      }

      // Reset medications to off
      resetMedications();

      // Hide spider plot
      if (spiderPlot) {
        spiderPlot.classList.remove('visible');
      }

      // Restore ALL tumors from examHistory (including surgically removed ones)
      const subject = subjects.find(s => s.id === currentSubjectId);
      if (subject) {
        // Clear existing tumors completely
        droppedTumors.forEach(tumor => {
          if (tumor.parent) tumor.parent.remove(tumor);
        });
        droppedTumors.length = 0;
        tumorInitialSizes.clear();

        // Restore from exam history
        restoreTumorsFromExamHistory(subject);
      } else {
        // No subject - just reset existing tumor sizes (skip injuries - managed by index.html)
        droppedTumors.forEach(tumor => {
          if (tumor.userData.isInjury) return; // Don't reset injuries
          if (tumorInitialSizes.has(tumor)) {
            tumor.scale.setScalar(tumorInitialSizes.get(tumor));
          }
          tumor.userData.sizeMM = tumor.userData.initialSizeMM || 25;
          tumor.userData.growthProfile = null;
          tumor.userData.hasSpiked = false;
          tumor.userData.medResponse = null;
          tumor.userData.shrinkRate = null;
          tumor.userData.plotId = null;
        });
      }

      // Re-initialize tumor tracking for all tumors
      droppedTumors.forEach(tumor => {
        initTumorTracking(tumor);
        recordTumorData(tumor);
      });

      // Update tumor burden display
      if (typeof updateTumorBurden === 'function') updateTumorBurden();

      console.log('Simulation reset');
    });
  }

  // Timeline scrubbing
  let isDraggingTimeline = false;

  function updateTimelineFromMouse(e) {
    if (!timelineBar) return;
    const rect = timelineBar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    currentMonth = percent * maxMonths;
    updateTimelineUI();
  }

  if (timelineBar) {
    timelineBar.addEventListener('mousedown', (e) => {
      isDraggingTimeline = true;
      isPlaying = false;
      playPauseBtn.textContent = '▶';
      updateTimelineFromMouse(e);
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (isDraggingTimeline) {
      updateTimelineFromMouse(e);
    }
  });

  document.addEventListener('mouseup', () => {
    isDraggingTimeline = false;
  });

  // ============================================
  // RADIOLOGY REPORT OCR & PARSING
  // ============================================

  const reportUpload = document.getElementById('report-upload');
  const uploadStatus = document.getElementById('upload-status');

  // Region name mapping (from report text to our region names)
  const REGION_ALIASES = {
    'brain': 'Brain',
    'cerebral': 'Brain',
    'cranial': 'Brain',
    'head': 'Brain',
    'frontal': 'Brain',
    'parietal': 'Brain',
    'temporal': 'Brain',
    'occipital': 'Brain',
    'cerebellar': 'Brain',
    'cerebellum': 'Brain',
    'intracranial': 'Brain',
    'parenchyma': 'Brain',
    'lung': 'Lungs',
    'lungs': 'Lungs',
    'pulmonary': 'Lungs',
    'lobe': 'Lungs',
    'upper lobe': 'Lungs',
    'lower lobe': 'Lungs',
    'middle lobe': 'Lungs',
    'left lung': 'Lungs (Left)',
    'right lung': 'Lungs (Right)',
    'left upper lobe': 'Lungs (Left)',
    'left lower lobe': 'Lungs (Left)',
    'right upper lobe': 'Lungs (Right)',
    'right middle lobe': 'Lungs (Right)',
    'right lower lobe': 'Lungs (Right)',
    'liver': 'Liver',
    'hepatic': 'Liver',
    'stomach': 'Stomach',
    'gastric': 'Stomach',
    'breast': 'Breast',
    'mammary': 'Breast',
    'left breast': 'Breast (Left)',
    'right breast': 'Breast (Right)'
  };

  // Get approximate position for a region
  function getRegionPosition(regionName) {
    for (const region of BODY_REGIONS) {
      if (region.name === regionName || region.name.startsWith(regionName)) {
        return {
          x: (region.xMin + region.xMax) / 2,
          y: (region.yMin + region.yMax) / 2,
          z: 0.03
        };
      }
    }
    // Default to center of torso (calibrated for MedicalHuman_03.fbx)
    return { x: 0, y: 45, z: 0.03 };
  }

  // Parse tumor info from OCR text
  function parseTumorInfo(text) {
    const tumors = [];
    const lowerText = text.toLowerCase();

    // Helper to find region from surrounding text
    function findRegionInContext(contextText) {
      const lower = contextText.toLowerCase();
      // Check longer aliases first to avoid partial matches
      const sortedAliases = Object.entries(REGION_ALIASES).sort((a, b) => b[0].length - a[0].length);
      for (const [alias, regionName] of sortedAliases) {
        if (lower.includes(alias)) {
          return regionName;
        }
      }
      return 'Other';
    }

    // Helper to extract size and add tumor
    function addTumor(sizeStr, unit, contextText, rawMatch) {
      let size = parseFloat(sizeStr);
      if (unit.toLowerCase() === 'cm') size *= 10;
      size = Math.max(1, Math.min(70, Math.round(size)));

      const region = findRegionInContext(contextText);

      // Look for prior size in context
      // Patterns: "previously X cm", "prior: X mm", "from X cm", "compared to X cm"
      let priorSize = null;
      const priorPatterns = [
        /(?:previously|prior|was|from|compared\s+to)\s*[:\s]*(\d+\.?\d*)\s*(cm|mm)/i,
        /\((?:previously|prior|was)\s*(\d+\.?\d*)\s*(cm|mm)\)/i,
        /prior[:\s]+(\d+\.?\d*)\s*(cm|mm)/i
      ];
      for (const pattern of priorPatterns) {
        const priorMatch = contextText.match(pattern);
        if (priorMatch) {
          let ps = parseFloat(priorMatch[1]);
          if (priorMatch[2].toLowerCase() === 'cm') ps *= 10;
          priorSize = Math.max(1, Math.min(70, Math.round(ps)));
          console.log('Found prior tumor size:', priorSize, 'mm for current size:', size, 'mm');
          break;
        }
      }

      // Avoid duplicates (same size and region)
      const isDupe = tumors.some(t => t.size === size && t.region === region);
      if (!isDupe) {
        tumors.push({ size, region, raw: rawMatch, priorSize });
      }
    }

    // Pattern 1: "X.X cm lesion/mass" or "X.X x Y.Y cm lesion"
    // e.g., "2.4 x 2.1 cm (previously 1.8 cm)" - take first measurement
    const pattern1 = /(\d+\.?\d*)\s*(?:x\s*\d+\.?\d*\s*)?(cm|mm)(?:\s*\([^)]*\))?\s*(?:enhancing\s+)?(?:lesion|mass|tumor|nodule|met|metastasis|carcinoma|foci|focus)/gi;
    let match;
    while ((match = pattern1.exec(lowerText)) !== null) {
      // Get context: 100 chars before and after
      const start = Math.max(0, match.index - 100);
      const end = Math.min(lowerText.length, match.index + match[0].length + 100);
      const context = lowerText.substring(start, end);
      addTumor(match[1], match[2], context, match[0]);
    }

    // Pattern 2: "lesion measures X.X cm" or "lesion measuring X.X cm"
    const pattern2 = /(?:lesion|mass|tumor|nodule|met|metastasis)(?:\s+\w+){0,5}?\s+(?:measures|measuring)\s+(\d+\.?\d*)\s*(?:x\s*\d+\.?\d*\s*)?(cm|mm)/gi;
    while ((match = pattern2.exec(lowerText)) !== null) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(lowerText.length, match.index + match[0].length + 100);
      const context = lowerText.substring(start, end);
      addTumor(match[1], match[2], context, match[0]);
    }

    // Pattern 3: "new X.X cm lesion" or "a X.X cm enhancing lesion"
    const pattern3 = /(?:new|a|dominant|additional)\s+(\d+\.?\d*)\s*(cm|mm)\s+(?:enhancing\s+)?(?:lesion|mass|tumor|nodule|met|metastasis)/gi;
    while ((match = pattern3.exec(lowerText)) !== null) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(lowerText.length, match.index + match[0].length + 100);
      const context = lowerText.substring(start, end);
      addTumor(match[1], match[2], context, match[0]);
    }

    // Pattern 4: Look for sizes in FINDINGS or IMPRESSION sections
    const findingsMatch = lowerText.match(/findings:[\s\S]*?(?=impression:|$)/i);
    const impressionMatch = lowerText.match(/impression:[\s\S]*/i);
    const relevantText = (findingsMatch ? findingsMatch[0] : '') + (impressionMatch ? impressionMatch[0] : '');

    if (relevantText && tumors.length === 0) {
      // More general pattern for any measurement near lesion keywords
      const pattern4 = /(\d+\.?\d*)\s*(cm|mm)/gi;
      while ((match = pattern4.exec(relevantText)) !== null) {
        // Check if lesion/mass/tumor is within 50 chars
        const start = Math.max(0, match.index - 50);
        const end = Math.min(relevantText.length, match.index + match[0].length + 50);
        const context = relevantText.substring(start, end);
        if (/lesion|mass|tumor|nodule|met|foci|focus/i.test(context)) {
          addTumor(match[1], match[2], context, match[0]);
        }
      }
    }

    console.log('Tumor parsing found:', tumors);
    return tumors;
  }

  // Parse PD-L1 biomarker info from OCR text
  function parsePDL1Info(text) {
    const lowerText = text.toLowerCase();

    // Pattern 1: "PD-L1 TPS: XX%" or "PD-L1: XX%" or "PD-L1 score: XX%"
    const tpsMatch = text.match(/pd-?l1\s*(?:tps|score|expression)?\s*[:\s]*(\d+)\s*%/i);
    if (tpsMatch) {
      const score = parseInt(tpsMatch[1]);
      const pdl1 = score >= 50 ? 'high' : score >= 1 ? 'low' : 'negative';
      console.log('PD-L1 parsed from TPS score:', score, '%', '->', pdl1);
      return { pdl1, pdl1Score: score };
    }

    // Pattern 2: "PD-L1 positive" or "PD-L1 negative" with qualifiers
    if (/pd-?l1\s*(?:is\s+)?(?:strongly\s+)?positive/i.test(text)) {
      console.log('PD-L1 parsed: strongly positive -> high');
      return { pdl1: 'high', pdl1Score: null };
    }
    if (/pd-?l1\s*(?:is\s+)?(?:weakly\s+)?positive/i.test(text)) {
      console.log('PD-L1 parsed: weakly positive -> low');
      return { pdl1: 'low', pdl1Score: null };
    }
    if (/pd-?l1\s*(?:is\s+)?negative/i.test(text)) {
      console.log('PD-L1 parsed: negative');
      return { pdl1: 'negative', pdl1Score: null };
    }

    // Pattern 3: "high PD-L1 expression" or "low PD-L1"
    if (/high\s+pd-?l1/i.test(text)) {
      console.log('PD-L1 parsed: high expression');
      return { pdl1: 'high', pdl1Score: null };
    }
    if (/low\s+pd-?l1/i.test(text)) {
      console.log('PD-L1 parsed: low expression');
      return { pdl1: 'low', pdl1Score: null };
    }

    // Pattern 4: Check for specific percentage ranges mentioned
    const rangeMatch = text.match(/pd-?l1\s*[^.]*?(\d+)\s*-\s*(\d+)\s*%/i);
    if (rangeMatch) {
      const midpoint = (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
      const pdl1 = midpoint >= 50 ? 'high' : midpoint >= 1 ? 'low' : 'negative';
      console.log('PD-L1 parsed from range:', rangeMatch[1], '-', rangeMatch[2], '%', '->', pdl1);
      return { pdl1, pdl1Score: Math.round(midpoint) };
    }

    return { pdl1: null, pdl1Score: null };
  }

  // Parse patient info from OCR text
  function parsePatientInfo(text) {
    const info = {
      name: null,
      dob: null,
      examDate: null,
      priorExamDate: null,  // Date of previous/comparison scan
      scanType: null,
      hospital: null,
      physician: null
    };

    // Normalize text - collapse multiple spaces
    const normalizedText = text.replace(/\s+/g, ' ');
    const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l);

    console.log('=== OCR PARSING DEBUG ===');
    console.log('Raw text (first 800 chars):', text.substring(0, 800));
    console.log('OCR Lines:', lines);

    // Hospital - check first few lines for institution name
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 5 && line.length < 60 &&
          /medical|hospital|clinic|health|center|institute|university/i.test(line) &&
          !/department|radiology|patient/i.test(line)) {
        info.hospital = line;
        break;
      }
      if (!info.hospital && line.length > 10 && line === line.toUpperCase() && /^[A-Z\s]+$/.test(line)) {
        info.hospital = line;
      }
    }

    // Find ALL dates in the document first
    const allDates = [];
    const dateRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/g;
    let dateMatch;
    while ((dateMatch = dateRegex.exec(text)) !== null) {
      allDates.push({
        date: dateMatch[1],
        index: dateMatch.index,
        context: text.substring(Math.max(0, dateMatch.index - 30), dateMatch.index + dateMatch[0].length + 10)
      });
    }
    console.log('Found dates:', allDates);

    // Helper to check if a date could be a valid DOB (year before 2015)
    function isValidDOB(dateStr) {
      const yearMatch = dateStr.match(/(\d{4})$|^(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1] || yearMatch[2]);
        return year < 2015; // DOB should be before 2015
      }
      // For 2-digit years like 01/15/65
      const twoDigitYear = dateStr.match(/[\/-](\d{2})$/);
      if (twoDigitYear) {
        const yr = parseInt(twoDigitYear[1]);
        // Years 20-29 are likely 2020s (exam dates), not 1920s
        // Years 00-19 could be 2000s (too young) or exam dates
        // Years 30-99 are likely 1930-1999 (valid DOBs)
        return yr >= 30 && yr <= 99;
      }
      return true;
    }

    // Associate dates with their labels
    for (const d of allDates) {
      const ctx = d.context.toLowerCase();
      if (!info.dob && (ctx.includes('dob') || ctx.includes('birth') || ctx.includes('d.o.b'))) {
        if (isValidDOB(d.date)) {
          info.dob = d.date;
        }
      } else if (!info.priorExamDate && (ctx.includes('comparison') || ctx.includes('prior') || ctx.includes('previous') || ctx.includes('compared'))) {
        // This is a prior/comparison exam date
        info.priorExamDate = d.date;
        console.log('Found prior exam date:', d.date, 'context:', ctx);
      } else if (!info.examDate && (ctx.includes('exam') || ctx.includes('study') || ctx.includes('scan') || ctx.includes('signed'))) {
        info.examDate = d.date;
      }
    }

    // Also look for "Comparison:" line pattern
    if (!info.priorExamDate) {
      const comparisonMatch = normalizedText.match(/comparison[:\s]+(?:[A-Za-z\s]+)?(?:dated?\s*)?(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
      if (comparisonMatch) {
        info.priorExamDate = comparisonMatch[1];
        console.log('Found prior exam date via Comparison pattern:', comparisonMatch[1]);
      }
    }

    // If we have dates but couldn't match them, use position-based assignment
    // First date after DOB label is DOB, first date after Exam Date label is exam date
    if (!info.dob || !info.examDate) {
      const dobLabelIdx = text.toLowerCase().indexOf('dob');
      const examDateLabelIdx = text.toLowerCase().search(/exam\s*date/);

      // Extend search range for table OCR
      for (const d of allDates) {
        if (!info.dob && dobLabelIdx >= 0 && d.index > dobLabelIdx && d.index < dobLabelIdx + 100 && isValidDOB(d.date)) {
          info.dob = d.date;
        }
        if (!info.examDate && examDateLabelIdx >= 0 && d.index > examDateLabelIdx && d.index < examDateLabelIdx + 100) {
          info.examDate = d.date;
        }
      }
    }

    // Final fallback: if we found 2+ dates and labels exist, assign by label position
    if ((!info.dob || !info.examDate) && allDates.length >= 2) {
      const dobLabelIdx = text.toLowerCase().indexOf('dob');
      const examDateLabelIdx = text.toLowerCase().search(/exam\s*date/);

      // Sort dates by position
      const sortedDates = [...allDates].sort((a, b) => a.index - b.index);

      // If DOB label comes before Exam Date label, first date is DOB, second is Exam
      if (dobLabelIdx >= 0 && examDateLabelIdx >= 0) {
        if (dobLabelIdx < examDateLabelIdx) {
          if (!info.dob && sortedDates[0]?.date && isValidDOB(sortedDates[0].date)) {
            info.dob = sortedDates[0].date;
          }
          if (!info.examDate && sortedDates.length > 1) info.examDate = sortedDates[1]?.date;
        } else {
          if (!info.examDate) info.examDate = sortedDates[0]?.date;
          if (!info.dob && sortedDates.length > 1 && isValidDOB(sortedDates[1].date)) {
            info.dob = sortedDates[1].date;
          }
        }
      }
    }

    // Line-by-line fallback for table OCR where values are on next line
    if (!info.dob || !info.examDate || !info.name) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        const nextLine = lines[i + 1]?.trim();

        // Check for DOB label followed by date on next line
        if (!info.dob && /^dob[:\s]*$/.test(line) && nextLine) {
          const dateMatch = nextLine.match(/^(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
          if (dateMatch && isValidDOB(dateMatch[1])) info.dob = dateMatch[1];
        }

        // Check for Exam Date label followed by date on next line
        if (!info.examDate && /^exam\s*date[:\s]*$/.test(line) && nextLine) {
          const dateMatch = nextLine.match(/^(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
          if (dateMatch) info.examDate = dateMatch[1];
        }

        // Check for Patient Name label followed by name on next line
        if (!info.name && /patient\s*name[:\s]*$/.test(line) && nextLine) {
          if (/^[A-Z][a-z]+(\s+[A-Z][a-zA-Z]+)+$/.test(nextLine) && nextLine.length < 40) {
            info.name = nextLine;
          }
        }
      }
    }

    // Patient name - find "Patient Name" label and grab text after it
    // Try multiple approaches for table OCR

    // Debug: log first 20 lines to see what OCR produces
    console.log('First 20 OCR lines for name search:', lines.slice(0, 20));

    // FIRST: Identify physician/radiologist names to EXCLUDE from patient name search
    const physicianNames = new Set();

    // Find names near "signed by", "radiologist", "MD", "M.D."
    const signedByMatches = text.matchAll(/(?:signed\s*(?:by)?|radiologist)[:\s]*(?:Dr\.?\s*)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi);
    for (const m of signedByMatches) {
      if (m[1]) physicianNames.add(m[1].toLowerCase().trim());
    }

    // Also look for names followed by MD/M.D./DO
    const mdMatches = text.matchAll(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s*,?\s*(?:MD|M\.D\.|DO|D\.O\.)/gi);
    for (const m of mdMatches) {
      if (m[1]) physicianNames.add(m[1].toLowerCase().trim());
    }

    console.log('Identified physician names to exclude:', [...physicianNames]);

    // Helper to check if a name should be excluded (is a physician)
    function isPhysicianName(name) {
      const nameLower = name.toLowerCase().trim();
      for (const pn of physicianNames) {
        if (nameLower.includes(pn) || pn.includes(nameLower)) return true;
      }
      return false;
    }

    // Approach 0: Look for text between "Patient:" and "DOB:" (very common format)
    const patientToDobMatch = normalizedText.match(/patient\s*[:\-]\s*([A-Za-z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z]+)+)\s*(?:DOB|D\.O\.B|Date of Birth)/i);
    let nameMatch = null;
    if (patientToDobMatch) {
      const candidate = patientToDobMatch[1].trim();
      if (!/Radiology|Department|Medical|Center|Hospital/i.test(candidate) && candidate.length < 40) {
        nameMatch = [null, candidate];
        console.log('Found name between Patient: and DOB:', candidate);
      }
    }

    // Approach 1: Same line "Patient Name: John Doe" or "Patient: John Doe"
    if (!nameMatch) {
      const match = normalizedText.match(/patient\s*(?:name)?\s*[:\-]\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/i);
      if (match) {
        // Make sure we didn't capture something like "Radiology Patient"
        const captured = match[1].trim();
        if (!/Radiology|Department|Medical|Center|Hospital/i.test(captured)) {
          nameMatch = match;
          console.log('Found name via Patient/Patient Name label:', captured);
        }
      }
    }

    // Approach 1.5: Line-by-line search for "Patient:" line
    if (!nameMatch) {
      for (const line of lines) {
        const patientLineMatch = line.match(/^patient\s*[:\-]\s*(.+)$/i);
        if (patientLineMatch) {
          const afterPatient = patientLineMatch[1].trim();
          // Extract name (first two capitalized words)
          const nameFromLine = afterPatient.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/);
          if (nameFromLine && !/Radiology|Department|Medical|DOB|MRN/i.test(nameFromLine[1])) {
            nameMatch = [null, nameFromLine[1]];
            console.log('Found name from Patient: line:', nameFromLine[1]);
            break;
          }
        }
      }
    }

    // Approach 2: Look for "LASTNAME, FIRSTNAME" format (common in medical records)
    if (!nameMatch) {
      const lastFirstMatch = normalizedText.match(/([A-Z][a-zA-Z]+)\s*,\s*([A-Z][a-zA-Z]+)/);
      if (lastFirstMatch) {
        const candidate = lastFirstMatch[2] + ' ' + lastFirstMatch[1]; // Convert to First Last
        if (!/Medical|Center|Hospital|Department|Physician|Radiologist/i.test(candidate) &&
            !isPhysicianName(candidate)) {
          nameMatch = [null, candidate];
          console.log('Found name via LAST, FIRST format:', candidate);
        }
      }
    }

    // Approach 2.5: Look for ALL CAPS names (e.g., "JOHN DOE")
    if (!nameMatch) {
      const allCapsMatch = normalizedText.match(/\b([A-Z]{2,15})\s+([A-Z]{2,15})\b/);
      if (allCapsMatch) {
        const first = allCapsMatch[1];
        const last = allCapsMatch[2];
        // Convert to Title Case
        const titleCase = first.charAt(0) + first.slice(1).toLowerCase() + ' ' +
                          last.charAt(0) + last.slice(1).toLowerCase();
        // Exclude common medical/header terms and physician names
        if (!/MEDICAL|CENTER|HOSPITAL|DEPARTMENT|PHYSICIAN|RADIOLOGIST|IMAGING|PATIENT|NAME|DATE|EXAM|CLINICAL|FINDINGS|IMPRESSION|REPORT/i.test(first + ' ' + last) &&
            !isPhysicianName(titleCase)) {
          nameMatch = [null, titleCase];
          console.log('Found name via ALL CAPS format:', titleCase);
        }
      }
    }

    // Approach 3: Look for name pattern near "Patient Name" text
    if (!nameMatch) {
      const patientNameIdx = text.toLowerCase().indexOf('patient name');
      if (patientNameIdx >= 0) {
        // Look for a name-like pattern within 150 chars after (extended range for tables)
        const afterLabel = text.substring(patientNameIdx, patientNameIdx + 150);
        console.log('Text after "Patient Name" label:', afterLabel);
        const nameInContext = afterLabel.match(/(?:name[:\s]*)?([A-Z][a-z]+\s+[A-Z][a-zA-Z]+)/);
        if (nameInContext) {
          nameMatch = nameInContext;
        }
      }
    }

    // Approach 4: Look at lines near "Patient Name" label
    if (!nameMatch) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('patient') && line.includes('name')) {
          // Check this line and next 3 lines for a name
          for (let j = i; j < Math.min(i + 4, lines.length); j++) {
            const checkLine = lines[j].trim();
            // Skip labels
            if (/patient\s*name|dob|exam|mrn|date/i.test(checkLine)) continue;
            // Look for name-like pattern (relaxed: allow some OCR noise)
            const nameParts = checkLine.match(/^([A-Z][a-z]+)\s+([A-Z][a-zA-Z]+)$/);
            if (nameParts && !isPhysicianName(checkLine)) {
              nameMatch = [null, checkLine];
              console.log('Found name near Patient Name label:', checkLine);
              break;
            }
          }
          if (nameMatch) break;
        }
      }
    }

    // Approach 5: Look for lines that are just names (First Last format)
    // But exclude medical titles, credentials, and common non-name lines
    if (!nameMatch) {
      const excludePatterns = /:|DOB|MRN|Date|Exam|Physician|Radiologist|Certified|Board|Signed|Department|Medical|Center|Hospital|IMPRESSION|FINDINGS|CLINICAL|TECHNIQUE|COMPARISON|History|Accession|\d{4}/i;

      for (const line of lines) {
        // Skip lines with labels, numbers, or medical terms
        if (excludePatterns.test(line)) continue;
        // Skip very short or long lines
        if (line.length < 4 || line.length > 35) continue;
        // Check if line looks like a name (2-3 words, capitalized, not all caps)
        const nameLike = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-zA-Z]+){1,2})$/);
        if (nameLike && !isPhysicianName(nameLike[1])) {
          nameMatch = nameLike;
          console.log('Found name via line match:', nameLike[1]);
          break;
        }
      }
    }

    if (nameMatch) {
      info.name = nameMatch[1].trim().replace(/\s+/g, ' ');
    }

    // Approach 6: Simple fallback - look for "First Last" pattern in first half of text
    // This catches names that might be in table cells read separately
    if (!info.name) {
      const firstHalf = text.substring(0, Math.min(text.length / 2, 500));
      const simpleNameMatch = firstHalf.match(/\b([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15})\b/);
      if (simpleNameMatch) {
        const candidate = simpleNameMatch[1];
        // Make sure it's not a medical term or the physician name
        if (!/Certified|Radiologist|Radiology|Medical|Center|Hospital|Department|Physician|Brain|Contrast|Patient/i.test(candidate) &&
            !isPhysicianName(candidate)) {
          info.name = candidate;
          console.log('Found name via simple fallback:', candidate);
        }
      }
    }

    // Approach 7: Look for any two adjacent capitalized words in first 300 chars
    // that aren't excluded terms - most aggressive fallback
    if (!info.name) {
      const firstPart = text.substring(0, 400);
      const wordPairs = firstPart.match(/\b([A-Z][a-z]{2,12})\s+([A-Z][a-z]{2,12})\b/g) || [];
      const excludeWords = /Medical|Center|Hospital|Department|Physician|Radiologist|Radiology|Board|Certified|University|Clinic|Health|Brain|Liver|Contrast|Imaging|Report|Finding|Clinical|History|Exam|Date|Study|Name|Patient/i;

      for (const pair of wordPairs) {
        if (!excludeWords.test(pair) && !isPhysicianName(pair)) {
          info.name = pair;
          console.log('Found name via word pair fallback:', pair);
          break;
        }
      }
    }

    console.log('=== NAME EXTRACTION RESULT ===');
    console.log('Final extracted name:', info.name);
    if (!info.name) {
      console.log('WARNING: Could not extract patient name. This often happens when the name is in a table cell that OCR cannot read properly. You may need to edit the patient name manually.');
    }

    // Final date fallback - if we have dates but couldn't assign them, just use order
    if (allDates.length >= 2 && (!info.dob || !info.examDate)) {
      // Sort by position in document
      const sortedDates = [...allDates].sort((a, b) => a.index - b.index);
      // Only use first date as DOB if it's a valid DOB (not a recent date)
      if (!info.dob && isValidDOB(sortedDates[0].date)) {
        info.dob = sortedDates[0].date;
      }
      if (!info.examDate && sortedDates.length > 1) info.examDate = sortedDates[1].date;
    } else if (allDates.length === 1 && !info.dob && !info.examDate) {
      // Only one date found - try to determine if it's DOB or exam date
      const ctx = allDates[0].context.toLowerCase();
      if ((ctx.includes('dob') || ctx.includes('birth')) && isValidDOB(allDates[0].date)) {
        info.dob = allDates[0].date;
      } else {
        info.examDate = allDates[0].date;
      }
    }

    // Scan type - look for "Exam:" field first
    const examTypeMatch = normalizedText.match(/(?:^|\s)exam\s*[:\-]\s*([A-Za-z][A-Za-z\s\/\-\w]+?)(?:\s+CLINICAL|\s+History|\s{3,}|$)/i);
    if (examTypeMatch) {
      const examText = examTypeMatch[1].trim();
      if (examText.length < 60 && !/date/i.test(examText)) {
        info.scanType = examText;
      }
    }
    // Fallback to detecting scan type from keywords
    if (!info.scanType) {
      if (/\bMRI\b/i.test(text)) info.scanType = 'MRI';
      else if (/\bCT\b/i.test(text) || /\bCAT\s*scan/i.test(text)) info.scanType = 'CT';
      else if (/PET[\-\/]?CT/i.test(text)) info.scanType = 'PET-CT';
      else if (/\bPET\b/i.test(text)) info.scanType = 'PET';
      else if (/X[\-\s]?Ray/i.test(text)) info.scanType = 'X-Ray';
      else if (/ultrasound/i.test(text)) info.scanType = 'Ultrasound';
      else if (/mammogra/i.test(text)) info.scanType = 'Mammogram';
    }

    // Referring Physician - use normalized text
    let physicianMatch = normalizedText.match(/referring\s*physician\s*[:\-]?\s*(?:Dr\.?\s*)?([A-Za-z][A-Za-z\s\.\-']+?)(?:\s+Accession|\s{3,}|$)/i);
    if (physicianMatch) {
      info.physician = physicianMatch[1].trim().replace(/\s+/g, ' ');
    }
    // Also check for "Electronically Signed By" for radiologist
    if (!info.physician) {
      const signedMatch = normalizedText.match(/(?:electronically\s+)?signed\s*(?:by)?\s*[:\-]?\s*(?:Dr\.?\s*)?([A-Za-z][A-Za-z\s\.\-']+?)(?:,?\s*(?:MD|M\.D\.|DO|D\.O\.))?(?:\s+Board|\s{3,}|$)/i);
      if (signedMatch) {
        info.physician = signedMatch[1].trim().replace(/\s+/g, ' ');
      }
    }

    console.log('=== PARSED PATIENT INFO ===');
    console.log('Name:', info.name);
    console.log('DOB:', info.dob);
    console.log('Exam Date:', info.examDate);
    console.log('Scan Type:', info.scanType);
    console.log('Hospital:', info.hospital);
    console.log('Physician:', info.physician);
    console.log('===========================');
    return info;
  }

  // Update patient info panel
  function updatePatientInfoPanel(info) {
    const subjectNameEl = document.getElementById('subject-name');
    const dobEl = document.getElementById('patient-dob');
    const examDateEl = document.getElementById('patient-exam-date');
    const priorExamEl = document.getElementById('patient-prior-exam');
    const priorExamRow = document.getElementById('prior-exam-row');
    const scanTypeEl = document.getElementById('patient-scan-type');
    const hospitalEl = document.getElementById('patient-hospital');
    const physicianEl = document.getElementById('patient-physician');

    // Update subject name if patient name available
    if (subjectNameEl && info.name) {
      subjectNameEl.textContent = info.name;
    }
    if (dobEl) dobEl.textContent = info.dob || '--';
    if (examDateEl) examDateEl.textContent = info.examDate || '--';

    // Show prior exam row only if we have a prior exam date
    if (priorExamRow && priorExamEl) {
      if (info.priorExamDate) {
        priorExamRow.style.display = 'flex';
        priorExamEl.textContent = info.priorExamDate;
      } else {
        priorExamRow.style.display = 'none';
        priorExamEl.textContent = '--';
      }
    }

    if (scanTypeEl) scanTypeEl.textContent = info.scanType || '--';
    if (hospitalEl) hospitalEl.textContent = info.hospital || '--';
    if (physicianEl) physicianEl.textContent = info.physician || '--';
  }

  // Clear patient info panel (but keep subject name)
  function clearPatientInfoPanel() {
    const dobEl = document.getElementById('patient-dob');
    const examDateEl = document.getElementById('patient-exam-date');
    const scanTypeEl = document.getElementById('patient-scan-type');
    const hospitalEl = document.getElementById('patient-hospital');
    const physicianEl = document.getElementById('patient-physician');

    if (dobEl) dobEl.textContent = '--';
    if (examDateEl) examDateEl.textContent = '--';
    if (scanTypeEl) scanTypeEl.textContent = '--';
    if (hospitalEl) hospitalEl.textContent = '--';
    if (physicianEl) physicianEl.textContent = '--';
  }

  // Create tumor at specific position with size
  function createTumorAtPosition(sizeMM, regionName) {
    if (!humanBodyMesh) return;

    // Handle generic "Lungs" by assigning to left or right
    let targetRegion = regionName;
    if (regionName === 'Lungs') {
      targetRegion = Math.random() < 0.5 ? 'Lungs (Left)' : 'Lungs (Right)';
    }

    // Use mesh-aware positioning for all organs
    const organRegions = ['Brain', 'Lungs (Left)', 'Lungs (Right)', 'Liver', 'Stomach'];
    let pos;

    if (organRegions.includes(targetRegion)) {
      const basePos = getRegionPosition(targetRegion);
      const randomDropPoint = new THREE.Vector3(
        basePos.x + (Math.random() - 0.5) * 0.06,
        basePos.y + (Math.random() - 0.5) * 0.06,
        basePos.z
      );
      const organPos = getPositionInsideOrgan(randomDropPoint, targetRegion);
      pos = { x: organPos.x, y: organPos.y, z: organPos.z };
    } else {
      pos = getRegionPosition(regionName);
    }
    const region = BODY_REGIONS.find(r => r.name === regionName) || { name: regionName, color: 0x2E5470 };

    // Create tumor geometry
    const tumorGeo = createLumpySphere(
      CONFIG.tumor.size,
      CONFIG.tumor.segments,
      CONFIG.tumor.lumpiness
    );

    // Create simple material (color set by temperature system)
    const solidMat = new THREE.MeshBasicMaterial({
      color: 0xFFAA33, // Default warm, will be updated
      depthTest: false
    });

    const tumor = new THREE.Group();
    const mesh = new THREE.Mesh(tumorGeo, solidMat);
    mesh.name = 'tumorMesh';
    mesh.renderOrder = 999;
    mesh.onBeforeRender = function(renderer) {
      renderer.clearDepth();
    };
    tumor.add(mesh);

    // Position and scale
    tumor.position.set(pos.x, pos.y, pos.z);
    const targetScale = (sizeMM * MM_TO_SCALE) / CONFIG.tumor.size;
    tumor.scale.setScalar(targetScale);

    // Store data
    tumor.userData.region = regionName;
    tumor.userData.sizeMM = sizeMM;
    // Temperature will be set later based on PD-L1 or defaults to warm
    tumor.userData.temperature = 'warm';

    // Apply temperature visuals
    applyTemperatureVisuals(tumor);

    humanBodyMesh.add(tumor);
    droppedTumors.push(tumor);

    return tumor;
  }

  // Handle file upload
  const addReportBtn = document.getElementById('add-report-btn');
  const uploadBtn = document.getElementById('upload-btn');

  // Regular upload button - creates new patient
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      window.addReportToExistingPatient = false;
    });
  }

  // "Add Report to Patient" button - triggers file upload with flag set
  if (addReportBtn) {
    addReportBtn.addEventListener('click', () => {
      window.addReportToExistingPatient = true;
      reportUpload?.click();
    });
  }

  if (reportUpload) {
    reportUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Show status
      uploadStatus.textContent = 'Processing image...';
      uploadStatus.className = 'visible';

      try {
        // Run OCR
        uploadStatus.textContent = 'Running OCR (this may take a moment)...';

        const result = await Tesseract.recognize(file, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              uploadStatus.textContent = `OCR: ${Math.round(m.progress * 100)}%`;
            }
          },
          // Improve table reading
          tessedit_pageseg_mode: '6', // Sparse text mode - better for tables
          preserve_interword_spaces: '1'
        });

        const text = result.data.text;
        console.log('=== OCR RESULT ===');
        console.log(text);
        console.log('=== END OCR ===');

        // Parse patient info
        const patientInfo = parsePatientInfo(text);
        console.log('Parsed patient info:', JSON.stringify(patientInfo, null, 2));

        // Parse tumor info
        const tumors = parseTumorInfo(text);
        console.log('Parsed tumors:', tumors);

        // Parse PD-L1 biomarker info (applies to all tumors from this report)
        const pdl1Info = parsePDL1Info(text);
        console.log('Parsed PD-L1 info:', pdl1Info);

        // Check if we should add to existing patient or create new
        // Add to existing if: checkbox is checked OR patient name matches current
        const addToExisting = window.addReportToExistingPatient ||
          (currentSubjectId && patientInfo.name && subjects.find(s => s.id === currentSubjectId)?.name === patientInfo.name);

        let statusMsg = '';

        if (addToExisting && currentSubjectId) {
          // Add report to existing patient
          const subject = addReportToCurrentPatient(patientInfo, tumors, pdl1Info);
          updatePatientInfoPanel(patientInfo);

          // Clear existing tumors - follow-up report represents current state
          clearAllTumors();

          // Create tumors from follow-up report with history data
          tumors.forEach(t => {
            const tumor = createTumorAtPosition(t.size, t.region);
            if (tumor) {
              // Set history from prior size in report or from previous exam
              if (t.priorSize) {
                tumor.userData.priorSize = t.priorSize;
              }
              // Calculate months since last exam
              const historyMonths = subject?.examHistory?.[subject.examHistory.length - 1]?.historyMonths || 0;
              if (historyMonths > 0) {
                tumor.userData.historyMonths = historyMonths;
                // If no prior size from report text, estimate from previous exam's tumor data
                if (!tumor.userData.priorSize && subject.examHistory.length > 1) {
                  const prevExam = subject.examHistory[subject.examHistory.length - 2];
                  const matchingTumor = prevExam?.tumors?.find(pt => pt.region === t.region);
                  if (matchingTumor) {
                    tumor.userData.priorSize = matchingTumor.size;
                  }
                }
              }
              // Apply PD-L1 biomarker from report
              if (pdl1Info.pdl1) {
                tumor.userData.pdl1 = pdl1Info.pdl1;
                tumor.userData.pdl1Score = pdl1Info.pdl1Score;
                // Derive temperature from PD-L1 and apply visuals
                tumor.userData.temperature = getTemperatureFromPDL1(pdl1Info.pdl1);
                applyTemperatureVisuals(tumor);
              }
            }
          });

          // Auto-save
          if (window.JourneySaveSubject) {
            window.JourneySaveSubject();
          }

          // Initialize tracking for new tumors and refresh chart if visible
          droppedTumors.forEach(tumor => {
            if (!tumor.userData.plotId) {
              initTumorTracking(tumor);
              recordTumorData(tumor);
            }
          });

          // Refresh plot if it's open
          if (spiderPlot && spiderPlot.classList.contains('visible')) {
            drawCurrentPlot();
          }

          statusMsg = `Added report to "${subjects.find(s => s.id === currentSubjectId)?.name}" - ${tumors.length} tumor(s)`;
          window.addReportToExistingPatient = false;  // Reset flag
        } else {
          // Create new patient
          let newSubjectName = patientInfo.name;
          if (!newSubjectName) {
            // Generate unique "Patient X" name
            const baseName = 'Patient';
            const existingPatientNames = subjects.filter(s => s.name.startsWith(baseName)).map(s => s.name);
            let num = 1;
            while (existingPatientNames.includes(num === 1 ? baseName : `${baseName} ${num}`)) {
              num++;
            }
            newSubjectName = num === 1 ? baseName : `${baseName} ${num}`;
          }

          const subject = createNewSubjectFromReport(newSubjectName, patientInfo, tumors, pdl1Info);
          updatePatientInfoPanel(patientInfo);

          if (tumors.length === 0) {
            statusMsg = `Created "${newSubjectName}" - no tumors found in report.`;
          } else {
            // Create tumors with history data and PD-L1 biomarker
            tumors.forEach(t => {
              const tumor = createTumorAtPosition(t.size, t.region);
              if (tumor) {
                if (t.priorSize) {
                  tumor.userData.priorSize = t.priorSize;
                  tumor.userData.historyMonths = subject?.examHistory?.[0]?.historyMonths || 0;
                }
                // Apply PD-L1 biomarker from report
                if (pdl1Info.pdl1) {
                  tumor.userData.pdl1 = pdl1Info.pdl1;
                  tumor.userData.pdl1Score = pdl1Info.pdl1Score;
                  // Derive temperature from PD-L1 and apply visuals
                  tumor.userData.temperature = getTemperatureFromPDL1(pdl1Info.pdl1);
                  applyTemperatureVisuals(tumor);
                }
              }
            });

            // Auto-save to current subject
            if (window.JourneySaveSubject) {
              window.JourneySaveSubject();
            }

            statusMsg = `Created "${newSubjectName}" with ${tumors.length} tumor(s)`;
            if (patientInfo.priorExamDate) {
              const months = subject?.examHistory?.[0]?.historyMonths || 0;
              if (months > 0) {
                statusMsg += ` (${months} months history)`;
              }
            }
          }
        }

        // Update medication panel for new patient's tumor types
        if (typeof updateMedicationPanel === 'function') {
          updateMedicationPanel();
        }

        uploadStatus.textContent = statusMsg;
        uploadStatus.className = tumors.length > 0 ? 'visible success' : 'visible';
        setTimeout(() => {
          uploadStatus.className = '';
        }, 4000);
      } catch (err) {
        console.error('OCR Error:', err);
        uploadStatus.textContent = 'Error processing image';
        uploadStatus.className = 'visible error';
      }

      // Reset file input
      reportUpload.value = '';
    });
  }

  // ============================================
  // SUBJECT MANAGEMENT
  // ============================================

  const STORAGE_KEY = 'journey_subjects';
  let currentSubjectId = null;
  let subjects = [];

  const patientInfoPanel = document.getElementById('patient-info-panel');
  const subjectName = document.getElementById('subject-name');
  const subjectMenu = document.getElementById('subject-menu');
  const subjectList = document.getElementById('subject-list');
  const createSubjectBtn = document.getElementById('create-subject-btn');
  const patientHeaderRow = document.querySelector('.patient-header-row');
  const deletePatientBtn = document.getElementById('delete-patient-btn');

  // Load subjects from localStorage
  function loadSubjectsFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        subjects = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load subjects:', e);
      subjects = [];
    }
  }

  // Save subjects to localStorage
  function saveSubjectsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    } catch (e) {
      console.error('Failed to save subjects:', e);
    }
  }

  // Generate unique ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Create new subject
  function createNewSubject() {
    const id = generateId();
    const name = `Subject ${subjects.length + 1}`;
    const subject = {
      id,
      name,
      tumors: [],
      createdAt: Date.now()
    };
    subjects.push(subject);
    saveSubjectsToStorage();
    loadSubject(id);
    updateSubjectMenu();
  }

  // Create new subject from radiology report
  function createNewSubjectFromReport(name, patientInfo, tumorData = [], pdl1Info = null) {
    const id = generateId();

    // Calculate months of history if we have prior exam date
    let historyMonths = 0;
    if (patientInfo.priorExamDate && patientInfo.examDate) {
      historyMonths = calculateMonthsBetweenDates(patientInfo.priorExamDate, patientInfo.examDate);
      console.log('Calculated history months:', historyMonths);
    }

    const subject = {
      id,
      name: name || `Subject ${subjects.length + 1}`,
      tumors: [],
      patientInfo: patientInfo || {},
      examHistory: [{
        date: patientInfo.examDate || new Date().toLocaleDateString(),
        tumors: tumorData.map(t => ({
          size: t.size,
          region: t.region,
          priorSize: t.priorSize,
          pdl1: pdl1Info?.pdl1 || null,
          pdl1Score: pdl1Info?.pdl1Score || null
        })),
        historyMonths: historyMonths  // Months since prior exam
      }],
      createdAt: Date.now()
    };
    subjects.push(subject);
    saveSubjectsToStorage();

    // Clear existing tumors and load new subject
    clearAllTumors();
    resetMedications();
    currentSubjectId = id;
    subjectName.textContent = subject.name;
    updateSubjectMenu();

    return subject;
  }

  // Calculate months between two date strings
  function calculateMonthsBetweenDates(dateStr1, dateStr2) {
    try {
      const parseDate = (str) => {
        // Handle formats: MM/DD/YYYY, MM-DD-YYYY, MM/DD/YY
        const parts = str.split(/[\/-]/);
        if (parts.length !== 3) return null;
        let [m, d, y] = parts.map(p => parseInt(p));
        if (y < 100) y += y > 50 ? 1900 : 2000;  // 2-digit year
        return new Date(y, m - 1, d);
      };

      const d1 = parseDate(dateStr1);
      const d2 = parseDate(dateStr2);
      if (!d1 || !d2) return 0;

      const diffTime = Math.abs(d2 - d1);
      const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
      return Math.round(diffMonths * 10) / 10;  // Round to 1 decimal
    } catch (e) {
      console.error('Date parsing error:', e);
      return 0;
    }
  }

  // Add report to existing patient
  function addReportToCurrentPatient(patientInfo, tumorData = [], pdl1Info = null) {
    if (!currentSubjectId) return;

    const subject = subjects.find(s => s.id === currentSubjectId);
    if (!subject) return;

    // Calculate months since last exam
    let historyMonths = 0;
    const lastExam = subject.examHistory?.[subject.examHistory.length - 1];
    if (lastExam?.date && patientInfo.examDate) {
      historyMonths = calculateMonthsBetweenDates(lastExam.date, patientInfo.examDate);
    }

    // Add new exam to history
    if (!subject.examHistory) subject.examHistory = [];
    subject.examHistory.push({
      date: patientInfo.examDate || new Date().toLocaleDateString(),
      tumors: tumorData.map(t => ({
        size: t.size,
        region: t.region,
        priorSize: t.priorSize,
        pdl1: pdl1Info?.pdl1 || null,
        pdl1Score: pdl1Info?.pdl1Score || null
      })),
      historyMonths: historyMonths
    });

    // Update patient info with latest
    subject.patientInfo = { ...subject.patientInfo, ...patientInfo };

    saveSubjectsToStorage();
    console.log('Added report to patient, exam history now has', subject.examHistory.length, 'entries');

    return subject;
  }

  // Save current subject's tumor data
  function saveCurrentSubject() {
    if (!currentSubjectId) return;

    const subject = subjects.find(s => s.id === currentSubjectId);
    if (!subject) return;

    // Save tumor data (excluding metastases - they're generated during simulation)
    subject.tumors = droppedTumors
      .filter(t => !t.userData.isMetastasis)
      .map(tumor => {
        const worldPos = new THREE.Vector3();
        tumor.getWorldPosition(worldPos);
        return {
          region: tumor.userData.region || 'Other',
          sizeMM: tumor.userData.initialSizeMM || tumor.userData.sizeMM || 25,
          position: {
            x: tumor.position.x,
            y: tumor.position.y,
            z: tumor.position.z
          },
          scale: tumorInitialSizes.get(tumor) || tumor.scale.x,
          // Save history data for follow-up visits
          priorSize: tumor.userData.priorSize || null,
          historyMonths: tumor.userData.historyMonths || 0,
          // Save PD-L1 biomarker data
          pdl1: tumor.userData.pdl1 || null,
          pdl1Score: tumor.userData.pdl1Score || null,
          // Save temperature (hot/warm/cold)
          temperature: tumor.userData.temperature || null
        };
      });

    saveSubjectsToStorage();
    console.log(`Saved ${subject.tumors.length} tumor(s) to ${subject.name}`);
  }

  // Load a subject
  // Reset all medications to off
  function resetMedications() {
    for (const medId of Object.keys(activeMedications)) {
      activeMedications[medId] = false;
      medicationStartTimes[medId] = null;
    }
    // Update UI toggles (query fresh since they're dynamic)
    document.querySelectorAll('.med-toggle').forEach(toggle => {
      toggle.classList.remove('active');
    });
    // Clear tumor medication responses
    droppedTumors.forEach(tumor => {
      tumor.userData.medResponse = null;
      tumor.userData.shrinkRate = null;
    });
  }

  function loadSubject(id) {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;

    // Clear existing tumors
    clearAllTumors();

    // Reset medications when switching subjects
    resetMedications();

    // Clear patient info panel, then restore if available
    clearPatientInfoPanel();
    if (subject.patientInfo) {
      updatePatientInfoPanel(subject.patientInfo);
    }

    currentSubjectId = id;
    subjectName.textContent = subject.name;

    // Restore tumors from examHistory (source of truth) or fallback to subject.tumors
    restoreTumorsFromExamHistory(subject);

    // Update tumor burden display
    if (typeof updateTumorBurden === 'function') updateTumorBurden();

    // Update medication panel with relevant drugs for loaded tumors
    if (typeof updateMedicationPanel === 'function') updateMedicationPanel();

    updateSubjectMenu();
    closeSubjectMenu();
  }

  // Restore tumors from exam history - this is the source of truth
  function restoreTumorsFromExamHistory(subject) {
    if (!subject) return;

    // Use examHistory if available, otherwise fallback to subject.tumors
    if (subject.examHistory && subject.examHistory.length > 0) {
      // Get the latest exam's tumors
      const latestExam = subject.examHistory[subject.examHistory.length - 1];
      const latestTumors = latestExam?.tumors || [];

      // Build history data from previous exams
      const previousExam = subject.examHistory.length > 1
        ? subject.examHistory[subject.examHistory.length - 2]
        : null;

      latestTumors.forEach(tumorData => {
        // Find matching tumor from previous exam for history
        let priorSize = tumorData.priorSize;
        let historyMonths = latestExam.historyMonths || 0;

        if (!priorSize && previousExam) {
          const matchingPrevTumor = previousExam.tumors?.find(pt => pt.region === tumorData.region);
          if (matchingPrevTumor) {
            priorSize = matchingPrevTumor.size;
          }
        }

        // Use createTumorAtPosition since examHistory doesn't store position
        const size = tumorData.size || tumorData.sizeMM || 25;
        const tumor = createTumorAtPosition(size, tumorData.region);
        if (tumor) {
          // Apply history data
          if (priorSize) {
            tumor.userData.priorSize = priorSize;
          }
          if (historyMonths > 0) {
            tumor.userData.historyMonths = historyMonths;
          }
          // Restore PD-L1 biomarker data
          if (tumorData.pdl1) {
            tumor.userData.pdl1 = tumorData.pdl1;
          }
          if (tumorData.pdl1Score != null) {
            tumor.userData.pdl1Score = tumorData.pdl1Score;
          }
          // Restore temperature (or derive from PD-L1) and apply visuals
          if (tumorData.temperature) {
            tumor.userData.temperature = tumorData.temperature;
          } else {
            tumor.userData.temperature = getTemperatureFromPDL1(tumorData.pdl1);
          }
          applyTemperatureVisuals(tumor);
        }
      });

      console.log(`Loaded ${latestTumors.length} tumor(s) from examHistory for ${subject.name}`);
    } else if (subject.tumors && subject.tumors.length > 0) {
      // Fallback to subject.tumors for backwards compatibility (has position data)
      subject.tumors.forEach(tumorData => {
        restoreTumor(tumorData);
      });
      console.log(`Loaded ${subject.tumors.length} tumor(s) from tumors array for ${subject.name}`);
    }

    // Reposition all organ tumors to be inside actual mesh bounds
    repositionTumorsIntoOrgans();
  }

  // Restore a tumor from saved data
  function restoreTumor(tumorData) {
    if (!humanBodyMesh) return;

    // Create tumor geometry
    const tumorGeo = createLumpySphere(
      CONFIG.tumor.size,
      CONFIG.tumor.segments,
      CONFIG.tumor.lumpiness
    );

    const tumorMat = new THREE.MeshBasicMaterial({
      color: 0xFFAA33, // Default warm, will be updated
      depthTest: false
    });

    const tumor = new THREE.Group();
    const mesh = new THREE.Mesh(tumorGeo, tumorMat);
    mesh.name = 'tumorMesh';
    mesh.renderOrder = 999;
    mesh.onBeforeRender = function(renderer) {
      renderer.clearDepth();
    };
    tumor.add(mesh);

    // Set position and scale
    tumor.position.set(
      tumorData.position.x,
      tumorData.position.y,
      tumorData.position.z
    );

    const targetScale = (tumorData.sizeMM * MM_TO_SCALE) / CONFIG.tumor.size;
    tumor.scale.setScalar(targetScale);

    // Store metadata
    tumor.userData.region = tumorData.region;
    tumor.userData.sizeMM = tumorData.sizeMM;
    tumor.userData.initialSizeMM = tumorData.sizeMM;

    // Restore history data for follow-up visits
    if (tumorData.priorSize) {
      tumor.userData.priorSize = tumorData.priorSize;
    }
    if (tumorData.historyMonths) {
      tumor.userData.historyMonths = tumorData.historyMonths;
    }

    // Restore PD-L1 biomarker data
    if (tumorData.pdl1) {
      tumor.userData.pdl1 = tumorData.pdl1;
    }
    if (tumorData.pdl1Score != null) {
      tumor.userData.pdl1Score = tumorData.pdl1Score;
    }

    // Restore temperature (or derive from PD-L1)
    if (tumorData.temperature) {
      tumor.userData.temperature = tumorData.temperature;
    } else {
      tumor.userData.temperature = getTemperatureFromPDL1(tumorData.pdl1);
    }

    // Apply temperature-based visuals (color + glow)
    applyTemperatureVisuals(tumor);

    // Add to body and tracking
    humanBodyMesh.add(tumor);
    droppedTumors.push(tumor);
    tumorInitialSizes.set(tumor, targetScale);
  }

  // Clear all tumors
  function clearAllTumors() {
    // Remove dropped tumors
    droppedTumors.forEach(tumor => {
      if (tumor.parent) tumor.parent.remove(tumor);
    });
    droppedTumors.length = 0;
    metastases.length = 0;
    tumorInitialSizes.clear();
    tumorGrowthData.clear();
    tumorIdCounter = 0;

    // Reset simulation state
    currentMonth = 0;
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = '▶';
    updateTimelineUI();
    clearMetNotifications();

    // Hide spider plot
    if (spiderPlot) spiderPlot.classList.remove('visible');

    // Update tumor burden display
    if (typeof updateTumorBurden === 'function') updateTumorBurden();
  }

  // Update the dropdown menu
  function updateSubjectMenu() {
    if (!subjectList) return;

    subjectList.innerHTML = '';

    if (subjects.length === 0) {
      subjectList.innerHTML = '<div class="subject-list-empty">No saved subjects</div>';
      return;
    }

    // Sort by most recent first
    const sorted = [...subjects].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    sorted.forEach(subject => {
      const item = document.createElement('div');
      item.className = 'subject-menu-item';
      if (subject.id === currentSubjectId) {
        item.classList.add('active');
      }
      const tumorCount = subject.tumors ? subject.tumors.length : 0;
      item.textContent = `${subject.name} (${tumorCount} tumor${tumorCount !== 1 ? 's' : ''})`;
      item.addEventListener('click', () => loadSubject(subject.id));
      subjectList.appendChild(item);
    });
  }

  // Toggle dropdown
  function toggleSubjectMenu() {
    if (patientInfoPanel) {
      patientInfoPanel.classList.toggle('menu-open');
    }
  }

  function closeSubjectMenu() {
    if (patientInfoPanel) {
      patientInfoPanel.classList.remove('menu-open');
    }
  }

  // Event listeners
  if (patientHeaderRow) {
    patientHeaderRow.addEventListener('click', (e) => {
      // Only toggle if clicking arrow or empty space, not the editable name
      if (e.target === subjectName) return;
      e.stopPropagation();
      toggleSubjectMenu();
    });
  }

  if (createSubjectBtn) {
    createSubjectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createNewSubject();
      closeSubjectMenu();
    });
  }

  // Custom confirmation modal
  const confirmModal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const confirmCancelBtn = document.getElementById('confirm-cancel');
  let pendingDeleteSubjectId = null;

  function showConfirmModal(message) {
    if (confirmMessage) confirmMessage.textContent = message;
    if (confirmModal) confirmModal.classList.add('visible');
  }

  function hideConfirmModal() {
    if (confirmModal) confirmModal.classList.remove('visible');
    pendingDeleteSubjectId = null;
  }

  // Cancel button closes modal
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', hideConfirmModal);
  }

  // Clicking overlay background closes modal
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) hideConfirmModal();
    });
  }

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmModal?.classList.contains('visible')) {
      hideConfirmModal();
    }
  });

  // Confirm delete button
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (!pendingDeleteSubjectId) {
        hideConfirmModal();
        return;
      }

      // Remove subject from list
      subjects = subjects.filter(s => s.id !== pendingDeleteSubjectId);
      saveSubjectsToStorage();

      // Load another subject or create new one
      if (subjects.length > 0) {
        loadSubject(subjects[0].id);
      } else {
        createNewSubject();
      }

      updateSubjectMenu();
      hideConfirmModal();
      console.log('Patient deleted');
    });
  }

  // Delete patient functionality
  if (deletePatientBtn) {
    deletePatientBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!currentSubjectId) return;

      const subject = subjects.find(s => s.id === currentSubjectId);
      if (!subject) return;

      // Show custom confirmation modal
      pendingDeleteSubjectId = currentSubjectId;
      showConfirmModal(`Delete patient "${subject.name}" and all their tumor data?`);
    });
  }

  // Subject name editing
  if (subjectName) {
    // Prevent dropdown from toggling when clicking on name to edit
    subjectName.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Save on Enter key
    subjectName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        subjectName.blur();
      }
      // Prevent dropdown toggle on space
      if (e.key === ' ') {
        e.stopPropagation();
      }
    });

    // Save on blur (click outside)
    subjectName.addEventListener('blur', () => {
      const newName = subjectName.textContent.trim();
      if (newName && currentSubjectId) {
        const subject = subjects.find(s => s.id === currentSubjectId);
        if (subject && subject.name !== newName) {
          subject.name = newName;
          saveSubjectsToStorage();
          updateSubjectMenu();
          console.log(`Renamed subject to: ${newName}`);
        }
      }
      // Restore name if empty
      if (!newName && currentSubjectId) {
        const subject = subjects.find(s => s.id === currentSubjectId);
        if (subject) {
          subjectName.textContent = subject.name;
        }
      }
    });

    // Select all text on focus for easy editing
    subjectName.addEventListener('focus', () => {
      const range = document.createRange();
      range.selectNodeContents(subjectName);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (patientInfoPanel && !patientInfoPanel.contains(e.target)) {
      closeSubjectMenu();
    }
  });

  // Initialize subjects (only if subject menu exists - Journey mode)
  // Skip in Starfall mode where injuries are managed separately
  if (subjectMenu) {
    loadSubjectsFromStorage();
    updateSubjectMenu();

    // Create default subject if none exist
    if (subjects.length === 0) {
      createNewSubject();
    } else {
      // Load the most recent subject
      const mostRecent = [...subjects].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
      loadSubject(mostRecent.id);
    }
  }

  // Initialize medication panel with relevant drugs
  updateMedicationPanel();

  // Export save function for use when tumors are dropped
  window.JourneySaveSubject = saveCurrentSubject;

  // Reset camera to default position and zoom
  window.JourneyResetCamera = function() {
    if (camera && controls) {
      camera.position.set(CONFIG.camera.position.x, CONFIG.camera.position.y, CONFIG.camera.position.z);
      controls.target.set(0, 0.5, 0);
      controls.update();
      // Reset smooth zoom target
      if (window.setTargetZoom) {
        window.setTargetZoom(CONFIG.camera.position.z);
      }
    }
  };

  console.log('Journey scene ready. Drag tumor onto body.');
})();
