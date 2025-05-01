'use client';
import { useEffect, useRef } from "react";

const CONFIG = {
  GRID_SIZE: 60,
  COLORS: {
    FLOW: "hsl(195, 100%, 60%)",
    COMPLETED: "hsla(195, 100%, 60%, 0.3)",
    GRID: "hsla(0, 0%, 100%, 0.05)",
    BACKGROUND: "hsl(210, 25%, 8%)"
  },
  MAX_FLOWS: 12, // Reduced quantity
  SPAWN_RATE: 0.1,
  SEGMENTS: { MIN: 5, MAX: 12 }, // Longer paths
  SPEED: 1.8, // Slower movement
  FADE_DURATION: 120 // Longer fade
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
    this.easing = 0.1; // Smoothing factor
    this.targetProgress = 0;
  }

  generatePath() {
    const path = [{ x: this.x, y: this.y }];
    let currentX = this.x;
    let currentY = this.y;
    let prevDirection = null;
    const segments = CONFIG.SEGMENTS.MIN + Math.floor(Math.random() * (CONFIG.SEGMENTS.MAX - CONFIG.SEGMENTS.MIN));

    for (let i = 0; i < segments; i++) {
      const directions = [
        { x: CONFIG.GRID_SIZE, y: 0 },    // Right
        { x: -CONFIG.GRID_SIZE, y: 0 },   // Left
        { x: 0, y: CONFIG.GRID_SIZE },    // Down
        { x: 0, y: -CONFIG.GRID_SIZE }    // Up
      ].filter(dir => {
        // Don't go back the same way
        if (!prevDirection) return true;
        return !(dir.x === -prevDirection.x && dir.y === -prevDirection.y);
      });

      const direction = directions[Math.floor(Math.random() * directions.length)];
      prevDirection = direction;

      const nextX = currentX + direction.x;
      const nextY = currentY + direction.y;

      // Stay within grid bounds
      if (nextX >= 0 && nextX <= this.gridWidth * CONFIG.GRID_SIZE && 
          nextY >= 0 && nextY <= this.gridHeight * CONFIG.GRID_SIZE) {
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
    this.progress += (this.targetProgress - this.progress) * this.easing; // Smooth interpolation
    
    if (this.targetProgress >= 1) {
      this.progress = 0;
      this.targetProgress = 0;
      this.segmentIndex++;
    }

    return true;
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
      ctx.globalAlpha = this.alpha * 0.5;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw active segment
    if (this.segmentIndex < this.path.length - 1) {
      const current = this.path[this.segmentIndex];
      const next = this.path[this.segmentIndex + 1];
      const x = current.x + (next.x - current.x) * this.progress;
      const y = current.y + (next.y - current.y) * this.progress;

      // Glow effect
      ctx.shadowColor = CONFIG.COLORS.FLOW;
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = CONFIG.COLORS.FLOW;
      ctx.globalAlpha = this.alpha;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulse head
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }
}

const CircuitGrid = ({ active = true }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const flowsRef = useRef([]);
  const gridSizeRef = useRef({ width: 0, height: 0, cols: 0, rows: 0 });

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);

    gridSizeRef.current = {
      width,
      height,
      cols: Math.ceil(width / CONFIG.GRID_SIZE),
      rows: Math.ceil(height / CONFIG.GRID_SIZE)
    };

    return ctx;
  };

  const drawGrid = (ctx) => {
    const { width, height, cols, rows } = gridSizeRef.current;

    ctx.strokeStyle = CONFIG.COLORS.GRID;
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      const x = i * CONFIG.GRID_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
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

    // Clear with slight fade effect
    ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Draw grid
    drawGrid(ctx);

    // Spawn new flows from edges only
    if (flowsRef.current.length < CONFIG.MAX_FLOWS && Math.random() < CONFIG.SPAWN_RATE) {
      const edge = Math.floor(Math.random() * 4);
      let x, y;

      switch (edge) {
        case 0: // Top
          x = Math.floor(Math.random() * gridSizeRef.current.cols) * CONFIG.GRID_SIZE;
          y = 0;
          break;
        case 1: // Right
          x = gridSizeRef.current.cols * CONFIG.GRID_SIZE;
          y = Math.floor(Math.random() * gridSizeRef.current.rows) * CONFIG.GRID_SIZE;
          break;
        case 2: // Bottom
          x = Math.floor(Math.random() * gridSizeRef.current.cols) * CONFIG.GRID_SIZE;
          y = gridSizeRef.current.rows * CONFIG.GRID_SIZE;
          break;
        case 3: // Left
          x = 0;
          y = Math.floor(Math.random() * gridSizeRef.current.rows) * CONFIG.GRID_SIZE;
          break;
      }

      flowsRef.current.push(new Flow(x, y, gridSizeRef.current.cols, gridSizeRef.current.rows));
    }

    // Update and draw flows
    flowsRef.current = flowsRef.current.filter(flow => {
      flow.update();
      flow.draw(ctx);
      return flow.alpha > 0;
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (active) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      flowsRef.current = [];
    }

    const handleResize = () => {
      initCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        opacity: active ? 1 : 0,
        transition: 'opacity 0.5s ease',
        backgroundColor: CONFIG.COLORS.BACKGROUND
      }}
    />
  );
};

export default CircuitGrid;
