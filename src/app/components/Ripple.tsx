"use client";

import { memo } from "react";

interface RippleProps {
  className?: string;
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export const Ripple = memo(function Ripple({
  className = "",
  mainCircleSize = 180,
  mainCircleOpacity = 0.2,
  numCircles = 6,
}: RippleProps) {
  return (
    <div className={`ripple-container ${className}`} aria-hidden>
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 60;
        const opacity = Math.max(0, mainCircleOpacity - i * 0.025);
        return (
          <div
            key={i}
            className="ripple-circle"
            style={{
              width: size,
              height: size,
              opacity,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        );
      })}
    </div>
  );
});
