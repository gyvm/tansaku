import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardPanel } from './components/DashboardPanel';
import './styles/globals.css';

export default function VoiceNotesDashApp() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleProcess = (file: File, type: string, format: string) => {
    setIsProcessing(true);
    setResult(null);

    // Mock Process
    setTimeout(() => {
      setResult(generateMockResult(type, format));
      setIsProcessing(false);
    }, 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `meeting_minutes.md`; // Default to markdown for dash
    document.body.appendChild(element);
    element.click();
  };

  const generateMockResult = (type: string, format: string) => {
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

[00:01:00] 田中:
わかりました。では次回の定例は金曜日の15時からとさせてください。以上です。`;
    }
    // Minutes
    else {
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

  return (
    <div className="vn-dash-layout flex">
      <Sidebar />
      <DashboardPanel
        onProcess={handleProcess}
        isProcessing={isProcessing}
        result={result}
        onDownload={handleDownload}
      />
    </div>
  );
}
