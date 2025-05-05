'use client';
import { useEffect, useRef } from "react";

const CONFIG = {
  GRID_SIZE: 100, // Increased for better performance
  COLORS: {
    FLOW: "hsl(210, 100%, 70%)",
    COMPLETED: "hsla(210, 100%, 70%, 0.1)", // More transparent
    GRID: "hsla(0, 0%, 100%, 0.02)", // Fainter grid
    BACKGROUND: "hsl(220, 30%, 10%)",
    PARTICLE: "rgba(255,255,255,0.3)" // More subtle particles
  },
  MAX_FLOWS: 4, // Reduced number of flows
  SPAWN_RATE: 0.05, // Slower spawn
  SEGMENTS: { MIN: 2, MAX: 4 }, // Shorter paths
  SPEED: 1.5, // Slower movement
  FADE_DURATION: 120, // Shorter fade
  PARTICLE_LIFE: 20, // Shorter particle life
  PARTICLE_COUNT: 1 // Fewer particles
};

class Flow {
  constructor(x, y, gridWidth, gridHeight) {
    this.path = this.generatePath(x, y, gridWidth, gridHeight);
    this.progress = 0;
    this.segmentIndex = 0;
    this.alpha = 1;
    this.speed = CONFIG.SPEED * (0.9 + Math.random() * 0.2);
    this.lastParticleTime = 0;
  }

  generatePath(x, y, gridWidth, gridHeight) {
    const path = [{ x, y }];
    const segments = CONFIG.SEGMENTS.MIN + Math.floor(Math.random() * (CONFIG.SEGMENTS.MAX - CONFIG.SEGMENTS.MIN));
    
    for (let i = 0; i < segments; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = CONFIG.GRID_SIZE * (1 + Math.random());
      const newX = x + Math.cos(angle) * distance;
      const newY = y + Math.sin(angle) * distance;
      
      if (newX >= 0 && newX <= gridWidth * CONFIG.GRID_SIZE && 
          newY >= 0 && newY <= gridHeight * CONFIG.GRID_SIZE) {
        path.push({ x: newX, y: newY });
        x = newX;
        y = newY;
      }
    }
    return path;
  }

  update(currentTime) {
    if (this.segmentIndex >= this.path.length - 1) {
      this.alpha -= 1 / CONFIG.FADE_DURATION;
      return this.alpha > 0;
    }

    const current = this.path[this.segmentIndex];
    const next = this.path[this.segmentIndex + 1];
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.progress += this.speed / distance;

    if (this.progress >= 1) {
      this.segmentIndex++;
      this.progress = 0;
    }

    return true;
  }

  getHeadPosition() {
    if (this.segmentIndex >= this.path.length - 1) {
      return this.path[this.path.length - 1];
    }
    const current = this.path[this.segmentIndex];
    const next = this.path[this.segmentIndex + 1];
    return {
      x: current.x + (next.x - current.x) * this.progress,
      y: current.y + (next.y - current.y) * this.progress
    };
  }

  draw(ctx) {
    if (this.path.length < 2) return;

    // Draw completed path (simplified)
    if (this.segmentIndex > 0) {
      ctx.beginPath();
      ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i <= this.segmentIndex; i++) {
        ctx.lineTo(this.path[i].x, this.path[i].y);
      }
      ctx.strokeStyle = CONFIG.COLORS.COMPLETED;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw active segment
    if (this.segmentIndex < this.path.length - 1) {
      const current = this.path[this.segmentIndex];
      const head = this.getHeadPosition();

      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(head.x, head.y);
      ctx.strokeStyle = CONFIG.COLORS.FLOW;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Only draw particle occasionally for performance
      if (Math.random() < 0.3) {
        ctx.beginPath();
        ctx.arc(head.x, head.y, 0.5 + Math.random(), 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.COLORS.PARTICLE;
        ctx.fill();
      }
    }
  }
}

const CircuitGrid = ({ active = true }) => {
  const canvasRef = useRef(null);
  const flowsRef = useRef([]);
  const lastFrameTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const gridSizeRef = useRef({ width: 0, height: 0 });

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 1.5); // Cap DPR for performance
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    gridSizeRef.current = {
      width,
      height,
      cols: Math.ceil(width / CONFIG.GRID_SIZE),
      rows: Math.ceil(height / CONFIG.GRID_SIZE)
    };

    // Draw static grid once
    ctx.strokeStyle = CONFIG.COLORS.GRID;
    ctx.lineWidth = 0.25;
    for (let i = 0; i <= gridSizeRef.current.cols; i++) {
      const x = i * CONFIG.GRID_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let i = 0; i <= gridSizeRef.current.rows; i++) {
      const y = i * CONFIG.GRID_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const animate = (currentTime) => {
    if (!active) return;
    
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // Throttle animation frame rate to ~30fps for mobile
    if (currentTime - lastFrameTimeRef.current < 32) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTimeRef.current = currentTime;

    const { width, height } = gridSizeRef.current;
    
    // Clear with subtle fade effect
    ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    ctx.globalAlpha = 0.05;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Spawn new flows
    if (flowsRef.current.length < CONFIG.MAX_FLOWS && Math.random() < CONFIG.SPAWN_RATE) {
      const edge = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      
      switch (edge) {
        case 0: x = Math.random() * width; break; // Top
        case 1: y = Math.random() * height; x = width; break; // Right
        case 2: x = Math.random() * width; y = height; break; // Bottom
        case 3: y = Math.random() * height; break; // Left
      }
      
      flowsRef.current.push(new Flow(x, y, gridSizeRef.current.cols, gridSizeRef.current.rows));
    }

    // Update and draw flows
    flowsRef.current = flowsRef.current.filter(flow => {
      flow.update(currentTime);
      flow.draw(ctx);
      return flow.alpha > 0;
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      initCanvas();
      flowsRef.current = []; // Reset flows on resize
    };

    window.addEventListener("resize", handleResize);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        opacity: active ? 1 : 0,
        transition: "opacity 0.5s ease",
        backgroundColor: CONFIG.COLORS.BACKGROUND
      }}
    />
  );
};

export default CircuitGrid;
