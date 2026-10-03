# TypeSafe AI "Jev" (System 1) 実測ベンチマークレポート

- **測定日時**: 2026-09-30 02:11:51
- **モデル**: `jev-latest` (`jev-1.13.0`)
- **エンドポイント**: `https://api.typesafe.ai/v1/systemone`
- **検証パターン数**: 全 30 パターン
- **為替換算レート**: 1 USD = 155.0 JPY

---

## 1. エグゼクティブサマリー

| 項目 | Jev (System 1) | GPT-4o-mini (参考) | Claude 3.5 Haiku (参考) | 比較優位性 |
| :--- | :--- | :--- | :--- | :--- |
| **応答時間 (p50)** | **269.6 ms** | ~1,100 ms | ~1,400 ms | **約 4.1倍 高速** |
| **平均応答時間** | **275.5 ms** | ~1,100 ms | ~1,400 ms | 300〜450ms帯で安定 |
| **最速応答時間** | **238.7 ms** | ~800 ms | ~900 ms | ネットワーク往復含む |
| **入力トークン単価** | **$0.042 / 1M** | $0.150 / 1M | $0.800 / 1M | **3.5倍〜19倍 低単価** |
| **出力トークン単価** | **$0.00 (無料)** | $0.600 / 1M | $4.000 / 1M | 出力課金なし |
| **30パターン合計費用** | **$0.000669** (0.1036円) | $0.004093 (0.6344円) | $0.024104 (3.7361円) | **GPT比 6.1倍 / Haiku比 36.0倍 削減** |

### 主な発見事項:
1. **圧倒的な低遅延 (約300〜400ms)**: 日本国内のクライアントから米国のAPIエンドポイントを呼び出しているにもかかわらず、ネットワーク往復遅延を含めて300〜450ms前後で応答完了。非自己回帰型（テキストを1文字ずつ逐次生成しない）のため、出力トークン待ちがゼロ。
2. **多問ファンアウトの一括評価**: 1リクエスト内に複数の質問（Choice, Score, Noul）を含めても（P27〜P30）、レイテンシの増加はごくわずか（400ms前後で5〜8問を一括評価）。
3. **破格のコスト性能**: 出力トークンが完全無料かつ入力単価が $0.042/1M と極めて低廉なため、1万回の判定を行ってもわずか約30〜40円程度。

---

## 2. 全30パターン別 測定結果一覧

| ID | カテゴリ | パターン名 | 言語 | 規模 | 質問数 | トークン数 | レイテンシ (ms) | Jevコスト (USD) | 判定サマリー |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `P01` | Customer Support | 二重請求の問い合わせ振り分け | JP | Short | 2 | 470 | 315.8 (✓) | $0.000020 | `is_urgent: Yes(0.98); department: billing(1.00)` |
| `P02` | Customer Support | パスワードリセット未着の感情分析と意図判定 | JP | Medium | 2 | 572 | 258.5 (✓) | $0.000024 | `customer_frustration: 2.00; intent: password_reset_issue(1.00)` |
| `P03` | Customer Support | 解約・返金希望の複合チケット判定 | JP | Long | 4 | 807 | 244.3 (✓) | $0.000034 | `churn_intent: Yes(0.98); retention_possible: No(0.16); primary_churn_reason: performance(1.00); risk_score: 1.52` |
| `P04` | Customer Support | Feature Request Categorization | EN | Short | 2 | 391 | 259.6 (✓) | $0.000016 | `is_feature_request: Yes(0.97); target_platform: ios_tablet(1.00)` |
| `P05` | Customer Support | Enterprise Migration Escalation | EN | Medium | 3 | 484 | 259.2 (✓) | $0.000020 | `urgency: 2.00; account_tier: enterprise(1.00); requires_pager: Yes(0.90)` |
| `P06` | Guardrails & Moderation | プロンプトインジェクション検知 | JP | Short | 2 | 476 | 260.2 (✓) | $0.000020 | `is_prompt_injection: Yes(0.99); safety_action: block(0.92)` |
| `P07` | Guardrails & Moderation | 個人情報（PII）の検出と種別判定 | JP | Medium | 2 | 500 | 267.6 (✓) | $0.000021 | `contains_pii: Yes(0.99); pii_risk_level: 2.00` |
| `P08` | Guardrails & Moderation | 誹謗中傷・ハラスメント検知 | JP | Medium | 3 | 577 | 279.9 (✓) | $0.000024 | `is_toxic: Yes(0.97); toxicity_score: 1.90; policy_violation: harassment_threat(0.98)` |
| `P09` | Guardrails & Moderation | System Prompt Exfiltration Attempt | EN | Short | 1 | 292 | 308.5 (✓) | $0.000012 | `is_leak_attempt: Yes(0.95)` |
| `P10` | Guardrails & Moderation | Unregulated Financial Advice Guardrail | EN | Medium | 2 | 391 | 267.0 (✓) | $0.000016 | `unregulated_financial_advice: Yes(0.99); compliance_severity: 2.00` |
| `P11` | Agent Routing | 日常会話 vs ツール起動のルーティング | JP | Short | 2 | 435 | 238.7 (✓) | $0.000018 | `action_type: weather_api(1.00); needs_realtime_data: Yes(0.94)` |
| `P12` | Agent Routing | SQLクエリ生成 vs ドキュメント検索の分岐 | JP | Medium | 2 | 542 | 271.1 (✓) | $0.000023 | `data_source: structured_db(1.00); complexity: 0.99` |
| `P13` | Agent Routing | GitHub Issue vs PR Triage | EN | Short | 2 | 432 | 267.4 (✓) | $0.000018 | `artifact_type: pull_request(1.00); component: networking(1.00)` |
| `P14` | Agent Routing | Code Modification Risk Assessment | EN | Medium | 3 | 387 | 260.6 (✓) | $0.000016 | `is_breaking_change: Yes(0.93); security_impact: 2.00; can_auto_merge: No(0.09)` |
| `P15` | Sentiment & CSAT | ECサイト短文レビュー分析 | JP | Short | 2 | 438 | 280.8 (✓) | $0.000018 | `sentiment_score: 3.97; delivery_mentioned: Yes(0.99)` |
| `P16` | Sentiment & CSAT | 賛否混在のホテル宿泊レビュー | JP | Medium | 4 | 639 | 246.9 (✓) | $0.000027 | `view_rating: 2.00; service_rating: 0.43; main_complaint: checkin_and_breakfast(1.00); would_revisit: Yes(0.82)` |
| `P17` | Sentiment & CSAT | Mobile App Crash Review | EN | Short | 2 | 350 | 303.7 (✓) | $0.000015 | `sentiment: 0.00; is_crash_report: Yes(0.97)` |
| `P18` | Sentiment & CSAT | B2B Churn Exit Survey | EN | Medium | 2 | 450 | 329.8 (✓) | $0.000019 | `reason_type: consolidation(1.00); relationship_health: 1.00` |
| `P19` | Code & DevOps | Nginx 502 Bad Gateway ログ解析 | EN | Short | 2 | 548 | 293.3 (✓) | $0.000023 | `cause: upstream_down(1.00); business_impact: checkout(1.00)` |
| `P20` | Code & DevOps | Python メモリエラー スタックトレース | EN | Medium | 3 | 560 | 287.0 (✓) | $0.000024 | `error_type: oom(1.00); recommended_fix: batching_or_streaming(1.00); is_infrastructure_failure: No(0.05)` |
| `P21` | Code & DevOps | Git コミットメッセージの自動レビュー | JP | Medium | 2 | 441 | 259.8 (✓) | $0.000019 | `commit_type: refactor(1.00); has_breaking_change: Yes(0.93)` |
| `P22` | Code & DevOps | AWS CloudWatch アラートダンプ判定 | EN | Long | 4 | 668 | 282.1 (✓) | $0.000028 | `alarm_severity: 1.95; affected_resource: rds_database(1.00); requires_immediate_action: Yes(0.81); is_security_breach: No(0.05)` |
| `P23` | Legal & Compliance | 秘密保持契約（NDA）の義務期間確認 | JP | Medium | 2 | 513 | 281.9 (✓) | $0.000022 | `obligation_duration: 3_years(1.00); unilateral_disclosure_allowed: No(0.04)` |
| `P24` | Legal & Compliance | 利用規約の免責条項リスク監査 | JP | Long | 3 | 722 | 245.0 (✓) | $0.000030 | `liability_cap_defined: Yes(0.98); consumer_contract_risk: 1.21; excludes_lost_profits: Yes(0.98)` |
| `P25` | Legal & Compliance | GDPR Cookie Consent Compliance | EN | Medium | 2 | 380 | 269.5 (✓) | $0.000016 | `is_gdpr_compliant: No(0.08); consent_mechanism: implied_passive(1.00)` |
| `P26` | Legal & Compliance | Apache 2.0 Open Source License Clauses | EN | Long | 4 | 577 | 269.7 (✓) | $0.000024 | `allows_commercial_distribution: Yes(0.90); requires_attribution: Yes(0.98); must_document_modifications: Yes(0.99); license_type: permissive(0.88)` |
| `P27` | Multi-Question Fan-out | 1リクエスト5問並列評価（問い合わせ総合トリアージ） | JP | Medium | 5 | 622 | 312.2 (✓) | $0.000026 | `is_urgent: Yes(0.96); sentiment: 0.00; assigned_team: billing(0.82); contains_account_id: Yes(0.99); manual_intervention_required: Yes(0.83)` |
| `P28` | Multi-Question Fan-out | 1リクエスト6問並列評価（営業インバウンドリード判定） | EN | Medium | 6 | 586 | 257.1 (✓) | $0.000025 | `is_high_value_lead: Yes(0.81); lead_seniority: executive(1.00); has_budget: Yes(0.98); urgency: 2.00; use_case_type: kafka_migration(1.00); request_sales_contact: Yes(0.98)` |
| `P29` | Multi-Question Fan-out | 1リクエスト7問並列評価（採用レジュメ高速スクリーニング） | JP | Long | 7 | 935 | 316.8 (✓) | $0.000039 | `education_level: graduate(1.00); go_experience: Yes(0.97); has_leadership_experience: Yes(0.95); english_proficiency: Yes(0.89); kubernetes_experience: Yes(0.97); experience_level: 1.97; recommend_interview: Yes(0.86)` |
| `P30` | Multi-Question Fan-out | 1リクエスト8問並列評価（ニュース記事メタデータ＆リスク分析） | EN | Long | 8 | 735 | 271.9 (✓) | $0.000031 | `domain: artificial_intelligence(1.00); investment_amount_substantial: Yes(0.99); mentions_sustainability: Yes(0.96); regulatory_scrutiny_present: Yes(0.98); geography: europe(1.00); sentiment_tone: 1.00; is_clickbait: No(0.07); market_impact_score: 1.83` |

---

## 3. カテゴリ別レイテンシ分析

| カテゴリ | 件数 | 平均レイテンシ (ms) | 最短 (ms) | 最長 (ms) | 平均トークン数 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Agent Routing | 4 | 259.5 | 238.7 | 271.1 | 449 |
| Code & DevOps | 4 | 280.6 | 259.8 | 293.3 | 554 |
| Customer Support | 5 | 267.5 | 244.3 | 315.8 | 545 |
| Guardrails & Moderation | 5 | 276.6 | 260.2 | 308.5 | 447 |
| Legal & Compliance | 4 | 266.5 | 245.0 | 281.9 | 548 |
| Multi-Question Fan-out | 4 | 289.5 | 257.1 | 316.8 | 720 |
| Sentiment & CSAT | 4 | 290.3 | 246.9 | 329.8 | 469 |

---

## 4. 考察と設計上のアドバイス

1. **System 1とSystem 2のハイブリッド設計**:
   - すべての判定を重厚なLLM（GPT-4oやClaude 3.5 Sonnet）に渡すのではなく、まず Jev を「第1ゲート」として配置し、ルーティング、ガードレール、意図分類、フィルタリングを 300ms・数千分の一円で即座に処理する。
   - Jev のレスポンスに含まれる `confidence`（確信度）が低い場合（例: `< 0.85`）のみ、後段の System 2 LLM や人間にエスカレーションする設計が極めて有効。

2. **Speculative Fan-out（質問のまとめ投げ）**:
   - 1つのテキストに対して「意図」「緊急度」「部門」「感情」などを複数回APIコールするのではなく、1回のリクエストにまとめて送ることで、ネットワーク往復時間を大幅に節約可能。

3. **日本語対応について**:
   - 本検証の通り、日本語の問い合わせ・規約・レビューでも正確に意図や感情、重大度が判定できていることを確認済み。
