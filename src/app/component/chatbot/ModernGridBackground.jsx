'use client';
import { useEffect, useState } from 'react';

// Simple, lightweight CSS-only background (no WebGL required)
const ModernGridBackground = ({ active = true }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
        aria-hidden="true"
      />

      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 70%)
          `
        }}
        aria-hidden="true"
      />

      {/* Simple grid pattern - CSS only */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: active ? 'gridFloat 20s ease-in-out infinite' : 'none'
        }}
        aria-hidden="true"
      />

      {/* Subtle animated particles */}
      {active && (
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particleFloat ${10 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Bottom gradient for depth */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900/50 to-transparent"
        aria-hidden="true"
      />

      {/* Custom styles */}
      <style jsx>{`
        @keyframes gridFloat {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(-10px, -10px);
          }
          50% {
            transform: translate(10px, -5px);
          }
          75% {
            transform: translate(-5px, 10px);
          }
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.2;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes gridFloat {
            0%, 100% { transform: translate(0, 0); }
          }

          @keyframes particleFloat {
            0%, 100% { transform: translateY(0) translateX(0); }
          }
        }
      `}</style>
    </div>
  );
};

export default ModernGridBackground;