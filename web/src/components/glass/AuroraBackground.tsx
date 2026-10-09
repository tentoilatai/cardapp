import React from 'react';

export const AuroraBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#F8F9FA] dark:bg-[#0E0E14] transition-colors duration-300"
    >
      {/* Soft warm pink ambient glow at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[800px] h-[260px] rounded-full opacity-30 dark:opacity-15 filter blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(226, 122, 161, 0.4) 0%, transparent 70%)'
        }}
      />
      {children}
    </div>
  );
};



