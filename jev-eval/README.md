# TypeSafe AI Jev (System 1) 実測ベンチマークツール

TypeSafe AIの「System 1」推論特化型モデル **Jev** (`jev-latest` / `jev-1.13.0`) のAPI応答速度（レイテンシ）とコスト感を計測・比較するための評価ツールです。

## 特徴

- **30パターンの実務シナリオ**:
  - カスタマーサポート・チケット振り分け（P01〜P05）
  - ガードレール・プロンプトインジェクション・有害表現モデレーション（P06〜P10）
  - AIエージェントのツール選定・クエリルーティング（P11〜P14）
  - 感情分析・CSAT・レビュー評価（P15〜P18）
  - 障害ログ・スタックトレース・アラート判定（P19〜P22）
  - リーガル・NDA・利用規約・ライセンス条項チェック（P23〜P26）
  - 5〜8問の超高速並列ファンアウト評価（P27〜P30）
- **標準ライブラリのみで動作**: 追加の `pip install` 不要（Python 3.8+）
- **詳細な比較表出力**:
  - ターミナル上の見やすいASCIIテーブル
  - 詳細Markdownレポート (`jev_benchmark_report.md`)
  - 生データCSV (`jev_benchmark_results.csv`)
  - 構造化JSON (`jev_benchmark_results.json`)
- **GPT-4o-mini / Claude 3.5 Haiku とのコスト・速度比較推計**

---

## 実行方法

環境変数 `TYPESAFE_API_KEY` が設定されていれば、そのまま実行可能です。

```bash
cd /Volumes/SN850X/GitHub/tansaku/jev-eval

# 全30パターンを実行
python3 evaluate_jev.py

# 特定のパターンだけ実行したい場合
python3 evaluate_jev.py --patterns P01,P06,P11,P27

# 複数回試行して平均レイテンシを測定する場合 (例: 3回)
python3 evaluate_jev.py --runs 3

# 並行リクエストで一気に回す場合 (例: 3並行)
python3 evaluate_jev.py --concurrency 3
```

---

## オプション一覧

| 引数 | 初期値 | 説明 |
| :--- | :--- | :--- |
| `--patterns` | `all` | 実行するパターンID（カンマ区切り、例: `P01,P05,P28`） |
| `--runs` | `1` | パターンごとの実行回数（平均値を計算） |
| `--concurrency` | `1` | 並行ワーカースレッド数（1で直列精密測定） |
| `--model` | `jev-latest` | 評価対象のモデルIDまたはエイリアス |
| `--endpoint` | `https://api.typesafe.ai/v1/systemone` | APIエンドポイントURL |
| `--usd-jpy` | `155.0` | ドル円為替レート |
| `--output-md` | `jev_benchmark_report.md` | 出力Markdownレポートのファイル名 |
| `--output-csv` | `jev_benchmark_results.csv` | 出力CSVファイル名 |
| `--output-json`| `jev_benchmark_results.json` | 出力JSONファイル名 |

---

## 出力ファイル

- `jev_benchmark_report.md`: 測定結果のサマリー表と考察
- `jev_benchmark_results.csv`: スプレッドシート等で分析可能な生データ
- `jev_benchmark_results.json`: プログラムから利用可能な完全なレスポンスデータ
