'use client';
import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const SpatialGrid = ({ active = true }) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const gridRef = useRef(null);
  const pulseLinesRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Configuration with 3D adjustments
  const CONFIG = {
    GRID_SIZE: 50,
    GRID_DIVISIONS: 30,
    PULSE_SPEED: 0.8,
    LINE_WIDTH: 0.6,
    COLORS: {
      GRID: 0x2a6fdb,
      PULSE: 0x5ad9fb,
      BACKGROUND: 0x0a0a1a
    },
    MOBILE_SCALE: 0.65
  };

  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    // Scene setup with 3D grid
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);
    sceneRef.current = scene;

    // 3D camera setup
    const isMobile = window.innerWidth < 768;
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(
      isMobile ? 35 : 25,
      isMobile ? 25 : 20,
      isMobile ? 35 : 30
    );
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Optimized renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create 3D grid structure
    create3DGrid(scene, isMobile);
    initPulseSystem(scene);
  }, []);

  const create3DGrid = (scene, isMobile) => {
    // Main grid plane
    const gridGeometry = new THREE.PlaneGeometry(
      CONFIG.GRID_SIZE,
      CONFIG.GRID_SIZE,
      CONFIG.GRID_DIVISIONS,
      CONFIG.GRID_DIVISIONS
    );

    const gridMaterial = new THREE.LineBasicMaterial({
      color: CONFIG.COLORS.GRID,
      transparent: true,
      opacity: 0.15
    });

    // Create multiple grid planes for 3D effect
    const grid = new THREE.Group();
    
    // Base grid
    const baseGrid = new THREE.LineSegments(
      new THREE.WireframeGeometry(gridGeometry),
      gridMaterial
    );
    baseGrid.rotation.x = -Math.PI / 2;
    grid.add(baseGrid);

    // Vertical grids
    const verticalGrid1 = baseGrid.clone();
    verticalGrid1.rotation.z = Math.PI / 2;
    verticalGrid1.position.x = CONFIG.GRID_SIZE/2;
    grid.add(verticalGrid1);

    const verticalGrid2 = baseGrid.clone();
    verticalGrid2.rotation.z = -Math.PI / 2;
    verticalGrid2.position.x = -CONFIG.GRID_SIZE/2;
    grid.add(verticalGrid2);

    scene.add(grid);
    gridRef.current = grid;
  };

  const initPulseSystem = (scene) => {
    // Create pulse line pool
    const pulseGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(2 * 3);
    pulseGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    pulseLinesRef.current = Array(4).fill().map(() => {
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
  };

  const animatePulse = useCallback(() => {
    pulseLinesRef.current.forEach((line) => {
      if (!line.visible && Math.random() < 0.008) {
        // Align pulse with grid geometry
        const gridSize = CONFIG.GRID_SIZE;
        const axis = Math.floor(Math.random() * 3);
        let start, end;

        switch(axis) {
          case 0: // X-axis flow
            start = new THREE.Vector3(
              -gridSize/2,
              Math.random() * 2 - 1,
              (Math.random() - 0.5) * gridSize
            );
            end = start.clone().setX(gridSize/2);
            break;

          case 1: // Z-axis flow
            start = new THREE.Vector3(
              (Math.random() - 0.5) * gridSize,
              Math.random() * 2 - 1,
              -gridSize/2
            );
            end = start.clone().setZ(gridSize/2);
            break;

          case 2: // Y-axis flow
            start = new THREE.Vector3(
              (Math.random() - 0.5) * gridSize,
              -2,
              (Math.random() - 0.5) * gridSize
            );
            end = start.clone().setY(2);
            break;
        }

        // Set line positions
        const positions = line.geometry.attributes.position.array;
        positions[0] = start.x;
        positions[1] = start.y;
        positions[2] = start.z;
        positions[3] = end.x;
        positions[4] = end.y;
        positions[5] = end.z;
        line.geometry.attributes.position.needsUpdate = true;

        // Animate pulse
        line.material.opacity = 0.8;
        line.visible = true;
        
        const animate = () => {
          line.material.opacity *= 0.96;
          if (line.material.opacity < 0.05) {
            line.visible = false;
          } else {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    });
  }, []);

  const animate = useCallback(() => {
    if (!active || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    // Smooth grid rotation
    if (gridRef.current) {
      gridRef.current.rotation.y += 0.0002;
      gridRef.current.rotation.x += 0.0001;
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
      isMobile ? 35 : 25,
      isMobile ? 25 : 20,
      isMobile ? 35 : 30
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

      // Cleanup with null checks
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

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default SpatialGrid;