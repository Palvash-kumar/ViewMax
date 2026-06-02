'use client';

import { ReactNode } from 'react';

interface DesignerLayoutProps {
  toolbar: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export default function DesignerLayout({
  toolbar,
  leftPanel,
  centerPanel,
  rightPanel,
}: DesignerLayoutProps) {
  return (
    <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-14 border-b border-[var(--color-border)] flex-shrink-0">
        {toolbar}
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 border-r border-[var(--color-border)] overflow-y-auto flex-shrink-0 designer-panel">
          {leftPanel}
        </div>

        {/* Center Canvas */}
        <div className="flex-1 overflow-hidden relative">
          {centerPanel}
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-[var(--color-border)] overflow-y-auto flex-shrink-0 designer-panel">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
