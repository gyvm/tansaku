import React from 'react';
import { Monitor, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b border-surfaceVariant bg-surface/50 backdrop-blur-md flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center gap-2">
        <Monitor className="w-5 h-5 text-primary" />
        <span className="font-mono font-bold text-lg tracking-widest text-white">
          GLITCH<span className="text-primary">ART</span>MAKER
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-xs font-mono text-textMuted">
          <Zap className="w-3 h-3 text-secondary" />
          <span>v1.0.0</span>
        </div>
      </div>
    </header>
  );
};
