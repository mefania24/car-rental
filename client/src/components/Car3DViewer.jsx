import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RotateCcw, Play, Pause, Sun, Maximize2, Palette } from 'lucide-react';

const CAR_COLORS = [
  { name: 'Metallic Silver', hex: 0x94a3b8 },
  { name: 'Obsidian Black', hex: 0x1e293b },
  { name: 'Pearl White', hex: 0xf1f5f9 },
  { name: 'Royal Blue', hex: 0x2563eb },
  { name: 'Crimson Red', hex: 0xdc2626 },
  { name: 'Emerald Green', hex: 0x059669 }
];

export default function Car3DViewer({ car, height = '450px' }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [selectedColor, setSelectedColor] = useState(CAR_COLORS[0].hex);
  
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const carBodyMeshRef = useRef([]);
  const headlightsRef = useRef([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setLoading(true);

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.Fog(0x0b0f19, 15, 35);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(5.5, 3.2, 5.5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    rendererRef.current = renderer;

    // Clean container before attaching
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath floor
    controls.minDistance = 2.5;
    controls.maxDistance = 14;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controls.target.set(0, 0.6, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(8, 12, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
    fillLight.position.set(-8, 6, -6);
    scene.add(fillLight);

    // 6. Showroom Floor Stage with realistic reflections
    const stageRadius = 5.8;
    const stageGeo = new THREE.CylinderGeometry(stageRadius, stageRadius + 0.5, 0.15, 64);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.8
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -0.075;
    stage.receiveShadow = true;
    scene.add(stage);

    // Subtle neon showroom ring
    const ringGeo = new THREE.RingGeometry(5.6, 5.75, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // 7. Load Car Model: Photorealistic GLB Model or Custom Model
    carBodyMeshRef.current = [];
    headlightsRef.current = [];

    const carGroup = new THREE.Group();
    scene.add(carGroup);

    // Setup DRACOLoader and GLTFLoader
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);

    // Determine target 3D model path
    let targetModelUrl = car.model3dUrl;
    if (!targetModelUrl) {
      const preset = (car.model3dPreset || 'van').toLowerCase();
      if (preset === 'sports') {
        targetModelUrl = '/models/sports.glb';
      } else if (preset === 'sedan') {
        targetModelUrl = '/models/sedan.glb';
      } else if (preset === 'suv') {
        targetModelUrl = '/models/suv.glb';
      } else {
        targetModelUrl = '/models/van.glb';
      }
    }

    loader.load(
      targetModelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              const matName = (child.material.name || '').toLowerCase();
              const meshName = (child.name || '').toLowerCase();

              // Track exterior paintable surfaces
              if (
                matName.includes('body') ||
                matName.includes('paint') ||
                matName.includes('car_body') ||
                matName.includes('exterior') ||
                meshName.includes('body') ||
                meshName.includes('paint')
              ) {
                // Clone material so color customization is isolated
                child.material = child.material.clone();
                carBodyMeshRef.current.push(child);
              }

              // Realistic glass enhancement
              if (matName.includes('glass') || matName.includes('window')) {
                child.material.transparent = true;
                child.material.opacity = 0.75;
                child.material.roughness = 0.05;
              }
            }
          }
        });

        // Auto-scale and center model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4.2 / maxDim;
        model.scale.set(scale, scale, scale);

        const newBox = new THREE.Box3().setFromObject(model);
        model.position.y = -newBox.min.y;
        model.position.x = - (newBox.max.x + newBox.min.x) / 2;
        model.position.z = - (newBox.max.z + newBox.min.z) / 2;

        carGroup.add(model);

        // Add studio spotlights on front lights
        const spotL = new THREE.SpotLight(0xffffff, 3.5, 12, Math.PI / 6, 0.4);
        spotL.position.set(1.2, 0.8, 2.8);
        spotL.target.position.set(1.2, 0.2, 8);
        carGroup.add(spotL);
        carGroup.add(spotL.target);
        headlightsRef.current.push({ light: spotL });

        const spotR = new THREE.SpotLight(0xffffff, 3.5, 12, Math.PI / 6, 0.4);
        spotR.position.set(-1.2, 0.8, 2.8);
        spotR.target.position.set(-1.2, 0.2, 8);
        carGroup.add(spotR);
        carGroup.add(spotR.target);
        headlightsRef.current.push({ light: spotR });

        setLoading(false);
      },
      undefined,
      (err) => {
        console.warn('GLB load error, using high-definition procedural model:', err);
        buildProceduralCar(carGroup, car.model3dPreset || 'van', selectedColor);
        setLoading(false);
      }
    );

    // 8. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize listener
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [car.id, car.model3dUrl, car.model3dPreset]);

  // Update autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update body color
  useEffect(() => {
    carBodyMeshRef.current.forEach((mesh) => {
      if (mesh.material && mesh.material.color) {
        mesh.material.color.setHex(selectedColor);
      }
    });
  }, [selectedColor]);

  // Update headlights
  useEffect(() => {
    headlightsRef.current.forEach(({ light }) => {
      if (light) light.intensity = headlightsOn ? 3.5 : 0;
    });
  }, [headlightsOn]);

  // Reset view handler
  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0.6, 0);
    }
  };

  // High-Definition Smooth Procedural Car (Fallback)
  function buildProceduralCar(carGroup, presetType, initialColor) {
    const isVan = presetType === 'van';
    const isSuv = presetType === 'suv';
    const isSports = presetType === 'sports';

    let length = isVan ? 4.4 : isSuv ? 4.2 : isSports ? 3.8 : 4.0;
    let width = isVan ? 1.9 : isSuv ? 1.95 : isSports ? 1.85 : 1.8;
    let height = isVan ? 1.75 : isSuv ? 1.6 : isSports ? 1.18 : 1.38;
    let groundClearance = isSuv ? 0.38 : isVan ? 0.32 : isSports ? 0.22 : 0.28;

    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: initialColor,
      metalness: 0.9,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      thickness: 0.6,
      transparent: true,
      opacity: 0.8
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.15
    });

    const rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9
    });

    const darkTrim = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.4 });
    const chromeTrim = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.1 });

    // Streamlined curved chassis base
    const baseHeight = height * 0.45;
    const bodyBase = new THREE.Mesh(new THREE.BoxGeometry(width, baseHeight, length), bodyMaterial);
    bodyBase.position.y = groundClearance + baseHeight / 2;
    bodyBase.castShadow = true;
    bodyBase.receiveShadow = true;
    carGroup.add(bodyBase);
    carBodyMeshRef.current.push(bodyBase);

    // Cabin
    const cabinHeight = height * 0.55;
    let cabinLength = isVan ? length * 0.8 : isSuv ? length * 0.68 : isSports ? length * 0.48 : length * 0.6;
    let cabinWidth = width * 0.88;
    let cabinZ = isVan ? -length * 0.04 : isSuv ? -length * 0.08 : isSports ? -length * 0.12 : -length * 0.06;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength), bodyMaterial);
    cabin.position.set(0, groundClearance + baseHeight + cabinHeight / 2 - 0.02, cabinZ);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    carGroup.add(cabin);
    carBodyMeshRef.current.push(cabin);

    // Front Sloped Windshield
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(cabinWidth * 0.92, cabinHeight * 0.88), glassMaterial);
    windshield.position.set(0, cabin.position.y, cabin.position.z + cabinLength / 2 + 0.01);
    windshield.rotation.x = isSports ? 0.38 : 0.18;
    carGroup.add(windshield);

    // Realistic wheels
    const wheelRadius = isSuv ? 0.4 : isVan ? 0.36 : 0.33;
    const wheelWidth = 0.24;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32);
    wheelGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.7, wheelRadius * 0.7, wheelWidth + 0.02, 16);
    rimGeo.rotateZ(Math.PI / 2);

    const wheelOffsetZ = length * 0.32;
    const wheelOffsetX = width / 2 + wheelWidth / 2 - 0.04;

    [
      [wheelOffsetX, groundClearance + 0.08, wheelOffsetZ],
      [-wheelOffsetX, groundClearance + 0.08, wheelOffsetZ],
      [wheelOffsetX, groundClearance + 0.08, -wheelOffsetZ],
      [-wheelOffsetX, groundClearance + 0.08, -wheelOffsetZ]
    ].forEach(([x, y, z]) => {
      const tire = new THREE.Mesh(wheelGeo, rubberMaterial);
      tire.position.set(x, y, z);
      tire.castShadow = true;

      const rim = new THREE.Mesh(rimGeo, rimMaterial);
      tire.add(rim);

      // Wheel disc center
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, wheelWidth + 0.03, 16), chromeTrim);
      cap.rotateZ(Math.PI / 2);
      tire.add(cap);

      carGroup.add(tire);
    });
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        style={{ height }}
        className="w-full cursor-grab active:cursor-grabbing"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-300 font-medium text-xs">Loading Photorealistic 3D Vehicle...</p>
        </div>
      )}

      {/* Floating 3D Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/70 text-xs font-semibold text-indigo-400 flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Photorealistic 3D Model
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 shadow-lg">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Pause 360° Rotation" : "Start 360° Rotation"}
            className={`p-2 rounded-lg text-xs font-medium transition ${
              autoRotate ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {autoRotate ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            onClick={() => setHeadlightsOn(!headlightsOn)}
            title="Toggle Studio Lighting"
            className={`p-2 rounded-lg text-xs font-medium transition ${
              headlightsOn ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sun size={16} />
          </button>

          <button
            onClick={handleResetView}
            title="Reset Camera View"
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Color Selector & Tips */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none z-10">
        {/* Paint Customizer */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/70 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 pr-1">
            <Palette size={14} className="text-indigo-400" />
            <span className="hidden sm:inline">Paint:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {CAR_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setSelectedColor(color.hex)}
                title={color.name}
                style={{ backgroundColor: '#' + color.hex.toString(16).padStart(6, '0') }}
                className={`w-5 h-5 rounded-full border transition transform hover:scale-110 ${
                  selectedColor === color.hex ? 'border-white scale-110 shadow-md ring-2 ring-indigo-500' : 'border-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Interaction Hint */}
        <div className="text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800">
          💡 Drag to rotate 360° • Pinch / scroll to zoom
        </div>
      </div>
    </div>
  );
}
