'use client';
import { useEffect, useRef, useCallback } from "react";

// --- Configuration ---
const GRID_SIZE = 40; // Smaller grid for more potential paths
const FLOW_COLOR = "rgba(0, 190, 255, 0.8)"; // Bright Cyan
const FLOW_COMPLETED_COLOR = "rgba(0, 190, 255, 0.4)"; // Faded Cyan for completed parts
const GLOW_COLOR = "rgba(0, 190, 255, 0.5)";
const GRID_COLOR = "rgba(255, 255, 255, 0.03)"; // Even fainter grid
const BACKGROUND_COLOR = "rgba(5, 5, 10, 1)"; // Slightly darker background

const MAX_FLOWS = 40; // Max number of concurrent flows
const FLOW_SPAWN_RATE = 0.08; // Increased spawn rate for more activity
const MIN_SEGMENTS = 2;
const MAX_SEGMENTS = 5; // Max segments per flow path
const SEGMENT_LENGTH_MIN = 1; // Min grid units per segment
const SEGMENT_LENGTH_MAX = 4; // Max grid units per segment
const FLOW_SPEED = 3; // Pixels per frame for the "head" of the flow
const HOLD_DURATION = 15; // Frames to hold after completion before fading
const FADE_DURATION = 30; // Frames to fade out over
// --- End Configuration ---

class Flow {
  constructor(startX, startY, gridW, gridH) {
    this.ctx = null; // Will be set later
    this.path = [{ x: startX, y: startY }];
    this.gridW = gridW;
    this.gridH = gridH;
    this.generatePath();

    this.currentSegment = 0;
    this.segmentProgress = 0; // Pixels drawn on the current segment
    this.state = 'drawing'; // 'drawing', 'holding', 'fading'
    this.life = HOLD_DURATION + FADE_DURATION;
    this.speed = FLOW_SPEED * (0.8 + Math.random() * 0.4); // Slight speed variation
  }

  generatePath() {
    let currentX = this.path[0].x;
    let currentY = this.path[0].y;
    let currentDirection = Math.floor(Math.random() * 4); // 0: R, 1: L, 2: D, 3: U
    const numSegments = MIN_SEGMENTS + Math.floor(Math.random() * (MAX_SEGMENTS - MIN_SEGMENTS + 1));

    for (let i = 0; i < numSegments; i++) {
      const segmentLength = (SEGMENT_LENGTH_MIN + Math.floor(Math.random() * (SEGMENT_LENGTH_MAX - SEGMENT_LENGTH_MIN + 1))) * GRID_SIZE;
      let nextX = currentX;
      let nextY = currentY;

      // Try to avoid immediate reversal, prefer turning
      const possibleDirections = [0, 1, 2, 3].filter(dir => dir !== (currentDirection ^ 1)); // Exclude opposite direction
      currentDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      switch (currentDirection) {
        case 0: nextX += segmentLength; break; // Right
        case 1: nextX -= segmentLength; break; // Left
        case 2: nextY += segmentLength; break; // Down
        case 3: nextY -= segmentLength; break; // Up
      }

      // Clamp to grid boundaries (simple clamping)
      nextX = Math.max(0, Math.min(nextX, this.gridW * GRID_SIZE));
      nextY = Math.max(0, Math.min(nextY, this.gridH * GRID_SIZE));

       // Prevent zero-length segments if clamped
       if (nextX === currentX && nextY === currentY) {
           break; // Stop path generation if stuck
       }

      this.path.push({ x: nextX, y: nextY });
      currentX = nextX;
      currentY = nextY;
    }
     // Ensure path has at least two points
     if (this.path.length < 2) {
        // Add a minimal segment if generation failed
        let fallbackX = this.path[0].x + GRID_SIZE;
        let fallbackY = this.path[0].y;
        fallbackX = Math.max(0, Math.min(fallbackX, this.gridW * GRID_SIZE));
        fallbackY = Math.max(0, Math.min(fallbackY, this.gridH * GRID_SIZE));
        if(fallbackX !== this.path[0].x || fallbackY !== this.path[0].y) {
            this.path.push({ x: fallbackX, y: fallbackY });
        } else {
            // If still stuck (e.g., corner), mark as immediately done
             this.state = 'fading';
             this.life = FADE_DURATION;
        }
    }
  }

  update() {
    if (this.state === 'drawing') {
      const start = this.path[this.currentSegment];
      const end = this.path[this.currentSegment + 1];
      const segmentDx = end.x - start.x;
      const segmentDy = end.y - start.y;
      const segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);

      this.segmentProgress += this.speed;

      if (this.segmentProgress >= segmentLength) {
        this.segmentProgress = segmentLength; // Cap progress at segment end
        this.currentSegment++;
        if (this.currentSegment >= this.path.length - 1) {
          this.state = 'holding';
          this.life = HOLD_DURATION; // Start hold timer
        } else {
           this.segmentProgress = 0; // Reset for next segment
        }
      }
    } else if (this.state === 'holding') {
      this.life--;
      if (this.life <= 0) {
        this.state = 'fading';
        this.life = FADE_DURATION; // Start fade timer
      }
    } else if (this.state === 'fading') {
      this.life--;
      if (this.life <= 0) {
        return false; // Signal removal
      }
    }
    return true; // Still active
  }

  draw(ctx) {
     if (!this.ctx) this.ctx = ctx; // Store context if not already set

    let alpha = 1.0;
    if (this.state === 'fading') {
      alpha = Math.max(0, this.life / FADE_DURATION);
    }

    ctx.lineCap = "round";
    ctx.shadowColor = GLOW_COLOR;
    ctx.shadowBlur = 5; // Subtle glow

    // Draw completed segments (slightly faded)
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(0, 190, 255, ${alpha * 0.4})`; // FLOW_COMPLETED_COLOR with alpha
    ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i <= this.currentSegment; i++) {
      ctx.lineTo(this.path[i].x, this.path[i].y);
    }
    ctx.stroke();


    // Draw the currently active segment (brighter)
    if (this.state === 'drawing' && this.currentSegment < this.path.length - 1) {
        const start = this.path[this.currentSegment];
        const end = this.path[this.currentSegment + 1];
        const segmentDx = end.x - start.x;
        const segmentDy = end.y - start.y;
        const segmentLength = Math.max(1, Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy)); // Avoid division by zero
        const progressRatio = this.segmentProgress / segmentLength;

        const currentX = start.x + segmentDx * progressRatio;
        const currentY = start.y + segmentDy * progressRatio;

        ctx.beginPath();
        ctx.lineWidth = 2; // Slightly thicker active part
        ctx.strokeStyle = `rgba(0, 190, 255, ${alpha * 0.9})`; // FLOW_COLOR with alpha
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Draw a brighter "head"
        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`; // Brighter head color
        ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

     // Reset shadow for other elements if needed (though here we redraw everything)
     ctx.shadowBlur = 0;
  }
}

const ModernGridBackground = ({ active }) => {
  const canvasRef = useRef(null);
  const flows = useRef([]);
  const animationFrameId = useRef(null);
  const gridInfo = useRef({ cols: 0, rows: 0, width: 0, height: 0 });

  const drawGrid = useCallback((ctx, width, height) => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;

    gridInfo.current.cols = Math.ceil(width / GRID_SIZE);
    gridInfo.current.rows = Math.ceil(height / GRID_SIZE);

    for (let i = 1; i < gridInfo.current.cols; i++) {
      const x = i * GRID_SIZE;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let i = 1; i < gridInfo.current.rows; i++) {
      const y = i * GRID_SIZE;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }, []); // GRID_COLOR is constant, no dependency needed

  const animate = useCallback((ctx) => {
    const { width, height } = gridInfo.current; // Use stored dimensions

    // Clear canvas
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height);

    // Spawn new flows?
    if (flows.current.length < MAX_FLOWS && Math.random() < FLOW_SPAWN_RATE) {
      const startCol = Math.floor(Math.random() * gridInfo.current.cols);
      const startRow = Math.floor(Math.random() * gridInfo.current.rows);
      const startX = startCol * GRID_SIZE;
      const startY = startRow * GRID_SIZE;
      // Pass grid dimensions to Flow constructor for boundary checks
      const newFlow = new Flow(startX, startY, gridInfo.current.cols, gridInfo.current.rows);
       if (newFlow.path.length >= 2) { // Only add if path generation was successful
           flows.current.push(newFlow);
       }
    }

    // Update and draw flows
    ctx.save(); // Save context state before drawing flows with effects
    for (let i = flows.current.length - 1; i >= 0; i--) {
      const flow = flows.current[i];
      if (flow.update()) {
        flow.draw(ctx);
      } else {
        flows.current.splice(i, 1); // Remove dead flow
      }
    }
     ctx.restore(); // Restore context state

    animationFrameId.current = requestAnimationFrame(() => animate(ctx));
  }, [drawGrid]); // Include drawGrid

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      flows.current = []; // Clear flows when inactive/unmounting
      return;
    }

    const ctx = canvas.getContext('2d');

    const resize = () => {
      gridInfo.current.width = window.innerWidth;
      gridInfo.current.height = window.innerHeight;
      canvas.width = gridInfo.current.width;
      canvas.height = gridInfo.current.height;
      // No need to reset flows on resize, they use grid dimensions now
      // flows.current = []; // Optional: uncomment to clear flows on resize
    };

    const startAnimation = () => {
        resize(); // Set initial size
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        animate(ctx); // Start the loop
    }

    window.addEventListener('resize', resize);
    startAnimation();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      flows.current = []; // Clear flows on unmount
    };
  }, [active, animate]); // Add animate dependency

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      // style={{ mixBlendMode: 'screen' }} // Optional: Add back if desired
    />
  );
};


export default ModernGridBackground;