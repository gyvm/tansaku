# x-bookmarks-digest

自分の X（Twitter）ブックマークを定期的に取得し、機械的にグループ化して、
Slack / Discord にダイジェスト通知する小さな Python CLI。

- 取得: 公式 **X API v2** `GET /2/users/:id/bookmarks`（OAuth 2.0 PKCE, user context）
- 整理: LLM 不使用の決定論的グループ化（ハッシュタグ → リンク先ドメイン → 著者 の優先順位）
- 通知: `stdout` / `slack` / `discord`（Webhook）
- 定期実行: Claude の Routine（この remote 環境で定期起動）、あるいはローカル cron / GitHub Actions

依存は最小（`PyYAML` と、`repo_encrypted` モードのみ `cryptography`）。HTTP はすべて標準ライブラリ。

> **重要**: ChatGPT / Claude のスケジュール機能だけでは非公開のブックマークは読めません。
> 必ず下記の X 開発者アプリ + OAuth が必要です。AI 側は「定期実行のトリガー」として使います。

---

## セットアップ

### 1. X 開発者アプリを作成（手動・一度だけ）
1. [X Developer Portal](https://developer.x.com/) でアプリを作成。
2. **User authentication settings** で **OAuth 2.0** を有効化。
   - App type: **Native App / Public client**（PKCE, client secret 無し）を推奨。
   - **Callback URI**: `http://127.0.0.1:8723/callback` を**そのまま**登録（コードとバイト一致が必須）。
   - App permissions: 読み取りで可。
3. スコープ: `bookmark.read tweet.read users.read offline.access`（`offline.access` がないと
   リフレッシュトークンが発行されません）。
4. **Client ID** を控える（Public client なら Client Secret は不要）。
5. アクセスティア: 無料枠は月100読み取り程度と小さめ。従量課金の owned reads（自分のデータ）は
   1件 ≈ $0.001 と安価なので、頻度が高い場合はこちらを推奨。

### 2. 依存インストール
```bash
cd x-bookmarks-digest
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 3. 設定
```bash
cp .env.example .env          # X_CLIENT_ID などを記入
cp config.example.yaml config.yaml
```
`.env` と `config.yaml` は gitignore 済み。

### 4. 初回認証（手元のブラウザで一度だけ）
```bash
python main.py auth
```
ブラウザが開いて認可 → ローカルの `127.0.0.1:8723` がコールバックを受け取り、
`state/token.json` にトークンを保存します（`user_id` も自動解決）。

### 5. 実行
```bash
python main.py run --dry-run          # 取得して stdout に表示（通知・状態保存なし）
python main.py run                    # config の notify.channels に通知
python main.py test-notify --channel slack   # Webhook 配線テスト（1通だけ）
```

---

## 設定ファイル（`config.yaml`）

主な項目（全体は `config.example.yaml` を参照）:

| キー | 意味 |
|---|---|
| `x.max_results` / `x.max_pages` | ページサイズ（最大100）とページ数上限 |
| `fetch.dedup` | 既読ブックマークをスキップ |
| `group.strategy` | グループ化キーの優先順位（`hashtag` / `domain` / `author`） |
| `notify.channels` | `stdout` / `slack` / `discord` の組み合わせ |
| `notify.skip_when_empty` | 新着0件のとき通知しない |
| `token_store` | `file`（ローカル）/ `repo_encrypted`（Routine 等の ephemeral 実行用） |

Webhook URL などの秘密は `.env`（または環境変数）で設定します。

---

## 定期実行

### A. Claude の Routine（この remote 環境・推奨構成）
この環境は container が ephemeral（毎回リポジトリを新規 clone）なので、
**ローテーションするリフレッシュトークンをリポジトリに暗号化コミットして永続化**します。

1. 暗号鍵を生成し、**環境変数**（durable）に設定:
   ```bash
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   # 出力を TOKEN_ENC_KEY として Claude 環境の環境変数に設定
   ```
2. `config.yaml` で `token_store: repo_encrypted` にし、`repo_encrypted.git_branch` を
   このブランチ名に設定。
3. ローカルで `python main.py auth` 済みなら、いったん `TOKEN_STORE=repo_encrypted` で
   `run` を1回実行すると、暗号化トークン `state/token.enc` がコミットされます
   （以降はこのファイルがトークンの真実源）。
4. Routine（cron trigger, fresh session）を登録し、prompt で
   「`x-bookmarks-digest` で `python main.py run` を実行」を指定。
   - 静的な秘密（`X_CLIENT_ID`, `TOKEN_ENC_KEY`, `SLACK_WEBHOOK_URL` 等）は環境変数へ。
   - リフレッシュトークンは `state/token.enc`（暗号化）、既読IDは `state/run_state.json` として
     各実行後に自動コミットされます。

### B. ローカル cron / launchd（最も簡単）
`token_store: file` のまま、`.venv/bin/python main.py run` を cron/launchd で定期実行するだけ。
トークンは `state/token.json` にローカル永続。Mac が起きている必要あり。

### C. GitHub Actions
同じスクリプトが動きます。ステートレスなので `repo_encrypted`（または Actions secret への
書き戻し）でトークンを永続化してください。

> **トークンローテーション注意**: X はリフレッシュのたびに refresh token を更新し旧トークンを
> 無効化します。本ツールは fetch の**前**に新トークンを保存（`repo_encrypted` では即コミット）
> するため、途中でクラッシュしてもロックアウトしません。並行実行は避けてください。

---

## テスト
```bash
python -m unittest discover -s tests
```
実ネットワーク・実 Webhook には接続しません（HTTP はすべてモック）。

## ディレクトリ
```
main.py              # CLI（auth | run | test-notify）
xbd/
  config.py          # 設定ロード/検証
  oauth.py           # PKCE ブートストラップ + リフレッシュ
  tokenstore.py      # File / RepoEncrypted トークンストア
  client.py          # ブックマーク取得（ページング + dedup）
  state.py           # 既読ID管理
  grouping.py        # グループ化 + Markdown ダイジェスト
  models.py          # Bookmark モデル
  notifiers/         # stdout / slack / discord
  gitutil.py         # 永続化用の git ヘルパ
tests/               # unittest 一式
```
