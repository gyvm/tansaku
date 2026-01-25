.PHONY: dev help select-project

# プロジェクト情報
PROJECTS := auralog-design macOS_SettingsWindowDesign_Figma macOS_BasedAppleBooksStyle_Gemini macOS_TypoZero_ChatGPT
PORTS := 5173 5174 5175 5176

# デフォルトターゲット
.DEFAULT_GOAL := help

help:
	@echo "=========================================="
	@echo "Design-Tansaku プロジェクト開発ツール"
	@echo "=========================================="
	@echo ""
	@echo "使用可能なコマンド："
	@echo ""
	@echo "  make dev              プロジェクト選択メニューを表示"
	@echo "  make auralog          Auralog Design を起動 (ポート 5173)"
	@echo "  make settings         Settings Window Design を起動 (ポート 5174)"
	@echo "  make applebooks       Apple Books Style を起動 (ポート 5175)"
	@echo "  make typozero         TypoZero を起動 (ポート 5176)"
	@echo ""
	@echo "  make all-dev          すべてのプロジェクトを並行起動"
	@echo "  make kill             すべての開発サーバーを停止"
	@echo "  make help             このヘルプメッセージを表示"
	@echo ""

# メインのdev コマンド - 対話的に選択
dev:
	@echo ""
	@echo "=========================================="
	@echo "プロジェクトを選択してください："
	@echo "=========================================="
	@echo ""
	@echo "1) Auralog Design System (ポート 5173)"
	@echo "2) macOS Settings Window Design (ポート 5174)"
	@echo "3) macOS Apple Books Style (ポート 5175)"
	@echo "4) TypoZero (ポート 5176)"
	@echo "5) すべてを並行起動"
	@echo "6) 終了"
	@echo ""
	@bash -c 'read -p "選択してください (1-6): " choice; \
		case $$choice in \
			1) make auralog;; \
			2) make settings;; \
			3) make applebooks;; \
			4) make typozero;; \
			5) make all-dev;; \
			6) echo "終了します"; exit 0;; \
			*) echo "無効な選択です"; make dev;; \
		esac'

# 個別プロジェクト起動
auralog:
	@echo "🎨 Auralog Design System を起動中... (http://localhost:5173)"
	@cd auralog-design && npm run dev

settings:
	@echo "⚙️  macOS Settings Window Design を起動中... (http://localhost:5174)"
	@cd macOS_SettingsWindowDesign_Figma && npm run dev

applebooks:
	@echo "📚 macOS Apple Books Style を起動中... (http://localhost:5175)"
	@cd macOS_BasedAppleBooksStyle_Gemini && npm run dev

typozero:
	@echo "✏️  TypoZero を起動中... (http://localhost:5176)"
	@cd macOS_TypoZero_ChatGPT && npm run dev

# すべてのプロジェクトを並行起動
all-dev:
	@echo "=========================================="
	@echo "すべてのプロジェクトを起動中..."
	@echo "=========================================="
	@echo ""
	@echo "Auralog Design (5173): http://localhost:5173"
	@echo "Settings Window (5174): http://localhost:5174"
	@echo "Apple Books Style (5175): http://localhost:5175"
	@echo "TypoZero (5176): http://localhost:5176"
	@echo ""
	@echo "すべてのサーバーを停止するには: make kill"
	@echo ""
	@(cd auralog-design && npm run dev > /tmp/auralog.log 2>&1 &) && \
	(cd macOS_SettingsWindowDesign_Figma && npm run dev > /tmp/settings.log 2>&1 &) && \
	(cd macOS_BasedAppleBooksStyle_Gemini && npm run dev > /tmp/applebooks.log 2>&1 &) && \
	(cd macOS_TypoZero_ChatGPT && npm run dev > /tmp/typozero.log 2>&1 &) && \
	wait

# すべてのサーバーを停止
kill:
	@echo "開発サーバーを停止中..."
	@pkill -f "vite.*dev" || true
	@sleep 1
	@echo "✓ すべてのサーバーを停止しました"
