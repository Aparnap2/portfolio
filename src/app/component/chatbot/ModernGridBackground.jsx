'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';

// Configuration for the CircuitGrid animation
const CONFIG = {
  FLOW_COUNT: 50, // Number of flow particles
  FLOW_SPEED: 0.02, // Slower for smooth animation
  FLOW_COLOR: new THREE.Color(0x1e90ff), // Vibrant blue for AI theme
  BACKGROUND_COLOR: new THREE.Color(0x0a0e1a), // Dark navy background
  PARTICLE_SIZE: 0.02, // Small particles for subtlety
  GRID_OPACITY: 0.05, // Faint grid
};

// CircuitGrid Component (WebGL-based)
  const CircuitGrid = ({ active = true }) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);
  const positionsRef = useRef(new Float32Array());
  const velocitiesRef = useRef(new Float32Array());
  const animationFrameRef = useRef(null);

  const initializeWebGL = useCallback(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Orthographic camera for 2D effect
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
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particle system
    const positions = new Float32Array(CONFIG.FLOW_COUNT * 3);
    const velocities = new Float32Array(CONFIG.FLOW_COUNT * 3);
    for (let i = 0; i < CONFIG.FLOW_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * frustumSize * aspect * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * frustumSize * 2;
      velocities[i * 3] = Math.random() * CONFIG.FLOW_SPEED - CONFIG.FLOW_SPEED / 2;
      velocities[i * 3 + 1] = Math.random() * CONFIG.FLOW_SPEED - CONFIG.FLOW_SPEED / 2;
    }
    positionsRef.current = positions;
    velocitiesRef.current = velocities;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: CONFIG.FLOW_COLOR,
      size: CONFIG.PARTICLE_SIZE,
      transparent: true,
      opacity: 0.7,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Background grid
    const gridMaterial = new THREE.LineBasicMaterial({
      color: CONFIG.FLOW_COLOR,
      opacity: CONFIG.GRID_OPACITY,
      transparent: true,
    });
    const gridGeometry = new THREE.BufferGeometry();
    const gridVertices = [];
    for (let x = -frustumSize * aspect; x <= frustumSize * aspect; x += 0.2) {
      gridVertices.push(x, -frustumSize, 0, x, frustumSize, 0);
    }
    for (let y = -frustumSize; y <= frustumSize; y += 0.2) {
      gridVertices.push(-frustumSize * aspect, y, 0, frustumSize * aspect, y, 0);
    }
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    scene.add(grid);
  }, []);

  const animate = useCallback((time) => {
    if (!active || !sceneRef.current || !cameraRef.current || !rendererRef.current || !particlesRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    // Update particle positions
    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;
    for (let i = 0; i < CONFIG.FLOW_COUNT; i++) {
      positions[i * 3] += velocities[i * 3];
      positions[i * 3 + 1] += velocities[i * 3 + 1];

      // Bounce off edges
      const aspect = window.innerWidth / window.innerHeight;
      const frustumSize = 2;
      if (Math.abs(positions[i * 3]) > frustumSize * aspect) velocities[i * 3] *= -1;
      if (Math.abs(positions[i * 3 + 1]) > frustumSize) velocities[i * 3 + 1] *= -1;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    // Render
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

    const mountNode = mountRef.current;
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        mountNode?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initializeWebGL, animate, active]);

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: CONFIG.BACKGROUND_COLOR }} />;
};
 export default CircuitGrid;  
