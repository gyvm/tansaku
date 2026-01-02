import React, { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ProcessingOption, ProcessType, OutputFormat } from './components/ProcessingOption';
import { ResultView } from './components/ResultView';

import './styles/globals.css';

// Mock Result Generator
const generateMockResult = (type: ProcessType, format: OutputFormat): string => {
  if (type === 'transcribe') {
    if (format === 'compact') {
      return `本日はお集まりいただきありがとうございます。今回のプロジェクトの進捗について報告します。現在、UIデザインのフェーズに入っており、来週にはプロトタイプが完成する予定です。バックエンドの開発も順調で、APIの定義書はほぼ固まりました。課題としては、外部連携APIの仕様変更への対応が挙げられますが、これについても既に調査を進めています。次回の定例は金曜日の15時からとさせてください。以上です。`;
    }
    return `[00:00:05] 田中:
本日はお集まりいただきありがとうございます。今回のプロジェクトの進捗について報告します。

[00:00:15] 佐藤:
現在、UIデザインのフェーズに入っており、来週にはプロトタイプが完成する予定です。

[00:00:25] 田中:
ありがとうございます。バックエンドの方はどうですか？

[00:00:30] 鈴木:
はい、順調です。APIの定義書はほぼ固まりました。
ただ、課題としては、外部連携APIの仕様変更への対応が挙げられます。

[00:00:45] 田中:
なるほど。それについてはどう対応する予定ですか？

[00:00:50] 鈴木:
既に調査を進めており、影響範囲の特定を行っています。

[00:01:00] 田中:
わかりました。では次回の定例は金曜日の15時からとさせてください。以上です。`;
  } else {
    // Minutes
    if (format === 'compact') {
      return `# 議事録（簡易）

## 会議概要
- **日時**: 2024-03-20 10:00 - 10:30
- **議題**: プロジェクト進捗報告

## 決定事項
- 次回定例は金曜15:00から開催
- 外部API仕様変更については鈴木が調査を継続

## TODO
- [ ] プロトタイプ作成完了（佐藤） - 期限: 来週
- [ ] 外部API影響範囲の特定（鈴木）`;
    }
    return `# 第5回 プロジェクト定例議事録

## 1. 会議概要
- **日時**: 2024年3月20日 10:00 - 10:30
- **参加者**: 田中、佐藤、鈴木
- **目的**: 開発進捗の確認と課題の共有

## 2. アジェンダ別要約

### (1) デザイン進捗
佐藤より報告。UIデザインフェーズは順調。来週中にプロトタイプの完成を見込んでいる。

### (2) バックエンド進捗
鈴木より報告。API定義書はほぼフィックス。
外部連携APIの仕様変更が発生しているが、現在調査中で大きな遅延のリスクは低いと判断。

## 3. 決定事項
- デザインプロトタイプは来週中に共有する。
- 外部API変更への対応方針は、鈴木の調査結果を待って決定する。
- 次回定例は金曜日の15時から実施する。

## 4. アクションアイテム
| 担当 | 内容 | 期限 |
|---|---|---|
| 佐藤 | プロトタイプ完成 | 次週中 |
| 鈴木 | 外部API変更の影響範囲特定 | 明日まで |
| 田中 | 次回MTGの招待送付 | 本日中 |`;
  }
};

type Step = 'upload' | 'config' | 'processing' | 'result';

export default function VoiceNotesStepApp() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [processType, setProcessType] = useState<ProcessType | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [resultText, setResultText] = useState<string>('');

  const handleNext = () => {
    if (currentStep === 'upload' && file) {
      setCurrentStep('config');
    } else if (currentStep === 'config' && processType && outputFormat) {
      startProcessing();
    }
  };

  const startProcessing = () => {
    setCurrentStep('processing');
    // Mock processing time
    setTimeout(() => {
      setResultText(generateMockResult(processType!, outputFormat!));
      setCurrentStep('result');
    }, 2500);
  };

  const handleReset = () => {
    setFile(null);
    setProcessType(null);
    setOutputFormat(null);
    setResultText('');
    setCurrentStep('upload');
  };

  const handleDownload = (format: 'md' | 'txt') => {
    const element = document.createElement("a");
    const file = new Blob([resultText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `meeting_minutes.${format}`;
    document.body.appendChild(element);
    element.click();
  };

  // Render Helpers
  const renderStepIndicator = () => {
    const steps = [
      { id: 'upload', label: 'アップロード' },
      { id: 'config', label: '設定' },
      { id: 'processing', label: '処理中' },
      { id: 'result', label: '完了' },
    ];

    return (
      <div className="flex items-center justify-center gap-2 mb-8 text-sm font-medium">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isPast = steps.findIndex(s => s.id === currentStep) > idx;
          return (
            <div key={step.id} className="flex items-center gap-2">
              <span className={`
                w-6 h-6 rounded-full flex items-center justify-center border
                ${isActive || isPast
                  ? 'bg-[var(--vn-step-primary)] border-[var(--vn-step-primary)] text-white'
                  : 'bg-white border-gray-300 text-gray-400'}
              `}>
                {idx + 1}
              </span>
              <span className={isActive || isPast ? 'text-[var(--vn-step-text-main)]' : 'text-gray-400'}>
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-[1px] ${isPast ? 'bg-[var(--vn-step-primary)]' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="vn-step-wrapper flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-[var(--vn-step-text-main)] mb-2">
          AI Voice Notes
        </h1>
        <p className="text-[var(--vn-step-text-muted)]">
          会議音声を自動で議事録・文字起こしへ
        </p>
      </div>

      {/* Progress */}
      {renderStepIndicator()}

      {/* Main Card */}
      <div className="w-full max-w-4xl min-h-[500px] flex flex-col relative">

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          {currentStep === 'upload' && (
            <FileUpload
              onFileSelect={setFile}
              selectedFile={file}
              onClear={() => setFile(null)}
            />
          )}

          {currentStep === 'config' && (
            <ProcessingOption
              processType={processType}
              setProcessType={setProcessType}
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
            />
          )}

          {currentStep === 'processing' && (
            <div className="text-center fade-in">
              <Loader2 size={48} className="text-[var(--vn-step-primary)] animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-[var(--vn-step-text-main)] mb-2">
                AIが解析中...
              </h3>
              <p className="text-[var(--vn-step-text-muted)]">
                これには数分かかる場合があります。<br/>画面を閉じずにお待ちください。
              </p>
            </div>
          )}

          {currentStep === 'result' && (
            <ResultView
              resultText={resultText}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Action Footer (Step 1 & 2 only) */}
        {(currentStep === 'upload' || currentStep === 'config') && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 'upload' && !file) ||
                (currentStep === 'config' && (!processType || !outputFormat))
              }
              className={`
                flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-all
                ${(currentStep === 'upload' && !file) || (currentStep === 'config' && (!processType || !outputFormat))
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-[var(--vn-step-primary)] text-white hover:bg-[var(--vn-step-primary-hover)] hover:shadow-xl hover:-translate-y-1'
                }
              `}
            >
              次へ進む
              <ChevronRight size={20} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
