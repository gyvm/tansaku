# Copilot SDK Python Demo

`github/copilot-sdk` の Python 版を使って、複数リポジトリの直近1週間のPR状況を分析する CLI ツールです。

このサンプルでは次の使い方を確認できます。

- GitHub GraphQL v4 API からの PR データ取得
- YAML 設定ファイルでの複数リポジトリ指定
- Python 側での決定的な集計
- `CopilotClient` を使った Markdown サマリ生成
- Copilot 失敗時のフォールバックレポート出力

## 前提

- Python 3.11 以上
- GitHub Copilot が使えるアカウント
- `GITHUB_TOKEN` または `GH_TOKEN`
- Copilot CLI にログイン済み、または SDK が参照できる認証情報があること

公式ドキュメント上では、Python SDK は `pip install github-copilot-sdk` で導入できます。SDK は Copilot CLI ランタイムと連携して動作します。

参考:

- https://github.com/github/copilot-sdk
- https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md
- https://docs.github.com/en/copilot/how-tos/copilot-sdk/sdk-getting-started

## セットアップ

まずは標準の `venv` で問題ありません。

```bash
cd /Users/yosuke/GitHub/tansaku/copilot-sdk-python-demo
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

もし `python3 -m venv .venv` が `ensurepip` エラーで失敗する場合は、`.venv` が中途半端に残ることがあります。その場合は削除して `uv` で作り直すほうが安定です。

```bash
cd /Users/yosuke/GitHub/tansaku/copilot-sdk-python-demo
rm -rf .venv
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

必要なら Copilot CLI の状態も確認します。

```bash
copilot --version
copilot auth status
```

## 設定

サンプル設定は [repos.example.yaml](/Users/yosuke/GitHub/tansaku/copilot-sdk-python-demo/repos.example.yaml) にあります。

```yaml
default_days: 7
repositories:
  - openai/openai-python
  - github/copilot-sdk
```

## 実行

```bash
cd /Users/yosuke/GitHub/tansaku/copilot-sdk-python-demo
source .venv/bin/activate
export COPILOT_GITHUB_TOKEN=your_copilot_token_here
export GITHUB_TOKEN=your_token_here
python main.py --config repos.example.yaml --days 7
```

トークンを分ける場合は、Copilot SDK 用に `COPILOT_GITHUB_TOKEN`、GitHub GraphQL API 用に `GITHUB_TOKEN` を設定するのがおすすめです。

- `COPILOT_GITHUB_TOKEN`: Copilot SDK / Copilot Requests 用。SDK はこの環境変数を最優先で参照します。
- `GITHUB_TOKEN`: このツール内の GitHub GraphQL API 呼び出し用。private repository の参照権限はこちらに付けます。

例:

```bash
export COPILOT_GITHUB_TOKEN=github_pat_for_copilot_requests
export GITHUB_TOKEN=github_pat_for_graphql_repo_access
python main.py --config repos.yaml --days 7
```

オプション:

- `--config`: YAML 設定ファイルへのパス。必須。
- `--days`: 集計日数。省略時は設定ファイルの `default_days`、未指定なら `7`。
- `--model`: Copilot のモデル名。省略時は `gpt-4.1`。

出力は次の 3 セクション構成の Markdown です。

- `## 全体サマリ`
- `## リポジトリ別サマリ`
- `## 気になるPR`

Copilot SDK が要約生成に失敗した場合でも、Python 側の集計結果からフォールバックレポートを出力します。

## テスト

```bash
cd /Users/yosuke/GitHub/tansaku/copilot-sdk-python-demo
source .venv/bin/activate
python -m unittest test_main.py
```

## 補足

- モデル名は既存デモに合わせて `gpt-4.1` にしています。
- GitHub API 取得は GraphQL v4 を使い、Copilot SDK は最終要約の生成だけに使っています。
- 権限処理はデモを簡単にするため `approve_all` にしています。本番用途では必要な操作だけ明示的に許可する実装に変えたほうが安全です。
- SDK は public preview のため、API や動作は今後変わる可能性があります。
- Homebrew の Python 3.14 系では、環境によって `python3 -m venv` が `ensurepip` で失敗することがあります。その場合は `uv venv` を使うか、別の Python バージョンで仮想環境を作るのが手早いです.
