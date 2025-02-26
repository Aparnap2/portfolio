// components/chatbot/QuantumBackground.jsx
'use client';
import { useEffect, useRef } from "react";

class QuantumParticle {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.alpha = 0.7;
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
        this.color = Math.random() > 0.5 ?
            `rgba(100, 210, 255, ${this.alpha})` :
            `rgba(138, 99, 210, ${this.alpha})`;
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
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
    }

    update(width, height) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Bounce with dampening
        if (this.x < 0 || this.x > width) {
            this.velocity.x *= -0.9;
            this.x = Math.max(0, Math.min(this.x, width));
        }
        if (this.y < 0 || this.y > height) {
            this.velocity.y *= -0.9;
            this.y = Math.max(0, Math.min(this.y, height));
        }

        this.size = this.baseSize * (0.8 + Math.sin(Date.now() * 0.005) * 0.2);
        this.draw();
    }
}

const QuantumBackground = ({ active }) => {
    const canvasRef = useRef(null);
    const particles = useRef([]);

    useEffect(() => {
        if (!active || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        let animationFrame;

        const resize = () => {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            particles.current = Array.from({ length: 40 }, () =>
                new QuantumParticle(ctx, canvasRef.current.width, canvasRef.current.height)
            );
        };

        const animate = () => {
            ctx.fillStyle = 'rgba(10, 10, 15, 1)'; // Solid background
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            particles.current.forEach(particle =>
                particle.update(canvasRef.current.width, canvasRef.current.height)
            );

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