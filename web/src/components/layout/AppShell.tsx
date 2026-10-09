import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuroraBackground } from '../glass/AuroraBackground';
import { GlassSidebar } from './GlassSidebar';
import { BottomNav } from './BottomNav';
import { MustChangePasswordModal } from './MustChangePasswordModal';

export const AppShell: React.FC = () => {
  return (
    <div className="relative min-h-[100dvh] lg:h-[100dvh] w-full flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#E27AA1]/30 selection:text-[#3B2A33]">
      {/* Background aurora ambient animation */}
      <AuroraBackground />

      {/* Desktop Left Sidebar: Only visible on >= 1024px */}
      <GlassSidebar />

      {/* Main App Content Viewport */}
      <div className="flex-1 w-full min-w-0 flex flex-col h-auto lg:h-[100dvh] lg:overflow-hidden relative">
        <Outlet />
      </div>

      {/* Mobile / Tablet Bottom Navigation: Only visible on < 1024px */}
      <BottomNav />

      {/* Forced Password Change Modal */}
      <MustChangePasswordModal />
    </div>
  );
};
