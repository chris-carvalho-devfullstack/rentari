// src/components/ui/StarField.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface Star {
  id: number;
  top: string;
  left: string;
  size: string;
  opacity: number;
  animationDuration: string;
  animationDelay: string;
}

export const StarField = () => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const count = 30; // Quantidade de estrelas (mantenha baixo para ser discreto)
    const newStars: Star[] = [];

    for (let i = 0; i < count; i++) {
      newStars.push({
        id: i,
        // Limita as estrelas aos 60% superiores da tela (para não ficar em cima dos prédios)
        top: `${Math.random() * 60}%`, 
        left: `${Math.random() * 100}%`,
        // Tamanho variado entre 1px e 2px
        size: Math.random() > 0.5 ? 'w-0.5 h-0.5' : 'w-1 h-1', 
        // Opacidade baixa para ser discreto
        opacity: Math.random() * 0.5 + 0.2, 
        // Animação de piscar dessincronizada
        animationDuration: `${Math.random() * 3 + 2}s`,
        animationDelay: `${Math.random() * 2}s`,
      });
    }

    setStars(newStars);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute bg-white rounded-full animate-pulse ${star.size}`}
          style={{
            top: star.top,
            left: star.left,
            opacity: star.opacity,
            animationDuration: star.animationDuration,
            animationDelay: star.animationDelay,
          }}
        />
      ))}
    </div>
  );
};