'use client';

import { useEffect, useRef } from 'react';

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55; // seconds

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function FadingVideo({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  const cancelFade = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  };

  const fadeTo = (target: number, durationMs = FADE_MS) => {
    const v = videoRef.current;
    if (!v) return;

    cancelFade();

    const start = performance.now();
    const from = clamp(parseFloat(v.style.opacity || '0') || 0, 0, 1);
    const to = clamp(target, 0, 1);

    const tick = (now: number) => {
      const t = clamp((now - start) / durationMs, 0, 1);
      const next = from + (to - from) * t;
      v.style.opacity = String(next);
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadedData = () => {
      v.style.opacity = '0';
      v.play().catch(() => {});
      fadeTo(1);
    };

    const onTimeUpdate = () => {
      if (fadingOutRef.current) return;
      const remaining = (v.duration || 0) - (v.currentTime || 0);
      if (remaining <= FADE_OUT_LEAD && remaining > 0) {
        fadingOutRef.current = true;
        fadeTo(0);
      }
    };

    const onEnded = () => {
      v.style.opacity = '0';
      setTimeout(() => {
        try {
          v.currentTime = 0;
        } catch {}
        v.play().catch(() => {});
        fadingOutRef.current = false;
        fadeTo(1);
      }, 100);
    };

    v.addEventListener('loadeddata', onLoadedData);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('ended', onEnded);

    return () => {
      cancelFade();
      v.removeEventListener('loadeddata', onLoadedData);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('ended', onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      className={className}
      style={{ opacity: 0, ...style }}
    />
  );
}

