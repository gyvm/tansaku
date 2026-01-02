import React from 'react';
import { FileText, List, ListChecks, AlignLeft } from 'lucide-react';

export type ProcessType = 'transcribe' | 'minutes';
export type OutputFormat = 'compact' | 'detailed';

interface ProcessingOptionProps {
  processType: ProcessType | null;
  setProcessType: (type: ProcessType) => void;
  outputFormat: OutputFormat | null;
  setOutputFormat: (format: OutputFormat) => void;
}

export function ProcessingOption({
  processType,
  setProcessType,
  outputFormat,
  setOutputFormat
}: ProcessingOptionProps) {

  return (
    <div className="w-full max-w-lg mx-auto space-y-8 fade-in">

      {/* Step 1: Process Type */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[var(--vn-step-text-main)] text-center">
          処理内容を選択
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setProcessType('transcribe');
              setOutputFormat('compact'); // reset format to default
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col items-center gap-3
              ${processType === 'transcribe'
                ? 'border-[var(--vn-step-primary)] bg-[var(--vn-step-secondary)] text-[var(--vn-step-primary)]'
                : 'border-transparent bg-white shadow-sm hover:border-gray-200 text-gray-600'
              }
            `}
          >
            <FileText size={32} />
            <span className="font-bold">文字起こし</span>
          </button>

          <button
            onClick={() => {
              setProcessType('minutes');
              setOutputFormat('compact'); // reset format to default
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col items-center gap-3
              ${processType === 'minutes'
                ? 'border-[var(--vn-step-primary)] bg-[var(--vn-step-secondary)] text-[var(--vn-step-primary)]'
                : 'border-transparent bg-white shadow-sm hover:border-gray-200 text-gray-600'
              }
            `}
          >
            <List size={32} />
            <span className="font-bold">議事録作成</span>
          </button>
        </div>
      </div>

      {/* Step 2: Output Format (Conditional) */}
      {processType && (
        <div className="space-y-3 fade-in">
          <h3 className="text-lg font-bold text-[var(--vn-step-text-main)] text-center">
            出力フォーマット
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setOutputFormat('compact')}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200
                ${outputFormat === 'compact'
                  ? 'border-[var(--vn-step-primary)] ring-1 ring-[var(--vn-step-primary)]'
                  : 'border-gray-100 bg-white hover:border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlignLeft size={20} className={outputFormat === 'compact' ? 'text-[var(--vn-step-primary)]' : 'text-gray-400'} />
                <span className={`font-bold ${outputFormat === 'compact' ? 'text-[var(--vn-step-primary)]' : 'text-gray-700'}`}>
                  コンパクト
                </span>
              </div>
              <p className="text-xs text-[var(--vn-step-text-muted)] leading-relaxed">
                {processType === 'transcribe'
                  ? '話者区別なし。会話内容をそのままテキスト化。'
                  : '会議概要と決定事項のみ。1ページで収まる要約。'
                }
              </p>
            </button>

            <button
              onClick={() => setOutputFormat('detailed')}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200
                ${outputFormat === 'detailed'
                  ? 'border-[var(--vn-step-primary)] ring-1 ring-[var(--vn-step-primary)]'
                  : 'border-gray-100 bg-white hover:border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <ListChecks size={20} className={outputFormat === 'detailed' ? 'text-[var(--vn-step-primary)]' : 'text-gray-400'} />
                <span className={`font-bold ${outputFormat === 'detailed' ? 'text-[var(--vn-step-primary)]' : 'text-gray-700'}`}>
                  詳細
                </span>
              </div>
              <p className="text-xs text-[var(--vn-step-text-muted)] leading-relaxed">
                {processType === 'transcribe'
                  ? '話者ラベル、改行あり。会話の流れを追える形式。'
                  : 'アジェンダ別要約、発言要点、TODOを含む詳細版。'
                }
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
