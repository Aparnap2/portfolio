'use client';
import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const CircuitGrid = ({ active = true }) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);
  const trailsRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Configuration
  const CONFIG = {
    STAR_COUNT: 30, // Fewer but more visible shooting stars
    STAR_SPEED: 0.3, // Much faster movement
    STAR_SIZE: 0.1, // Larger for visibility
    STAR_COLOR: 0xffffff, // Bright white
    TRAIL_LENGTH: 8, // Number of trail segments
    TRAIL_FADE: 0.7, // Trail opacity decay
    GRID_COLOR: 0x1a5fb4, // Soft blue grid
    GRID_OPACITY: 0.04, // Very subtle
    GRID_SCALE: 0.5, // Smaller grid cells
    BACKGROUND_COLOR: 0x050810, // Deep space
  };

  const initializeWebGL = useCallback(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.BACKGROUND_COLOR);
    sceneRef.current = scene;

    // Camera setup
    const aspect = width / height;
    const frustumSize = 2;
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect,
      frustumSize * aspect,
      frustumSize,
      -frustumSize,
      0.1,
      100
    );
    camera.position.z = 1;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create shooting stars
    const starsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CONFIG.STAR_COUNT * 3);
    const velocities = new Float32Array(CONFIG.STAR_COUNT * 3);
    const colors = new Float32Array(CONFIG.STAR_COUNT * 3);

    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      // Start from random edge
      const edge = Math.floor(Math.random() * 4);
      switch(edge) {
        case 0: // top
          positions[i*3] = (Math.random() - 0.5) * frustumSize * aspect * 2;
          positions[i*3+1] = frustumSize;
          break;
        case 1: // right
          positions[i*3] = frustumSize * aspect;
          positions[i*3+1] = (Math.random() - 0.5) * frustumSize * 2;
          break;
        case 2: // bottom
          positions[i*3] = (Math.random() - 0.5) * frustumSize * aspect * 2;
          positions[i*3+1] = -frustumSize;
          break;
        case 3: // left
          positions[i*3] = -frustumSize * aspect;
          positions[i*3+1] = (Math.random() - 0.5) * frustumSize * 2;
          break;
      }
      
      // Velocity towards center
      velocities[i*3] = -positions[i*3] * CONFIG.STAR_SPEED * 0.1;
      velocities[i*3+1] = -positions[i*3+1] * CONFIG.STAR_SPEED * 0.1;
      
      // White color with slight variation
      colors[i*3] = 1;
      colors[i*3+1] = 0.9 + Math.random() * 0.1;
      colors[i*3+2] = 0.8 + Math.random() * 0.2;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: CONFIG.STAR_SIZE,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starsGeometry, starMaterial);
    scene.add(stars);
    particlesRef.current = stars;

    // Create trails for each star
    const trailGroup = new THREE.Group();
    scene.add(trailGroup);
    trailsRef.current = [];

    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(CONFIG.TRAIL_LENGTH * 3);
      const trailColors = new Float32Array(CONFIG.TRAIL_LENGTH * 3);
      
      for (let j = 0; j < CONFIG.TRAIL_LENGTH; j++) {
        trailPositions[j*3] = positions[i*3];
        trailPositions[j*3+1] = positions[i*3+1];
        trailPositions[j*3+2] = 0;
        
        // Fade trail
        const fade = Math.pow(CONFIG.TRAIL_FADE, j);
        trailColors[j*3] = colors[i*3] * fade;
        trailColors[j*3+1] = colors[i*3+1] * fade;
        trailColors[j*3+2] = colors[i*3+2] * fade;
      }

      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

      const trailMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        linewidth: 1,
        blending: THREE.AdditiveBlending
      });

      const trail = new THREE.Line(trailGeometry, trailMaterial);
      trailGroup.add(trail);
      trailsRef.current.push({
        positions: trailPositions,
        geometry: trailGeometry,
        index: 0
      });
    }

    // Create smaller grid
    const gridMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(CONFIG.GRID_COLOR),
      opacity: CONFIG.GRID_OPACITY,
      transparent: true
    });

    const gridGeometry = new THREE.BufferGeometry();
    const gridVertices = [];
    const gridSize = 10 * CONFIG.GRID_SCALE; // Smaller grid

    // Horizontal lines
    for (let y = -gridSize; y <= gridSize; y += 1 * CONFIG.GRID_SCALE) {
      gridVertices.push(-gridSize * aspect, y, 0, gridSize * aspect, y, 0);
    }
    // Vertical lines
    for (let x = -gridSize * aspect; x <= gridSize * aspect; x += 1 * CONFIG.GRID_SCALE) {
      gridVertices.push(x, -gridSize, 0, x, gridSize, 0);
    }

    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    scene.add(grid);
  }, []);

  const animate = useCallback(() => {
    if (!active || !sceneRef.current || !cameraRef.current || !rendererRef.current || !particlesRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    // Update shooting stars
    const stars = particlesRef.current;
    const positions = stars.geometry.attributes.position.array;
    const velocities = new Float32Array(CONFIG.STAR_COUNT * 3);
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 2;

    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      // Move towards center
      velocities[i*3] = -positions[i*3] * CONFIG.STAR_SPEED * 0.05;
      velocities[i*3+1] = -positions[i*3+1] * CONFIG.STAR_SPEED * 0.05;
      
      positions[i*3] += velocities[i*3];
      positions[i*3+1] += velocities[i*3+1];

      // Reset if reaches center
      if (Math.abs(positions[i*3]) < 0.2 && Math.abs(positions[i*3+1]) < 0.2) {
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
          case 0: // top
            positions[i*3] = (Math.random() - 0.5) * frustumSize * aspect * 2;
            positions[i*3+1] = frustumSize;
            break;
          case 1: // right
            positions[i*3] = frustumSize * aspect;
            positions[i*3+1] = (Math.random() - 0.5) * frustumSize * 2;
            break;
          case 2: // bottom
            positions[i*3] = (Math.random() - 0.5) * frustumSize * aspect * 2;
            positions[i*3+1] = -frustumSize;
            break;
          case 3: // left
            positions[i*3] = -frustumSize * aspect;
            positions[i*3+1] = (Math.random() - 0.5) * frustumSize * 2;
            break;
        }
      }
    }

    stars.geometry.attributes.position.needsUpdate = true;

    // Update trails
    trailsRef.current.forEach((trail, i) => {
      const starPos = [
        positions[i*3],
        positions[i*3+1],
        0
      ];

      // Shift trail positions
      const trailPositions = trail.positions;
      for (let j = CONFIG.TRAIL_LENGTH - 1; j > 0; j--) {
        trailPositions[j*3] = trailPositions[(j-1)*3];
        trailPositions[j*3+1] = trailPositions[(j-1)*3+1];
      }

      // Add new position at head
      trailPositions[0] = starPos[0];
      trailPositions[1] = starPos[1];
      trailPositions[2] = starPos[2];

      trail.geometry.attributes.position.needsUpdate = true;
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [active]);

  useEffect(() => {
    initializeWebGL();
    animationFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;
      const frustumSize = 2;

      cameraRef.current.left = -frustumSize * aspect;
      cameraRef.current.right = frustumSize * aspect;
      cameraRef.current.top = frustumSize;
      cameraRef.current.bottom = -frustumSize;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initializeWebGL, animate]);

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export default CircuitGrid;