import React, { useState } from 'react';
import { Upload, FileText, Play, Download, Loader2 } from 'lucide-react';

interface DashboardPanelProps {
  onProcess: (file: File, type: string, format: string) => void;
  isProcessing: boolean;
  result: string | null;
  onDownload: () => void;
}

export function DashboardPanel({ onProcess, isProcessing, result, onDownload }: DashboardPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('minutes');
  const [format, setFormat] = useState('detailed');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRun = () => {
    if (file) {
      onProcess(file, type, format);
    }
  };

  return (
    <div className="flex-1 p-8 ml-64 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--vn-dash-text-main)]">新規作成</h1>
        <p className="text-[var(--vn-dash-text-muted)]">音声ファイルをアップロードしてAI処理を開始します。</p>
      </header>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">

        {/* Left Col: Controls */}
        <div className="col-span-4 space-y-6 flex flex-col">

          {/* Upload Card */}
          <div className="vn-dash-panel p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Upload size={18} /> ソース音声
            </h3>
            <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--vn-dash-primary)] hover:bg-gray-50 transition">
              <input type="file" className="hidden" onChange={handleFileChange} accept=".mp3,.wav,.m4a" />
              {file ? (
                <div className="text-center px-4">
                  <p className="font-bold text-[var(--vn-dash-primary)] truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p className="font-medium">Click to Upload</p>
                  <p className="text-xs">mp3, wav, m4a</p>
                </div>
              )}
            </label>
          </div>

          {/* Config Card */}
          <div className="vn-dash-panel p-6 flex-1">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <FileText size={18} /> 設定
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">処理タイプ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setType('transcribe')}
                    className={`px-3 py-2 rounded text-sm font-medium border transition
                      ${type === 'transcribe' ? 'bg-[var(--vn-dash-primary)] text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}
                    `}
                  >
                    文字起こし
                  </button>
                  <button
                    onClick={() => setType('minutes')}
                    className={`px-3 py-2 rounded text-sm font-medium border transition
                      ${type === 'minutes' ? 'bg-[var(--vn-dash-primary)] text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}
                    `}
                  >
                    議事録
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">詳細レベル</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat('compact')}
                    className={`px-3 py-2 rounded text-sm font-medium border transition
                      ${format === 'compact' ? 'border-[var(--vn-dash-primary)] text-[var(--vn-dash-primary)] bg-green-50' : 'bg-white text-gray-600 border-gray-300'}
                    `}
                  >
                    コンパクト
                  </button>
                  <button
                    onClick={() => setFormat('detailed')}
                    className={`px-3 py-2 rounded text-sm font-medium border transition
                      ${format === 'detailed' ? 'border-[var(--vn-dash-primary)] text-[var(--vn-dash-primary)] bg-green-50' : 'bg-white text-gray-600 border-gray-300'}
                    `}
                  >
                    詳細
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleRun}
                disabled={!file || isProcessing}
                className="w-full vn-dash-btn-primary h-12 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                実行する
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Output */}
        <div className="col-span-8 vn-dash-panel p-0 overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-[var(--vn-dash-border)] bg-gray-50 flex justify-between items-center">
            <span className="font-bold text-gray-600">Output Preview</span>
            {result && (
              <button
                onClick={onDownload}
                className="text-sm flex items-center gap-1 text-[var(--vn-dash-primary)] hover:underline"
              >
                <Download size={16} /> ダウンロード
              </button>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-white">
            {isProcessing ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={48} className="animate-spin text-[var(--vn-dash-accent)] mb-4" />
                <p>Generating...</p>
              </div>
            ) : result ? (
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed slide-in">
                {result}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl m-4">
                <FileText size={48} className="mb-2 opacity-20" />
                <p>ここに結果が表示されます</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
