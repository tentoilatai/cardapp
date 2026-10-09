import React from 'react';

export const AuroraBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FFF0F5 0%, #F5EEFF 35%, #EDF5FF 70%, #FFF3F6 100%)'
      }}
    >
      {/* Aurora Ambient Gradient Blobs (Luminous Saturated Apple Refraction Orbs - Section 2.5) */}
      {/* Blob 1: Luminous Rose/Pink Refraction Hotspot behind Topbar & Top Blocks */}
      <div
        className="absolute -top-[10%] -left-[6%] w-[62vw] h-[62vw] rounded-full opacity-85 filter blur-[75px] animate-blob-1"
        style={{
          background: 'radial-gradient(circle, rgba(244, 63, 142, 0.58) 0%, rgba(226, 122, 161, 0.35) 45%, transparent 75%)'
        }}
      />
      {/* Blob 2: Vibrant Violet & Orchid Light Wave */}
      <div
        className="absolute top-[20%] -right-[8%] w-[56vw] h-[56vw] rounded-full opacity-80 filter blur-[85px] animate-blob-2"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.52) 0%, rgba(192, 132, 252, 0.28) 45%, transparent 75%)'
        }}
      />
      {/* Blob 3: Warm Radiant Amber Glow (Bottom-Left) */}
      <div
        className="absolute -bottom-[12%] left-[12%] w-[64vw] h-[56vw] rounded-full opacity-75 filter blur-[90px] animate-blob-3"
        style={{
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.44) 0%, rgba(253, 186, 116, 0.24) 50%, transparent 75%)'
        }}
      />
      {/* Blob 4: Radiant Sky Cyan Accents (Bottom-Right) */}
      <div
        className="absolute top-[55%] right-[25%] w-[48vw] h-[48vw] rounded-full opacity-75 filter blur-[80px] animate-blob-1"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.46) 0%, rgba(56, 189, 248, 0.25) 50%, transparent 75%)'
        }}
      />
      
      {/* Subtle Micro-Noise SVG overlay for crystal refraction texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] mix-blend-overlay">
        <filter id="aurora-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#aurora-noise)" />
      </svg>
      {children}
    </div>
  );
};

