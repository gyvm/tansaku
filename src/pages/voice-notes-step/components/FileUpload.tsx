import React, { useRef, useState } from 'react';
import { Upload, FileAudio, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export function FileUpload({ onFileSelect, selectedFile, onClear }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/mp3'];
    // Simple validation (can be expanded)
    // Note: checking extension as MIME types can be tricky
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['mp3', 'wav', 'm4a'].includes(ext || '')) {
      onFileSelect(file);
    } else {
      alert('対応形式は mp3, wav, m4a です。');
    }
  };

  if (selectedFile) {
    return (
      <div className="w-full max-w-md mx-auto fade-in">
        <div className="vn-card rounded-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--vn-step-secondary)] flex items-center justify-center text-[var(--vn-step-primary)]">
              <FileAudio size={24} />
            </div>
            <div>
              <p className="font-medium text-[var(--vn-step-text-main)] truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-sm text-[var(--vn-step-text-muted)]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-md mx-auto border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 fade-in
        ${isDragging
          ? 'border-[var(--vn-step-primary)] bg-[var(--vn-step-secondary)]'
          : 'border-gray-300 hover:border-[var(--vn-step-primary)] hover:bg-white'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.m4a"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-4 text-[var(--vn-step-text-muted)]">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
          <Upload size={32} className="text-gray-400" />
        </div>
        <div>
          <p className="text-lg font-medium text-[var(--vn-step-text-main)]">
            音声ファイルをアップロード
          </p>
          <p className="text-sm mt-1">
            またはドラッグ＆ドロップ
          </p>
        </div>
        <p className="text-xs text-gray-400">
          mp3, wav, m4a (最大200MB)
        </p>
      </div>
    </div>
  );
}
