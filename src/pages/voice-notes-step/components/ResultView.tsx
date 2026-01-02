import React from 'react';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ResultViewProps {
  resultText: string;
  onDownload: (format: 'md' | 'txt') => void;
  onReset: () => void;
}

export function ResultView({ resultText, onDownload, onReset }: ResultViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 fade-in h-full flex flex-col">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--vn-step-primary)]">
          <CheckCircle2 size={24} />
          <h2 className="text-xl font-bold">生成完了</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onDownload('md')}
            className="vn-btn-primary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Download size={16} />
            Markdown
          </button>
          <button
            onClick={() => onDownload('txt')}
            className="vn-btn-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Download size={16} />
            Text
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[400px] bg-white border border-[var(--vn-step-border)] rounded-xl p-6 overflow-y-auto shadow-inner font-mono text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
        {resultText}
      </div>

      <div className="text-center">
        <button
          onClick={onReset}
          className="text-[var(--vn-step-text-muted)] hover:text-[var(--vn-step-text-main)] text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          <RefreshCw size={14} />
          新しいファイルを処理する
        </button>
      </div>
    </div>
  );
}
