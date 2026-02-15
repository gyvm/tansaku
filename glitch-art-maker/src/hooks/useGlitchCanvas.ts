import { useState, useEffect, useRef, useCallback } from 'react';
import { GlitchSettings } from '../effects/types';
import { applyGlitchPipeline } from '../effects/pipeline';

interface UseGlitchCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  settings: GlitchSettings;
}

export const useGlitchCanvas = ({ canvasRef, settings }: UseGlitchCanvasProps) => {
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const requestRef = useRef<number>();
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // ImageDataをメインCanvasに描画するヘルパー
  const putImageData = useCallback((imageData: ImageData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 画像サイズに合わせてCanvasサイズを調整
    if (canvas.width !== imageData.width || canvas.height !== imageData.height) {
      canvas.width = imageData.width;
      canvas.height = imageData.height;
    }

    ctx.putImageData(imageData, 0, 0);
  }, [canvasRef]);

  // ファイルアップロード処理 (リサイズとImageData生成)
  const processFile = useCallback((file: File) => {
    // 画像ファイル以外のバリデーション
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください (PNG/JPG/WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 画像のリサイズ処理 (最大辺1200px)
        const MAX_SIZE = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        // 一時Canvasを使ってImageDataを取得
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);

          setOriginalImageData(imageData);

          // 初期描画
          putImageData(imageData);
        }
      };
      // エラーハンドリング
      img.onerror = () => {
        alert('画像の読み込みに失敗しました');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [putImageData]);

  // 設定変更時のグリッチ処理実行 (Debounce付き)
  useEffect(() => {
    if (!originalImageData) return;

    // 前回の処理待機をキャンセル
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    setIsProcessing(true);

    // スライダー操作ごとの負荷軽減のため50ms遅延
    processingTimeoutRef.current = setTimeout(() => {
      requestRef.current = requestAnimationFrame(() => {
        if (!originalImageData) return;

        // グリッチパイプラインの実行
        const processedData = applyGlitchPipeline(originalImageData, settings);

        // 描画
        putImageData(processedData);
        setIsProcessing(false);
      });
    }, 50);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
    };
  }, [settings, originalImageData, putImageData]);

  return {
    processFile,
    isProcessing,
    hasImage: !!originalImageData
  };
};
