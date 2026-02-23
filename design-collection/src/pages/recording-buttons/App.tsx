import { useMemo, useState } from 'react';
import { Mic, Square, Radio, Disc3, Sparkles, Waves, Volume2 } from 'lucide-react';

interface ButtonStyle {
  id: string;
  name: string;
  hint: string;
  idleLabel: string;
  recordingLabel: string;
  shellClass: string;
  idleClass: string;
  recordingClass: string;
  icon: 'mic' | 'radio' | 'disc' | 'wave' | 'spark' | 'volume';
  animationClass?: string;
}

const buttonStyles: ButtonStyle[] = [
  {
    id: 'soft-red',
    name: 'Soft Red',
    hint: '標準的で迷わない丸ボタン',
    idleLabel: '録音開始',
    recordingLabel: '録音停止',
    shellClass: 'rounded-full bg-white shadow-md border border-rose-100',
    idleClass: 'bg-rose-500 text-white hover:bg-rose-600',
    recordingClass: 'bg-slate-900 text-white hover:bg-slate-800',
    icon: 'mic',
  },
  {
    id: 'glass-dot',
    name: 'Glass Dot',
    hint: 'ガラス風の軽い質感',
    idleLabel: 'Start',
    recordingLabel: 'Stop',
    shellClass: 'rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border border-white',
    idleClass: 'bg-rose-500/90 text-white',
    recordingClass: 'bg-rose-700 text-white',
    icon: 'disc',
    animationClass: 'animate-pulse',
  },
  {
    id: 'minimal-outline',
    name: 'Minimal Outline',
    hint: '線で状態差を強調',
    idleLabel: 'REC',
    recordingLabel: 'STOP',
    shellClass: 'rounded-xl bg-white border border-slate-200 shadow-sm',
    idleClass: 'bg-white text-rose-600 border border-rose-500',
    recordingClass: 'bg-rose-600 text-white border border-rose-700',
    icon: 'radio',
  },
  {
    id: 'friendly-pill',
    name: 'Friendly Pill',
    hint: '高齢者にも押しやすい横長',
    idleLabel: '録音する',
    recordingLabel: '終了する',
    shellClass: 'rounded-full bg-amber-50 border border-amber-100 shadow-sm',
    idleClass: 'bg-amber-500 text-amber-950',
    recordingClass: 'bg-emerald-500 text-white',
    icon: 'mic',
  },
  {
    id: 'neo-clay',
    name: 'Neo Clay',
    hint: '柔らかいクレイ感',
    idleLabel: '録音',
    recordingLabel: '停止',
    shellClass: 'rounded-3xl bg-[#f0f4fa] shadow-[6px_6px_12px_#d6dce5,-6px_-6px_12px_#ffffff]',
    idleClass: 'bg-[#f0f4fa] text-rose-500 shadow-inner',
    recordingClass: 'bg-rose-500 text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]',
    icon: 'disc',
  },
  {
    id: 'teal-ring',
    name: 'Teal Ring',
    hint: '輪郭の光で録音中を通知',
    idleLabel: 'Tap to record',
    recordingLabel: 'Tap to stop',
    shellClass: 'rounded-full bg-slate-950 shadow-lg border border-slate-800',
    idleClass: 'bg-teal-400 text-slate-900',
    recordingClass: 'bg-emerald-400 text-slate-900 ring-4 ring-emerald-200',
    icon: 'wave',
    animationClass: 'animate-pulse',
  },
  {
    id: 'warm-card',
    name: 'Warm Card',
    hint: 'カードUIとの相性重視',
    idleLabel: 'Start Recording',
    recordingLabel: 'Stop Recording',
    shellClass: 'rounded-xl bg-gradient-to-br from-orange-50 to-rose-50 border border-orange-100',
    idleClass: 'bg-orange-500 text-white',
    recordingClass: 'bg-rose-600 text-white',
    icon: 'mic',
  },
  {
    id: 'night-mode',
    name: 'Night Mode',
    hint: '暗色テーマで映える',
    idleLabel: 'REC ON',
    recordingLabel: 'REC OFF',
    shellClass: 'rounded-2xl bg-slate-900 border border-slate-700 shadow-md',
    idleClass: 'bg-slate-800 text-cyan-300 border border-cyan-400',
    recordingClass: 'bg-cyan-400 text-slate-900',
    icon: 'volume',
  },
  {
    id: 'retro-led',
    name: 'Retro LED',
    hint: 'LEDランプのような点滅',
    idleLabel: '録音待機',
    recordingLabel: '録音中',
    shellClass: 'rounded-lg bg-zinc-800 border border-zinc-700',
    idleClass: 'bg-zinc-200 text-zinc-900',
    recordingClass: 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.8)]',
    icon: 'radio',
    animationClass: 'animate-pulse',
  },
  {
    id: 'playful-bubble',
    name: 'Playful Bubble',
    hint: 'ポップで親しみやすい',
    idleLabel: 'はじめる',
    recordingLabel: 'とめる',
    shellClass: 'rounded-full bg-sky-50 border border-sky-100 shadow-sm',
    idleClass: 'bg-sky-400 text-white',
    recordingClass: 'bg-fuchsia-500 text-white',
    icon: 'spark',
    animationClass: 'animate-bounce',
  },
  {
    id: 'focus-square',
    name: 'Focus Square',
    hint: '角丸四角で堅実',
    idleLabel: '録音開始',
    recordingLabel: '録音停止',
    shellClass: 'rounded-xl bg-white border-2 border-slate-200',
    idleClass: 'bg-slate-100 text-slate-700',
    recordingClass: 'bg-red-600 text-white',
    icon: 'mic',
  },
  {
    id: 'calm-ocean',
    name: 'Calm Ocean',
    hint: '落ち着いたブルー',
    idleLabel: 'Record',
    recordingLabel: 'Stop',
    shellClass: 'rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-cyan-100',
    idleClass: 'bg-cyan-500 text-white',
    recordingClass: 'bg-blue-700 text-white',
    icon: 'wave',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    hint: '視認性最優先',
    idleLabel: '開始',
    recordingLabel: '停止',
    shellClass: 'rounded-xl bg-white border-2 border-black',
    idleClass: 'bg-yellow-300 text-black border border-black',
    recordingClass: 'bg-black text-white',
    icon: 'mic',
  },
  {
    id: 'lavender-soft',
    name: 'Lavender Soft',
    hint: 'やさしい色味',
    idleLabel: '録音する',
    recordingLabel: '中止する',
    shellClass: 'rounded-3xl bg-violet-50 border border-violet-100',
    idleClass: 'bg-violet-400 text-white',
    recordingClass: 'bg-violet-700 text-white',
    icon: 'spark',
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    hint: '暖色グラデーション',
    idleLabel: 'Start',
    recordingLabel: 'Stop',
    shellClass: 'rounded-full bg-gradient-to-r from-amber-100 to-rose-100 border border-white',
    idleClass: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
    recordingClass: 'bg-gradient-to-r from-rose-500 to-red-600 text-white',
    icon: 'disc',
  },
  {
    id: 'mono-chip',
    name: 'Mono Chip',
    hint: '業務アプリ向けミニマル',
    idleLabel: 'REC',
    recordingLabel: 'END',
    shellClass: 'rounded-lg bg-slate-100 border border-slate-300',
    idleClass: 'bg-white text-slate-700 border border-slate-300',
    recordingClass: 'bg-slate-800 text-white',
    icon: 'radio',
  },
  {
    id: 'forest',
    name: 'Forest',
    hint: '自然で安心感のある配色',
    idleLabel: '録音開始',
    recordingLabel: '録音終了',
    shellClass: 'rounded-xl bg-emerald-50 border border-emerald-100',
    idleClass: 'bg-emerald-500 text-white',
    recordingClass: 'bg-lime-600 text-white',
    icon: 'volume',
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    hint: 'ちょっとリッチなネオン感',
    idleLabel: 'Begin',
    recordingLabel: 'Finish',
    shellClass: 'rounded-2xl bg-[#120c24] border border-violet-500/40 shadow-lg',
    idleClass: 'bg-violet-500 text-white',
    recordingClass: 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.7)]',
    icon: 'spark',
    animationClass: 'animate-pulse',
  },
  {
    id: 'paper-note',
    name: 'Paper Note',
    hint: '手帳風の軽いトーン',
    idleLabel: '録音メモ',
    recordingLabel: 'メモ終了',
    shellClass: 'rounded-xl bg-[#fffdf5] border border-[#f2e8c8] shadow-sm',
    idleClass: 'bg-[#f6d365] text-[#3f2d12]',
    recordingClass: 'bg-[#ef476f] text-white',
    icon: 'mic',
  },
  {
    id: 'aqua-pill',
    name: 'Aqua Pill',
    hint: '医療・教育向けに明るく',
    idleLabel: 'スタート',
    recordingLabel: 'ストップ',
    shellClass: 'rounded-full bg-cyan-50 border border-cyan-100',
    idleClass: 'bg-cyan-500 text-white',
    recordingClass: 'bg-red-500 text-white',
    icon: 'wave',
  },
  {
    id: 'ruby-gem',
    name: 'Ruby Gem',
    hint: '宝石のような強い存在感',
    idleLabel: 'RECORD',
    recordingLabel: 'PAUSE',
    shellClass: 'rounded-2xl bg-rose-50 border border-rose-100',
    idleClass: 'bg-rose-500 text-white',
    recordingClass: 'bg-rose-700 text-white',
    icon: 'disc',
    animationClass: 'animate-pulse',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    hint: '会議ツールらしい端正さ',
    idleLabel: '録音開始',
    recordingLabel: '録音停止',
    shellClass: 'rounded-xl bg-slate-200 border border-slate-300',
    idleClass: 'bg-slate-50 text-slate-700 border border-slate-400',
    recordingClass: 'bg-slate-700 text-white',
    icon: 'radio',
  },
  {
    id: 'mint-circle',
    name: 'Mint Circle',
    hint: 'やわらかく清潔感',
    idleLabel: 'Start Rec',
    recordingLabel: 'Stop Rec',
    shellClass: 'rounded-full bg-emerald-50 border border-emerald-100',
    idleClass: 'bg-emerald-400 text-white',
    recordingClass: 'bg-teal-600 text-white',
    icon: 'mic',
  },
  {
    id: 'sunset-card',
    name: 'Sunset Card',
    hint: 'カラフルで遊び心を追加',
    idleLabel: '録音する',
    recordingLabel: '録音を止める',
    shellClass: 'rounded-2xl bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50 border border-pink-100',
    idleClass: 'bg-gradient-to-r from-orange-400 to-pink-500 text-white',
    recordingClass: 'bg-gradient-to-r from-fuchsia-500 to-rose-600 text-white',
    icon: 'spark',
    animationClass: 'animate-pulse',
  },
  {
    id: 'clean-white',
    name: 'Clean White',
    hint: '無彩色でどこでも使える',
    idleLabel: 'Start',
    recordingLabel: 'Stop',
    shellClass: 'rounded-xl bg-white border border-slate-200 shadow-sm',
    idleClass: 'bg-white text-slate-700 border border-slate-300',
    recordingClass: 'bg-red-500 text-white',
    icon: 'volume',
  },
];

function renderIcon(icon: ButtonStyle['icon'], recording: boolean) {
  const commonClass = `h-5 w-5 ${recording ? 'animate-pulse' : ''}`;

  switch (icon) {
    case 'radio':
      return <Radio className={commonClass} />;
    case 'disc':
      return <Disc3 className={`${commonClass} ${recording ? 'animate-spin' : ''}`} />;
    case 'wave':
      return <Waves className={commonClass} />;
    case 'spark':
      return <Sparkles className={commonClass} />;
    case 'volume':
      return <Volume2 className={commonClass} />;
    default:
      return <Mic className={commonClass} />;
  }
}

function RecordingButtonCard({ style }: { style: ButtonStyle }) {
  const [recording, setRecording] = useState(false);

  const buttonClass = useMemo(
    () =>
      `w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
        recording ? style.recordingClass : style.idleClass
      } ${recording && style.animationClass ? style.animationClass : ''}`,
    [recording, style.animationClass, style.idleClass, style.recordingClass],
  );

  return (
    <div className={`p-4 sm:p-5 space-y-4 ${style.shellClass}`}>
      <div>
        <p className="text-sm font-semibold text-slate-800">{style.name}</p>
        <p className="text-xs text-slate-500">{style.hint}</p>
      </div>

      <button
        type="button"
        onClick={() => setRecording((prev) => !prev)}
        className={buttonClass}
      >
        {recording ? <Square className="h-4 w-4 fill-current" /> : renderIcon(style.icon, recording)}
        {recording ? style.recordingLabel : style.idleLabel}
      </button>

      <p className="text-xs text-slate-500">
        状態: <span className="font-medium text-slate-700">{recording ? '録音中' : '待機中'}</span>
      </p>
    </div>
  );
}

export default function RecordingButtonsApp() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <p className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
            Recording Button Design Collection
          </p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">録音ボタン 25 デザイン集</h1>
          <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
            すべてのボタンはクリックで「録音開始前 ↔ 録音中」を切り替えできます。PCに詳しくない方でも使いやすいよう、
            シンプルな表現をベースにしつつ、一部リッチなアニメーションも入れています。
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {buttonStyles.map((style) => (
            <RecordingButtonCard key={style.id} style={style} />
          ))}
        </section>
      </div>
    </main>
  );
}
