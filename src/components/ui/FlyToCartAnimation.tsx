import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  image?: string;
}

export function FlyToCartAnimation() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handleCartAdd = (e: Event) => {
      const customEvent = e as CustomEvent<{ x?: number; y?: number; image?: string }>;
      const startX = customEvent.detail?.x || window.innerWidth / 2;
      const startY = customEvent.detail?.y || window.innerHeight / 2;

      let targetX = window.innerWidth - 55;
      let targetY = 35;
      const cartBtn = document.getElementById('navbar-cart-button');
      if (cartBtn) {
        const rect = cartBtn.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      const newParticle: Particle = {
        id: Math.random().toString(36).substring(2, 9),
        startX,
        startY,
        targetX,
        targetY,
        image: customEvent.detail?.image
      };

      setParticles(prev => [...prev, newParticle]);

      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 850);
    };

    window.addEventListener('cart-item-added', handleCartAdd);
    return () => window.removeEventListener('cart-item-added', handleCartAdd);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {/* SVG Orange Curved Flight Trajectory Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {particles.map(p => {
          const midX = (p.startX + p.targetX) / 2;
          const midY = Math.min(p.startY, p.targetY) - 110;
          return (
            <motion.path
              key={`path-${p.id}`}
              d={`M ${p.startX} ${p.startY} Q ${midX} ${midY} ${p.targetX} ${p.targetY}`}
              fill="none"
              stroke="#f97316"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.9 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0.9, 0.7, 0] }}
              transition={{ duration: 0.85, ease: "easeInOut" }}
            />
          );
        })}
      </svg>

      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{
              x: p.startX - 24,
              y: p.startY - 24,
              scale: 1,
              opacity: 1
            }}
            animate={{
              x: [p.startX - 24, (p.startX + p.targetX) / 2, p.targetX - 12],
              y: [p.startY - 24, Math.min(p.startY, p.targetY) - 110, p.targetY - 12],
              scale: [1, 1.35, 0.2],
              opacity: [1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="absolute top-0 left-0 w-12 h-12 rounded-full border-2 border-orange-500 bg-white shadow-2xl overflow-hidden flex items-center justify-center p-0.5 ring-4 ring-orange-500/30"
          >
            {p.image ? (
              <img src={p.image} alt="Cart item" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white font-extrabold text-xs rounded-full">
                +1
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
