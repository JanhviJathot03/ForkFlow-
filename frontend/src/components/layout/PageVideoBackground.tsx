'use client';

import { FadingVideo } from '@/components/landing/FadingVideo';

export function PageVideoBackground({
  src,
  videoOpacity = 0.22,
  scrimOpacity = 0.72,
}: {
  src: string;
  videoOpacity?: number;
  videoClassName?: string;
  scrimOpacity?: number;
}) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      <FadingVideo
        src={src}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: videoOpacity }}
      />
      <div className="absolute inset-0 bg-black" style={{ opacity: scrimOpacity }} />
    </div>
  );
}
