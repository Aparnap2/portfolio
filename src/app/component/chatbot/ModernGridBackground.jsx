'use client';
import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// Modern SaaS/Cyber aesthetic grid
const SpatialGrid = ({ active = true }) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const gridRef = useRef(null);
  const pulseLinesRef = useRef([]);
  const animationFrameRef = useRef(null);

  const CONFIG = {
    GRID_SIZE: 48,
    GRID_DIVISIONS: 24,
    PULSE_SPEED: 0.8,
    LINE_WIDTH: 0.3,
    COLORS: {
      GRID: 0xa8c7ff,        // brighter soft blue
      PULSE: 0xd9b2ff,       // brighter violet/soft pink
      BACKGROUND: 0x0a0a1a    // slightly lighter deep navy
    },
    MOBILE_SCALE: 0.65
  };

  // Add a radial fog for depth
  const addFog = (scene) => {
    scene.fog = new THREE.FogExp2("#1a1a2e", 0.012);
  };

  const create3DGrid = useCallback((scene, isMobile) => {
    const gridGeometry = new THREE.PlaneGeometry(
      CONFIG.GRID_SIZE,
      CONFIG.GRID_SIZE,
      CONFIG.GRID_DIVISIONS,
      CONFIG.GRID_DIVISIONS
    );
    const gridMaterial = new THREE.LineBasicMaterial({
      color: CONFIG.COLORS.GRID,
      transparent: true,
      opacity: 0.25,  // Increased opacity for better visibility
      linewidth: 1.5
    });

    const grid = new THREE.Group();
    // Main floor
    const baseGrid = new THREE.LineSegments(
      new THREE.WireframeGeometry(gridGeometry),
      gridMaterial
    );
    baseGrid.rotation.x = -Math.PI / 2;
    grid.add(baseGrid);

    // Side grids for 3D box effect, fainter
    const verticalMaterial = gridMaterial.clone();
    verticalMaterial.opacity = 0.15;  // Increased opacity for side grids

    const verticalGrid1 = baseGrid.clone();
    verticalGrid1.material = verticalMaterial;
    verticalGrid1.rotation.z = Math.PI / 2;
    verticalGrid1.position.x = CONFIG.GRID_SIZE / 2;
    grid.add(verticalGrid1);

    const verticalGrid2 = baseGrid.clone();
    verticalGrid2.material = verticalMaterial;
    verticalGrid2.rotation.z = -Math.PI / 2;
    verticalGrid2.position.x = -CONFIG.GRID_SIZE / 2;
    grid.add(verticalGrid2);

    scene.add(grid);
    gridRef.current = grid;
  }, [CONFIG]);

  const initPulseSystem = useCallback((scene) => {
    // Pulses are very faint, soft and slow
    const pulseGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(2 * 3);
    pulseGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pulseLinesRef.current = Array(2).fill().map(() => {
      const material = new THREE.LineBasicMaterial({
        color: CONFIG.COLORS.PULSE,
        linewidth: CONFIG.LINE_WIDTH,
        transparent: true,
        opacity: 0
      });
      const line = new THREE.Line(pulseGeometry.clone(), material);
      line.visible = false;
      scene.add(line);
      return line;
    });
  }, [CONFIG]);

  const initScene = useCallback(() => {
    if (!mountRef.current) return;
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);
    addFog(scene);
    sceneRef.current = scene;

    // Camera
    const isMobile = window.innerWidth < 768;
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(
      isMobile ? 30 : 23,
      isMobile ? 20 : 15,
      isMobile ? 30 : 20
    );
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setClearAlpha(0.95); // allow slight see-through for glassmorphism
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambient = new THREE.AmbientLight(0x9bbcff, 0.55);
    scene.add(ambient);

    // Create the grid
    create3DGrid(scene, isMobile);

    // Initialize pulse system
    initPulseSystem(scene);
  }, [CONFIG.COLORS.BACKGROUND, create3DGrid, initPulseSystem]);

  const animatePulse = useCallback(() => {
    pulseLinesRef.current.forEach((line) => {
      if (!line.visible && Math.random() < 0.003) {
        // Align pulse with grid
        const gridSize = CONFIG.GRID_SIZE;
        const axis = Math.floor(Math.random() * 3);
        let start, end;
        switch(axis) {
          case 0:
            start = new THREE.Vector3(-gridSize/2, Math.random() * 1.5 - 0.75, (Math.random() - 0.5) * gridSize);
            end = start.clone().setX(gridSize/2);
            break;
          case 1:
            start = new THREE.Vector3((Math.random() - 0.5) * gridSize, Math.random() * 1.5 - 0.75, -gridSize/2);
            end = start.clone().setZ(gridSize/2);
            break;
          case 2:
            start = new THREE.Vector3((Math.random() - 0.5) * gridSize, -1, (Math.random() - 0.5) * gridSize);
            end = start.clone().setY(1);
            break;
        }
        const positions = line.geometry.attributes.position.array;
        positions[0] = start.x;
        positions[1] = start.y;
        positions[2] = start.z;
        positions[3] = end.x;
        positions[4] = end.y;
        positions[5] = end.z;
        line.geometry.attributes.position.needsUpdate = true;
        line.material.opacity = 0.32;
        line.visible = true;
        const animate = () => {
          line.material.opacity *= 0.95;
          if (line.material.opacity < 0.07) {
            line.visible = false;
          } else {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    });
  }, [CONFIG.GRID_SIZE]);

  const animate = useCallback(() => {
    if (!active || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    if (gridRef.current) {
      gridRef.current.rotation.y += 0.00011;
      gridRef.current.rotation.x += 0.00007;
    }
    animatePulse();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [active, animatePulse]);

  const handleResize = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current) return;
    const isMobile = window.innerWidth < 768;
    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    cameraRef.current.position.set(
      isMobile ? 30 : 23,
      isMobile ? 20 : 15,
      isMobile ? 30 : 20
    );
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  }, []);

  useEffect(() => {
    initScene();
    animationFrameRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (gridRef.current) {
        gridRef.current.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
      pulseLinesRef.current.forEach(line => {
        if (line.geometry) line.geometry.dispose();
        if (line.material) line.material.dispose();
      });
    };
  }, [initScene, animate, handleResize]);

  // Extra: add a faint radial gradient overlay for extra depth
  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{ filter: "blur(0.5px)", transition: "filter 0.2s" }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 60% 40%,rgba(158,198,255,0.18) 0%,rgba(203,166,247,0.10) 50%,rgba(9,9,26,0.01) 100%)"
        }}
      ></div>
    </>
  );
};

export default SpatialGrid;
