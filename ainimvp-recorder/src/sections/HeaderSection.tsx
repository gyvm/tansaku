import { Pencil } from "lucide-react";

interface HeaderSectionProps {
  title: string;
  onEdit?: () => void;
}

export function HeaderSection({ title, onEdit }: HeaderSectionProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Session Title</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          {title}
        </h2>
      </div>
      {/* TODO: セッション管理機能実装時に有効化 */}
      <button
        type="button"
        onClick={onEdit}
        disabled
        title="Coming soon"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-300 shadow-sm cursor-not-allowed opacity-50"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
