import { ExternalLink, Mail, Shield, FileText } from 'lucide-react';

interface AboutSettingsProps {
  isDarkMode: boolean;
}

export function AboutSettings({ isDarkMode }: AboutSettingsProps) {
  return (
    <div className="p-6">
      <h1 className="text-[20px] text-slate-900 dark:text-white mb-6">このアプリについて</h1>

      {/* App Icon and Info */}
      <div className="mb-5">
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-8 border border-slate-200/60 dark:border-slate-700/60 text-center">
          {/* App Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700 rounded-2xl shadow-lg mb-4">
            <span className="text-[36px]">✓</span>
          </div>

          <h2 className="text-[28px] text-slate-900 dark:text-white mb-2">TypoZero</h2>
          <p className="text-[15px] text-slate-600 dark:text-slate-400 mb-1">
            テキスト校正ユーティリティ
          </p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Version 1.2.3
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-5">
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
            TypoZeroは、ビジネス・プロフェッショナル向けの高精度テキスト校正ユーティリティです。
            キーボードショートカット一つで、どんな場面でも素早く文章をチェックできます。
          </p>
          <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">
            TypoZeroは、ビジネス・プロフェッショナル向けの高精度テキスト校正ユーティリティです。
            キーボードショートカット一つで、どんな場面でも素早く文章をチェックできます。
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="mb-5">
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-[15px] text-slate-900 dark:text-white mb-4">リンク</h3>

          <div className="space-y-2">
            <a
              href="#"
              className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-slate-100/60 dark:hover:bg-slate-700/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-[13px] text-slate-700 dark:text-slate-300">
                  ウェブサイト
                </span>
              </div>
              <span className="text-[12px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                typozero.app
              </span>
            </a>

            <a
              href="#"
              className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-slate-100/60 dark:hover:bg-slate-700/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-[13px] text-slate-700 dark:text-slate-300">
                  サポート
                </span>
              </div>
              <span className="text-[12px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                support@typozero.app
              </span>
            </a>

            <a
              href="#"
              className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-slate-100/60 dark:hover:bg-slate-700/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-[13px] text-slate-700 dark:text-slate-300">
                  プライバシーポリシー
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
            </a>

            <a
              href="#"
              className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-slate-100/60 dark:hover:bg-slate-700/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-[13px] text-slate-700 dark:text-slate-300">
                  利用規約
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="mb-4">
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-[15px] text-slate-900 dark:text-white mb-4">クレジット</h3>

          <div className="space-y-3">
            <div>
              <p className="text-[13px] text-slate-700 dark:text-slate-300">
                開発: <span className="text-slate-900 dark:text-white">TypoZero Team</span>
              </p>
            </div>

            <div>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 mb-1">
                サードパーティライブラリ:
              </p>
              <ul className="space-y-1 pl-4">
                <li className="text-[12px] text-slate-600 dark:text-slate-400">
                  • React 18.3 (MIT License)
                </li>
                <li className="text-[12px] text-slate-600 dark:text-slate-400">
                  • Lucide Icons (ISC License)
                </li>
                <li className="text-[12px] text-slate-600 dark:text-slate-400">
                  • Tailwind CSS (MIT License)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          © 2025 TypoZero. All rights reserved.
        </p>
      </div>
    </div>
  );
}
