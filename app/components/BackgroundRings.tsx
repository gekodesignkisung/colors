import React, { useEffect, useRef } from 'react';

const COLORS = ['#ff4d4f', '#40a9ff', '#73d13d', '#faad14', '#9254de'];

type Ring = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  color: string;
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function BackgroundRings() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<Ring[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // initialize rings
    const createRings = () => {
      const rings: Ring[] = [];
      for (let i = 0; i < 10; i++) {
        rings.push({
          x: randomBetween(0, canvas.width),
          y: randomBetween(0, canvas.height),
          radius: randomBetween(50, 200),
          speed: randomBetween(0.001, 0.005),
          angle: Math.random() * Math.PI * 2,
          color: COLORS[i % COLORS.length],
        });
      }
      ringsRef.current = rings;
    };

    createRings();

    const animate = () => {
      if (!ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ringsRef.current.forEach((ring) => {
        ring.angle += ring.speed;
        const alpha = 0.3;
        ctx.save();
        ctx.translate(ring.x, ring.y);
        ctx.rotate(ring.angle);
        ctx.beginPath();
        ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
