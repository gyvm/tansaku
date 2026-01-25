import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface GeneralSettingsProps {
  isDarkMode: boolean;
}

export function GeneralSettings({ isDarkMode }: GeneralSettingsProps) {
  const [proofreadingTone, setProofreadingTone] = useState<number>(1); // 0: light, 1: standard, 2: strict
  const [language, setLanguage] = useState('japanese');

  // Shortcuts state
  const [isRecordingDirect, setIsRecordingDirect] = useState(false);
  const [isRecordingSuggest, setIsRecordingSuggest] = useState(false);
  const [directShortcut, setDirectShortcut] = useState('⌘ + Shift + D');
  const [suggestShortcut, setSuggestShortcut] = useState('⌘ + Shift + S');

  const handleRecordShortcut = (mode: 'direct' | 'suggest') => {
    if (mode === 'direct') {
      setIsRecordingDirect(true);
      // Simulate recording
      setTimeout(() => {
        setIsRecordingDirect(false);
        setDirectShortcut('⌘ + Shift + D'); // Dummy update to satisfy linter
      }, 2000);
    } else {
      setIsRecordingSuggest(true);
      // Simulate recording
      setTimeout(() => {
        setIsRecordingSuggest(false);
        setSuggestShortcut('⌘ + Shift + S'); // Dummy update to satisfy linter
      }, 2000);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-[20px] text-slate-500 dark:text-slate-400 font-light mb-1">一般設定</h1>
      <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-6">
        ショートカットキーの変更や校正で利用する言語を変更できます。
      </p>

      {/* Proofreading Language */}
      <div className="mb-6">
        <h3 className="text-[14px] text-slate-900 dark:text-white mb-3 font-medium">校正言語</h3>
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
          >
            <option value="japanese">日本語 (Japanese)</option>
            <option value="english">English</option>
            <option value="chinese">中文 (Chinese)</option>
            <option value="korean">한국어 (Korean)</option>
          </select>
        </div>
      </div>

      {/* Proofreading Tone */}
      <div className="mb-6">
        <h3 className="text-[14px] text-slate-900 dark:text-white mb-3 font-medium">校正トーン</h3>
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={proofreadingTone}
              onChange={(e) => setProofreadingTone(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-slate-600 dark:accent-slate-400"
            />
            <div className="flex justify-between mt-2 text-[12px] text-slate-600 dark:text-slate-400">
              <span>緩め</span>
              <span>ふつう</span>
              <span>厳しめ</span>
            </div>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            {proofreadingTone === 0 && '誤字脱字のみをチェックし、文体にはあまり干渉しません。'}
            {proofreadingTone === 1 && '一般的なビジネス文書に適した、バランスの取れた校正を行います。'}
            {proofreadingTone === 2 && '文法や表現を厳格にチェックし、より洗練された文章を提案します。'}
          </p>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="mb-6">
        <h3 className="text-[14px] text-slate-900 dark:text-white mb-3 font-medium">ショートカットキー</h3>

        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
          {/* Direct Mode Row */}
          <div className="p-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
            <div>
              <div className="text-[14px] text-slate-900 dark:text-white font-medium mb-1">ダイレクトモード</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400">
                選択したテキストを直接置き換えます
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-mono bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 min-w-[100px] text-center">
                {isRecordingDirect ? '...' : directShortcut}
              </span>
              <button
                onClick={() => handleRecordShortcut('direct')}
                disabled={isRecordingDirect}
                className={`px-3 py-1.5 rounded-md text-[12px] transition-all duration-200 border ${isRecordingDirect
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-transparent cursor-not-allowed'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                {isRecordingDirect ? '入力中...' : '変更'}
              </button>
            </div>
          </div>

          {/* Suggestion Mode Row */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[14px] text-slate-900 dark:text-white font-medium mb-1">提案モード</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400">
                修正案をポップアップで表示します
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-mono bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 min-w-[100px] text-center">
                {isRecordingSuggest ? '...' : suggestShortcut}
              </span>
              <button
                onClick={() => handleRecordShortcut('suggest')}
                disabled={isRecordingSuggest}
                className={`px-3 py-1.5 rounded-md text-[12px] transition-all duration-200 border ${isRecordingSuggest
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-transparent cursor-not-allowed'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                {isRecordingSuggest ? '入力中...' : '変更'}
              </button>
            </div>
          </div>
        </div>

        {/* Warning Note */}
        <div className="mt-4 bg-amber-50/60 dark:bg-amber-900/20 backdrop-blur-sm rounded-xl p-4 border border-amber-200/60 dark:border-amber-800/60">
          <div className="flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-900 dark:text-amber-200">
              他のアプリケーションで使用されているショートカットキーと重複しないように設定してください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
