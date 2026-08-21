# Ski Log UI mock

スキー記録アプリ「Ski Log」のUIを確認するためのSwiftUIモックです。

現時点では記録・SwiftData・CoreLocation・HealthKitの実処理は入れず、記録画面、履歴画面、記録詳細画面を静的データで操作できるようにしています。

## 起動

XcodeGenがインストールされている環境では、プロジェクトを再生成できます。

```sh
xcodegen generate
open SkiLog.xcodeproj
```

または、リポジトリに含まれる `SkiLog.xcodeproj` を直接開いてください。

## UIの見どころ

- 大きな現在値と開始ボタンを置いた記録画面
- 斜度を色の帯で見せる履歴カード
- 標高チャート、斜度帯、指標カード、MapKitの軌跡をまとめた詳細画面
- ダークな雪山の計器盤をイメージした配色
