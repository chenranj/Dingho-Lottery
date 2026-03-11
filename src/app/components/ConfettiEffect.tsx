"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ConfettiEffectProps {
  trigger: boolean;
  options?: confetti.Options;
}

const DEFAULT_COLORS = [
  "#a78bfa",
  "#c4b5fd",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#60a5fa",
];

export function ConfettiEffect({ trigger, options = {} }: ConfettiEffectProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (!trigger || fired.current) return;
    fired.current = true;

    const duration = 2500;
    const end = Date.now() + duration;
    const defaults = {
      spread: 100,
      ticks: 60,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 35,
      colors: DEFAULT_COLORS,
    };

    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        ...defaults,
        particleCount: 3,
        origin: { x: Math.random() * 0.5 + 0.25, y: Math.random() * 0.4 },
        ...options,
      });
      confetti({
        ...defaults,
        particleCount: 3,
        origin: { x: Math.random() * 0.5 + 0.25, y: Math.random() * 0.4 },
        angle: 120,
        spread: 80,
        ...options,
      });
      requestAnimationFrame(frame);
    };
    frame();

    const t = setTimeout(() => {
      fired.current = false;
    }, duration + 500);
    return () => clearTimeout(t);
  }, [trigger, options]);

  return null;
}
