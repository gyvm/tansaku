import { FolderOpen } from "lucide-react";

interface StorageSectionProps {
  path: string;
  onOpenFolder: () => void;
}

export function StorageSection({ path, onOpenFolder }: StorageSectionProps) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Storage</p>
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex-1 truncate text-xs text-slate-500 font-mono" title={path}>
          {path}
        </div>
        <button
          onClick={onOpenFolder}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-700"
          title="Open Folder"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
