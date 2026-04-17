/**
 * Journey - Human Body with Fresnel Glow
 * Clean test scene
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
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
      dampingFactor: 0.05,
      enableZoom: true,
      enablePan: false,        // No panning
      minDistance: 4.8,        // 20% closer (6 * 0.8)
      maxDistance: 7.2         // 20% farther (6 * 1.2)
    },

    // Gradient background (purple like reference)
    background: {
      topColor: 0x1a0a2a,
      bottomColor: 0x0a0818
    },

    // Fog
    fog: {
      enabled: true,
      color: 0x0a0818,
      near: 10,
      far: 100
    },

    // Human body with outline glow
    humanBody: {
      enabled: true,
      modelPath: './Mesh/Anatomy.fbx',
      position: { x: 0, y: -1.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },   // Facing camera
      scale: 2.0,  // Much bigger
      // Outline settings
      outlineColor: 0x00ffff,      // Cyan outline
      innerColor: 0x002233,        // Dark interior
      outlineIntensity: 1.0,
      outlinePower: 3.0,
      scanLineIntensity: 0.5,
      scanLineFrequency: 100.0,
      pulseSpeed: 0.5,
      pulseAmount: 0.1
    },

    postProcessing: {
      bloom: {
        strength: 0.3,   // Much lower - no blob
        radius: 0.2,
        threshold: 0.8   // Only brightest pixels bloom
      },
      vignette: {
        darkness: 0.5,
        offset: 1.0
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
    controls.enableZoom = CONFIG.controls.enableZoom;
    controls.enablePan = CONFIG.controls.enablePan;
    controls.minDistance = CONFIG.controls.minDistance;
    controls.maxDistance = CONFIG.controls.maxDistance;
    controls.target.set(0, 0.5, 0);  // Orbit around body center
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
      uniform float uScanLineFrequency;
      uniform float uScanLineIntensity;
      uniform float uTime;

      varying vec3 vWorldPosition;

      void main() {
        // Scan lines
        float scanLine = sin(vWorldPosition.y * uScanLineFrequency + uTime * 0.5) * 0.5 + 0.5;
        scanLine = step(0.6, scanLine);

        // Dark fill with scan lines
        vec3 color = uInnerColor * (0.1 + scanLine * uScanLineIntensity);

        gl_FragColor = vec4(color, 1.0);
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

          // Outline mesh (back faces) - pushed outward
          const outlineMesh = mesh.clone();
          outlineMesh.material = outlineMaterial;
          humanBodyMesh.add(outlineMesh);
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
  // POST PROCESSING
  // ============================================

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    CONFIG.postProcessing.bloom.strength,
    CONFIG.postProcessing.bloom.radius,
    CONFIG.postProcessing.bloom.threshold
  );
  composer.addPass(bloomPass);

  // Vignette
  const vignetteShader = {
    uniforms: {
      tDiffuse: { value: null },
      darkness: { value: CONFIG.postProcessing.vignette.darkness },
      offset: { value: CONFIG.postProcessing.vignette.offset }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float darkness;
      uniform float offset;
      varying vec2 vUv;
      void main() {
        vec4 texel = texture2D(tDiffuse, vUv);
        vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
        texel.rgb *= 1.0 - dot(uv, uv) * darkness;
        gl_FragColor = texel;
      }
    `
  };
  composer.addPass(new ShaderPass(vignetteShader));

  // ============================================
  // ANIMATION
  // ============================================

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Update shaders
    if (humanBodyMaterial) {
      if (humanBodyMaterial.outline) humanBodyMaterial.outline.uniforms.uTime.value = time;
      if (humanBodyMaterial.inner) humanBodyMaterial.inner.uniforms.uTime.value = time;
    }

    if (controls) controls.update();

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
  });

  // API
  window.ThreeBackground = {
    scene,
    camera,
    renderer,
    controls,
    getHumanBody: () => humanBodyMesh,
    setOutlineColor: (hex) => {
      if (humanBodyMaterial && humanBodyMaterial.outline) {
        humanBodyMaterial.outline.uniforms.uOutlineColor.value.setHex(hex);
      }
    },
    setOutlineThickness: (val) => {
      if (humanBodyMaterial && humanBodyMaterial.outline) {
        humanBodyMaterial.outline.uniforms.uOutlineThickness.value = val;
      }
    }
  };

  console.log('Journey scene ready. OrbitControls enabled.');
})();
