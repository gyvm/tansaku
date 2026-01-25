import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdvancedSettingsProps {
  isDarkMode: boolean;
}

export function AdvancedSettings({ isDarkMode }: AdvancedSettingsProps) {
  const [apiKey, setApiKey] = useState('sk-1234567890abcdefghijklmnopqrstuvwxyz');
  const [showApiKey, setShowApiKey] = useState(false);
  const [timeout, setTimeout] = useState(30);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }
    // Reset to defaults
    setApiKey('');
    setTimeout(30);
    setShowResetConfirm(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-[20px] text-slate-900 dark:text-white mb-1">詳細設定</h1>
      <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-6">
        Advanced configuration options
      </p>

      {/* API Key */}
      <div className="mb-5">
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-[15px] text-slate-900 dark:text-white mb-1">APIキー</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
            API Key for proofreading service
          </p>
          
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-4 py-3 pr-12 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showApiKey ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Your API key is stored locally and never shared
          </p>
        </div>
      </div>

      {/* Request Timeout */}
      <div className="mb-5">
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-[15px] text-slate-900 dark:text-white mb-1">リクエストタイムアウト</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
            Request Timeout (seconds)
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-slate-600 dark:text-slate-400">10s</span>
              <span className="text-[20px] text-slate-900 dark:text-white">{timeout}s</span>
              <span className="text-[13px] text-slate-600 dark:text-slate-400">60s</span>
            </div>
            
            <input
              type="range"
              min="10"
              max="60"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-500 dark:[&::-webkit-slider-thumb]:bg-slate-400 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Maximum time to wait for proofreading response
            </p>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="mb-5">
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-[15px] text-slate-900 dark:text-white mb-4">パフォーマンス</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-slate-500 focus:ring-slate-400"
              />
              <div>
                <div className="text-[13px] text-slate-900 dark:text-white">Enable caching</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cache recent proofreading results
                </div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-slate-500 focus:ring-slate-400"
              />
              <div>
                <div className="text-[13px] text-slate-900 dark:text-white">Batch processing</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Process multiple requests together
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="mb-4">
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-[15px] text-slate-900 dark:text-white mb-1">設定をリセット</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
            Reset all settings to default values
          </p>
          
          <button
            onClick={handleReset}
            className={`w-full px-6 py-3 rounded-lg text-[13px] transition-all duration-200 ${
              showResetConfirm
                ? 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            } shadow-sm hover:shadow-md`}
          >
            {showResetConfirm ? '⚠️ クリックして確認 / Click to Confirm Reset' : 'デフォルトに戻す / Reset to Defaults'}
          </button>
          
          {showResetConfirm && (
            <button
              onClick={() => setShowResetConfirm(false)}
              className="w-full mt-2 px-6 py-2 text-[12px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-slate-100/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex gap-3">
          <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] text-slate-700 dark:text-slate-300">
              これらの設定は上級ユーザー向けです。変更により予期しない動作が発生する場合があります。
            </p>
            <p className="text-[12px] text-slate-700 dark:text-slate-300 mt-2">
              These settings are for advanced users. Changes may cause unexpected behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
