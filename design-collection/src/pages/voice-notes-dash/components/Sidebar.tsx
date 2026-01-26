import React from 'react';
import { LayoutDashboard, FileAudio, Settings, HelpCircle, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Sidebar() {
  return (
    <div className="vn-dash-sidebar w-64 h-screen flex flex-col fixed left-0 top-0 z-10">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--vn-dash-border)]">
        <div className="w-8 h-8 rounded bg-[var(--vn-dash-primary)] flex items-center justify-center mr-3">
          <FileAudio className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-lg tracking-tight">VoiceNotes</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <div className="px-2 mb-2 text-xs font-semibold text-[var(--vn-dash-text-muted)] uppercase tracking-wider">
          Menu
        </div>
        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--vn-dash-bg)] text-[var(--vn-dash-primary)] font-medium">
          <LayoutDashboard size={20} />
          ダッシュボード
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--vn-dash-text-muted)] hover:bg-gray-50 hover:text-[var(--vn-dash-text-main)] transition">
          <Settings size={20} />
          設定
        </a>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--vn-dash-border)] space-y-2">
         <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--vn-dash-text-muted)] hover:bg-red-50 hover:text-red-600 transition text-sm">
          <LogOut size={18} />
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
