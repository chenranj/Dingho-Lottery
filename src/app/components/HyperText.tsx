"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

interface HyperTextProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  startOnView?: boolean;
}

export function HyperText({
  children,
  className = "",
  duration = 800,
  delay = 0,
  startOnView = true,
}: HyperTextProps) {
  const [displayText, setDisplayText] = useState<string[]>(() => children.split(""));
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!startOnView) {
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setStarted(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnView, delay]);

  useEffect(() => {
    if (!started) return;
    let rafId: number;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const revealed = Math.floor(progress * children.length);
      setDisplayText((prev) =>
        prev.map((_, i) =>
          i < revealed ? children[i] : CHARS[Math.floor(Math.random() * CHARS.length)]
        )
      );
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [started, children, duration]);

  return (
    <span ref={ref} className={className}>
      {displayText.join("")}
    </span>
  );
}
