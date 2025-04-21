'use client';
import { useEffect, useRef } from "react";

class QuantumParticle {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.alpha = 0.7;
    this.colorType = Math.random() > 0.5 ? 1 : 2;
    this.color = this.colorType === 1
      ? `rgba(100, 210, 255, ${this.alpha})`
      : `rgba(138, 99, 210, ${this.alpha})`;
    this.reset(width, height);
    this.velocity = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    };
  }

  reset(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 2 + 1;
    this.baseSize = this.size;
  }

  update(width, height, phase) {
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    if (this.x < 0 || this.x > width) {
      this.velocity.x *= -0.9;
      this.x = Math.max(0, Math.min(this.x, width));
    }
    if (this.y < 0 || this.y > height) {
      this.velocity.y *= -0.9;
      this.y = Math.max(0, Math.min(this.y, height));
    }

    this.size = this.baseSize * (0.8 + phase);
  }

  draw() {
    const gradient = this.ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 2
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'transparent');

    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }
}

const QuantumBackground = ({ active }) => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const particlesColor1 = useRef([]);
  const particlesColor2 = useRef([]);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    let animationFrame;

    const resize = () => {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      particles.current = [];
      particlesColor1.current = [];
      particlesColor2.current = [];

      for (let i = 0; i < 40; i++) {
        const particle = new QuantumParticle(ctx, width, height);
        particles.current.push(particle);
        if (particle.colorType === 1) {
          particlesColor1.current.push(particle);
        } else {
          particlesColor2.current.push(particle);
        }
      }
    };

    const animate = () => {
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      const time = Date.now() * 0.005;
      const phase = Math.sin(time) * 0.2;

      particles.current.forEach(particle => particle.update(width, height, phase));

      ctx.fillStyle = 'rgba(10, 10, 15, 1)';
      ctx.fillRect(0, 0, width, height);

      ctx.shadowBlur = 5;

      if (particlesColor1.current.length > 0) {
        ctx.shadowColor = particlesColor1.current[0].color;
        particlesColor1.current.forEach(particle => particle.draw());
      }

      if (particlesColor2.current.length > 0) {
        ctx.shadowColor = particlesColor2.current[0].color;
        particlesColor2.current.forEach(particle => particle.draw());
      }

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default QuantumBackground;