import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface CanvasPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasImage: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing?: boolean;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  canvasRef,
  hasImage,
  onUpload,
  isProcessing = false
}) => {
  return (
    <div className="flex-1 bg-[#050505] relative overflow-hidden flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-surfaceVariant/20 to-transparent">

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 max-w-full max-h-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Canvas is always rendered but might be hidden or empty initially */}
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-[calc(100vh-150px)] border border-surfaceVariant ${!hasImage ? 'hidden' : 'block'}`}
        />

        {/* Placeholder / Upload Prompt */}
        {!hasImage && (
          <div className="border-2 border-dashed border-surfaceVariant rounded-lg p-12 flex flex-col items-center justify-center text-textMuted hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-surface/50 backdrop-blur-sm group">
            <label className="cursor-pointer flex flex-col items-center">
              <div className="p-4 rounded-full bg-surfaceVariant group-hover:bg-primary/10 transition-colors mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>
              <span className="font-mono text-lg mb-2">DROP IMAGE HERE</span>
              <span className="text-xs opacity-50">or click to upload</span>
              <input
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={onUpload}
              />
            </label>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="absolute bottom-8 right-8 bg-surface border border-primary text-primary px-4 py-2 font-mono text-xs animate-pulse">
          PROCESSING...
        </div>
      )}
    </div>
  );
};
