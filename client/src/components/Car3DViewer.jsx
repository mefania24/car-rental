import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
    scene.fog = new THREE.Fog(0x0b0f19, 15, 30);

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
    renderer.toneMappingExposure = 1.2;
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
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controls.target.set(0, 0.6, 0);
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainLight.position.set(8, 12, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    fillLight.position.set(-8, 6, -6);
    scene.add(fillLight);

    // 6. Showroom Floor Stage
    const stageRadius = 5.5;
    const stageGeo = new THREE.CylinderGeometry(stageRadius, stageRadius + 0.5, 0.15, 64);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.25,
      metalness: 0.7
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -0.075;
    stage.receiveShadow = true;
    scene.add(stage);

    // Subtle showroom ring grid
    const ringGeo = new THREE.RingGeometry(5.4, 5.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // 7. Load Car Model: Custom GLTF or Procedural 3D Preset
    carBodyMeshRef.current = [];
    headlightsRef.current = [];

    const carGroup = new THREE.Group();
    scene.add(carGroup);

    if (car.model3dUrl && car.model3dType === 'custom') {
      const loader = new GLTFLoader();
      loader.load(
        car.model3dUrl,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                // Track paintable meshes
                if (child.material.name?.toLowerCase().includes('paint') || child.material.name?.toLowerCase().includes('body')) {
                  carBodyMeshRef.current.push(child);
                }
              }
            }
          });

          // Auto-scale and center model
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 3.5 / maxDim;
          model.scale.set(scale, scale, scale);

          const newBox = new THREE.Box3().setFromObject(model);
          model.position.y = -newBox.min.y;
          carGroup.add(model);
          setLoading(false);
        },
        undefined,
        (err) => {
          console.warn('Failed to load custom GLB, falling back to 3D procedural preset:', err);
          buildProceduralCar(carGroup, car.model3dPreset || 'van', selectedColor);
          setLoading(false);
        }
      );
    } else {
      buildProceduralCar(carGroup, car.model3dPreset || 'van', selectedColor);
      setLoading(false);
    }

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
      if (mesh.material) {
        mesh.material.color.setHex(selectedColor);
      }
    });
  }, [selectedColor]);

  // Update headlights
  useEffect(() => {
    headlightsRef.current.forEach(({ light, bulb }) => {
      light.intensity = headlightsOn ? 3.5 : 0;
      if (bulb) {
        bulb.material.emissiveIntensity = headlightsOn ? 1.5 : 0.1;
      }
    });
  }, [headlightsOn]);

  // Reset view handler
  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0.6, 0);
    }
  };

  // Procedural 3D Car Generator
  function buildProceduralCar(carGroup, presetType, initialColor) {
    const isVan = presetType === 'van';
    const isSuv = presetType === 'suv';
    const isSports = presetType === 'sports';

    // Proportions
    let length = isVan ? 4.2 : isSuv ? 3.9 : isSports ? 3.6 : 3.8;
    let width = isVan ? 1.85 : isSuv ? 1.9 : isSports ? 1.8 : 1.75;
    let height = isVan ? 1.7 : isSuv ? 1.55 : isSports ? 1.15 : 1.35;
    let groundClearance = isSuv ? 0.38 : isVan ? 0.32 : isSports ? 0.22 : 0.28;

    // Materials
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: initialColor,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.8,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85
    });

    const rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.85
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2
    });

    const darkTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5
    });

    const lightBulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x60a5fa,
      emissiveIntensity: 1.5
    });

    const tailBulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xef4444,
      emissiveIntensity: 1.8
    });

    // --- 1. Main Car Body Base ---
    const baseHeight = height * 0.45;
    const baseGeo = new THREE.BoxGeometry(width, baseHeight, length);
    const bodyBase = new THREE.Mesh(baseGeo, bodyMaterial);
    bodyBase.position.y = groundClearance + baseHeight / 2;
    bodyBase.castShadow = true;
    bodyBase.receiveShadow = true;
    carGroup.add(bodyBase);
    carBodyMeshRef.current.push(bodyBase);

    // --- 2. Cabin / Roof (Van 8-seater vs SUV vs Sedan vs Sports) ---
    const cabinHeight = height * 0.55;
    let cabinLength = isVan ? length * 0.78 : isSuv ? length * 0.65 : isSports ? length * 0.45 : length * 0.58;
    let cabinWidth = width * 0.9;
    let cabinOffsetZ = isVan ? -length * 0.05 : isSuv ? -length * 0.08 : isSports ? -length * 0.12 : -length * 0.06;

    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(0, groundClearance + baseHeight + cabinHeight / 2 - 0.02, cabinOffsetZ);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    carGroup.add(cabin);
    carBodyMeshRef.current.push(cabin);

    // --- 3. Windows ---
    // Windshield
    const windshieldGeo = new THREE.PlaneGeometry(cabinWidth * 0.92, cabinHeight * 0.85);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0, cabin.position.y, cabin.position.z + cabinLength / 2 + 0.01);
    windshield.rotation.x = isSports ? 0.35 : 0.15;
    carGroup.add(windshield);

    // Rear window
    const rearWindow = new THREE.Mesh(windshieldGeo, glassMaterial);
    rearWindow.position.set(0, cabin.position.y, cabin.position.z - cabinLength / 2 - 0.01);
    rearWindow.rotation.y = Math.PI;
    rearWindow.rotation.x = isSports ? 0.3 : 0.05;
    carGroup.add(rearWindow);

    // Side windows (for Van: elongated panoramic 8-seater passenger windows)
    const sideWindowGeo = new THREE.PlaneGeometry(cabinLength * 0.88, cabinHeight * 0.65);
    const leftWindow = new THREE.Mesh(sideWindowGeo, glassMaterial);
    leftWindow.position.set(cabinWidth / 2 + 0.01, cabin.position.y, cabin.position.z);
    leftWindow.rotation.y = Math.PI / 2;
    carGroup.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeo, glassMaterial);
    rightWindow.position.set(-cabinWidth / 2 - 0.01, cabin.position.y, cabin.position.z);
    rightWindow.rotation.y = -Math.PI / 2;
    carGroup.add(rightWindow);

    // If 8-seater Van: Add Roof Luggage Rails & Dual A/C Unit on top
    if (isVan || isSuv) {
      const railGeo = new THREE.CylinderGeometry(0.025, 0.025, cabinLength * 0.85, 16);
      const leftRail = new THREE.Mesh(railGeo, darkTrimMaterial);
      leftRail.rotation.x = Math.PI / 2;
      leftRail.position.set(cabinWidth * 0.42, cabin.position.y + cabinHeight / 2 + 0.06, cabin.position.z);
      carGroup.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, darkTrimMaterial);
      rightRail.rotation.x = Math.PI / 2;
      rightRail.position.set(-cabinWidth * 0.42, cabin.position.y + cabinHeight / 2 + 0.06, cabin.position.z);
      carGroup.add(rightRail);
    }

    // --- 4. Wheels & Hubs ---
    const wheelRadius = isSuv ? 0.38 : isVan ? 0.34 : isSports ? 0.32 : 0.33;
    const wheelWidth = 0.22;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    wheelGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.01, 16);
    rimGeo.rotateZ(Math.PI / 2);

    const wheelOffsetZ = length * 0.33;
    const wheelOffsetX = width / 2 + wheelWidth / 2 - 0.05;

    const wheelPositions = [
      [wheelOffsetX, groundClearance + 0.1, wheelOffsetZ],     // Front Left
      [-wheelOffsetX, groundClearance + 0.1, wheelOffsetZ],    // Front Right
      [wheelOffsetX, groundClearance + 0.1, -wheelOffsetZ],    // Rear Left
      [-wheelOffsetX, groundClearance + 0.1, -wheelOffsetZ]    // Rear Right
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const tire = new THREE.Mesh(wheelGeo, rubberMaterial);
      tire.position.set(x, y, z);
      tire.castShadow = true;

      const rim = new THREE.Mesh(rimGeo, rimMaterial);
      tire.add(rim);

      carGroup.add(tire);
    });

    // --- 5. Front Headlights & Spotlight Glow ---
    const lightGeo = new THREE.BoxGeometry(0.28, 0.12, 0.08);
    const leftHeadlight = new THREE.Mesh(lightGeo, lightBulbMaterial);
    leftHeadlight.position.set(width * 0.34, groundClearance + baseHeight * 0.65, length / 2 + 0.01);
    carGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(lightGeo, lightBulbMaterial);
    rightHeadlight.position.set(-width * 0.34, groundClearance + baseHeight * 0.65, length / 2 + 0.01);
    carGroup.add(rightHeadlight);

    // Front spot lights shining forward
    const spotL = new THREE.SpotLight(0xffffff, 3.5, 12, Math.PI / 6, 0.4);
    spotL.position.set(width * 0.34, groundClearance + baseHeight * 0.65, length / 2 + 0.1);
    spotL.target.position.set(width * 0.34, 0.2, length / 2 + 8);
    carGroup.add(spotL);
    carGroup.add(spotL.target);
    headlightsRef.current.push({ light: spotL, bulb: leftHeadlight });

    const spotR = new THREE.SpotLight(0xffffff, 3.5, 12, Math.PI / 6, 0.4);
    spotR.position.set(-width * 0.34, groundClearance + baseHeight * 0.65, length / 2 + 0.1);
    spotR.target.position.set(-width * 0.34, 0.2, length / 2 + 8);
    carGroup.add(spotR);
    carGroup.add(spotR.target);
    headlightsRef.current.push({ light: spotR, bulb: rightHeadlight });

    // --- 6. Rear Taillights ---
    const tailLightGeo = new THREE.BoxGeometry(0.32, 0.12, 0.08);
    const leftTail = new THREE.Mesh(tailLightGeo, tailBulbMaterial);
    leftTail.position.set(width * 0.34, groundClearance + baseHeight * 0.65, -length / 2 - 0.01);
    carGroup.add(leftTail);

    const rightTail = new THREE.Mesh(tailLightGeo, tailBulbMaterial);
    rightTail.position.set(-width * 0.34, groundClearance + baseHeight * 0.65, -length / 2 - 0.01);
    carGroup.add(rightTail);

    // --- 7. Front Grill & Bumpers ---
    const grillGeo = new THREE.BoxGeometry(width * 0.45, baseHeight * 0.45, 0.05);
    const grill = new THREE.Mesh(grillGeo, darkTrimMaterial);
    grill.position.set(0, groundClearance + baseHeight * 0.4, length / 2 + 0.02);
    carGroup.add(grill);

    // Sports car spoiler
    if (isSports) {
      const spoilerWingGeo = new THREE.BoxGeometry(width * 0.88, 0.05, 0.35);
      const spoiler = new THREE.Mesh(spoilerWingGeo, darkTrimMaterial);
      spoiler.position.set(0, groundClearance + baseHeight + 0.3, -length / 2 + 0.2);
      carGroup.add(spoiler);

      const postGeo = new THREE.BoxGeometry(0.04, 0.3, 0.08);
      const postL = new THREE.Mesh(postGeo, darkTrimMaterial);
      postL.position.set(width * 0.3, groundClearance + baseHeight + 0.15, -length / 2 + 0.2);
      carGroup.add(postL);

      const postR = new THREE.Mesh(postGeo, darkTrimMaterial);
      postR.position.set(-width * 0.3, groundClearance + baseHeight + 0.15, -length / 2 + 0.2);
      carGroup.add(postR);
    }
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
          <p className="text-slate-300 font-medium text-sm">Rendering 3D Vehicle...</p>
        </div>
      )}

      {/* Floating 3D Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/70 text-xs font-semibold text-indigo-400 flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Interactive 3D Studio
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
            title="Toggle Headlights"
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
            <span className="hidden sm:inline">Color:</span>
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
          💡 Drag to rotate 360° • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
