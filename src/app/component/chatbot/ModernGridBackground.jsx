'use client';
import { useEffect, useRef } from "react";

const CONFIG = {
  GRID_SIZE: 80, // Larger grid size for a more refined look
  COLORS: {
    FLOW: "hsl(210, 100%, 70%)", // Softer, more premium color
    COMPLETED: "hsla(210, 100%, 70%, 0.15)", // Subtle completed path
    GRID: "hsla(0, 0%, 100%, 0.03)", // Very faint grid
    BACKGROUND: "hsl(220, 30%, 10%)", // Darker, more premium background
    PARTICLE: "rgba(255,255,255,0.5)" // Subtle particle color
  },
  MAX_FLOWS: 8, // Fewer flows for less clutter
  SPAWN_RATE: 0.08, // Slower spawn rate
  SEGMENTS: { MIN: 3, MAX: 6 }, // Shorter, more elegant paths
  SPEED: 2.0, // Slower speed for a more refined effect
  FADE_DURATION: 180, // Longer fade for smoother transitions
  PARTICLE_LIFE: 40, // Longer particle life for a trailing effect
  PARTICLE_COUNT: 3 // Fewer particles for less noise
};

class Flow {
  constructor(x, y, gridWidth, gridHeight) {
    this.x = x;
    this.y = y;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.path = this.generatePath();
    this.progress = 0;
    this.segmentIndex = 0;
    this.alpha = 1;
    this.speed = CONFIG.SPEED * (0.9 + Math.random() * 0.2);
    this.easing = 0.05; // Slower easing for smoother movement
    this.targetProgress = 0;
    this.particles = [];
    this.pulse = 0;
  }

  generatePath() {
    const path = [{ x: this.x, y: this.y }];
    let currentX = this.x;
    let currentY = this.y;
    const segments = CONFIG.SEGMENTS.MIN + Math.floor(Math.random() * (CONFIG.SEGMENTS.MAX - CONFIG.SEGMENTS.MIN));
    for (let i = 0; i < segments; i++) {
      const direction = { 
        x: CONFIG.GRID_SIZE * (Math.random() > 0.5 ? 1 : -1), 
        y: CONFIG.GRID_SIZE * (Math.random() > 0.5 ? 1 : -1) 
      };
      const nextX = currentX + direction.x;
      const nextY = currentY + direction.y;
      if (nextX >= 0 && nextX <= this.gridWidth * CONFIG.GRID_SIZE && nextY >= 0 && nextY <= this.gridHeight * CONFIG.GRID_SIZE) {
        path.push({ x: nextX, y: nextY });
        currentX = nextX;
        currentY = nextY;
      }
    }
    return path;
  }

  update() {
    if (this.segmentIndex >= this.path.length - 1) {
      this.alpha -= 1 / CONFIG.FADE_DURATION;
      return this.alpha > 0;
    }

    const current = this.path[this.segmentIndex];
    const next = this.path[this.segmentIndex + 1];
    const segmentLength = Math.hypot(next.x - current.x, next.y - current.y);

    this.targetProgress += this.speed / segmentLength;
    this.progress += (this.targetProgress - this.progress) * this.easing;

    if (this.progress >= 1) {
      const overflow = this.progress - 1;
      this.segmentIndex++;
      this.progress = overflow;
      this.targetProgress = overflow;
    }

    this.pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8; // Subtle pulsing effect

    if (this.segmentIndex < this.path.length - 1) {
      const head = this.getHeadPosition();
      for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        this.particles.push({
          x: head.x,
          y: head.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: CONFIG.PARTICLE_LIFE
        });
      }
    }

    this.particles = this.particles.map(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life--;
      return p;
    }).filter(p => p.life > 0);

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

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw completed path
    if (this.segmentIndex > 0) {
      ctx.beginPath();
      ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i <= this.segmentIndex; i++) {
        ctx.lineTo(this.path[i].x, this.path[i].y);
      }
      ctx.strokeStyle = CONFIG.COLORS.COMPLETED;
      ctx.globalAlpha = this.alpha * 0.3;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw active segment with gradient glow
    if (this.segmentIndex < this.path.length - 1) {
      const current = this.path[this.segmentIndex];
      const head = this.getHeadPosition();

      const grad = ctx.createLinearGradient(current.x, current.y, head.x, head.y);
      grad.addColorStop(0, CONFIG.COLORS.FLOW);
      grad.addColorStop(1, "rgba(255, 255, 255, 0.2)");

      ctx.save();
      ctx.shadowColor = CONFIG.COLORS.FLOW;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(head.x, head.y);
      ctx.strokeStyle = grad;
      ctx.globalAlpha = this.alpha * this.pulse;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw head particles for a subtle trailing effect
      this.particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = (particle.life / CONFIG.PARTICLE_LIFE) * this.alpha * 0.5;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, Math.random() * 1 + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.COLORS.PARTICLE;
        ctx.fill();
        ctx.restore();
      });
    }
  }
}

const CircuitGrid = ({ active = true }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const flowsRef = useRef([]);
  const gridSizeRef = useRef({ width: 0, height: 0, cols: 0, rows: 0 });
  const gridCanvasRef = useRef(null);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(pixelRatio, pixelRatio);

    gridSizeRef.current = {
      width,
      height,
      cols: Math.ceil(width / CONFIG.GRID_SIZE),
      rows: Math.ceil(height / CONFIG.GRID_SIZE)
    };

    gridCanvasRef.current = document.createElement("canvas");
    gridCanvasRef.current.width = width;
    gridCanvasRef.current.height = height;
    const gridCtx = gridCanvasRef.current.getContext("2d");
    drawGrid(gridCtx);
    return ctx;
  };

  const drawGrid = (ctx) => {
    const { width, height, cols, rows } = gridSizeRef.current;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = CONFIG.COLORS.GRID;
    ctx.lineWidth = 0.25;

    for (let i = 0; i <= cols; i++) {
      const x = i * CONFIG.GRID_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
      const y = i * CONFIG.GRID_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const animate = () => {
    const ctx = initCanvas();
    if (!ctx || !active) return;
    const { width, height } = gridSizeRef.current;
    
    // Draw background with subtle fade effect
    ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    ctx.globalAlpha = 0.05;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    
    if (gridCanvasRef.current) {
      ctx.drawImage(gridCanvasRef.current, 0, 0);
    }
    
    if (flowsRef.current.length < CONFIG.MAX_FLOWS && Math.random() < CONFIG.SPAWN_RATE) {
      const edge = Math.floor(Math.random() * 4);
      let x, y;
      const { cols, rows } = gridSizeRef.current;
      switch (edge) {
        case 0: // Top
          x = Math.floor(Math.random() * cols) * CONFIG.GRID_SIZE;
          y = 0;
          break;
        case 1: // Right
          x = cols * CONFIG.GRID_SIZE;
          y = Math.floor(Math.random() * rows) * CONFIG.GRID_SIZE;
          break;
        case 2: // Bottom
          x = Math.floor(Math.random() * cols) * CONFIG.GRID_SIZE;
          y = rows * CONFIG.GRID_SIZE;
          break;
        case 3: // Left
          x = 0;
          y = Math.floor(Math.random() * rows) * CONFIG.GRID_SIZE;
          break;
      }
      flowsRef.current.push(new Flow(x, y, cols, rows));
    }
    
    flowsRef.current = flowsRef.current.filter(flow => {
      flow.update();
      flow.draw(ctx);
      return flow.alpha > 0;
    });
    
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener("resize", handleResize);
    
    if (active) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      flowsRef.current = [];
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
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