# 開発者向けガイド

## セットアップ

```bash
npm install
```

## ビルドコマンド

```bash
# 型チェック + バンドル
npm run compile

# ウォッチモード（開発中）
npm run watch

# .vsix パッケージ生成
npm run package
```

`compile` は `tsc --noEmit` で型チェックを行ったあと `esbuild` でバンドルします。型エラーをバンドル前に検出できるよう、2ステップに分かれています。

拡張機能の動作確認は VS Code でこのフォルダを開いて **F5** を押すと Extension Development Host が起動します。

## アーキテクチャ

Java ソースファイルから `/** … */` Javadoc コメントを直接読み取り、HTML として VS Code ボトムパネルに表示します。事前生成済みの Javadoc HTML ファイルは使いません。

### データフロー

```
カーソル移動（デバウンス、デフォルト 400 ms）
  → JavadocExtractor.extractJavadocAtCursor()
      1. カーソルが /** … */ ブロック内にある → そのブロックを直接抽出
      2. vscode.executeDefinitionProvider → 定義元ソースを開き
         宣言行の直上の /** … */ を探す
      3. フォールバック: 現在ファイルを上方向に検索
  → JavadocParser.parseJavadocToHtml()
      → /** */ 区切り文字と先頭の " * " を除去
      → 説明文の HTML はそのまま通過
      → ブロックタグ（@param, @return, @throws …）を <dl> セクションに変換
      → インラインタグ（{@code}, {@link}, {@literal}）をインラインで変換
  → JavadocViewProvider.show(html)
      → webviewView.webview.html = html
```

### 主要ソースファイル

| ファイル | 役割 |
|---|---|
| [src/extension.ts](src/extension.ts) | `activate` — プロバイダー・コマンド・カーソル変更リスナーの登録 |
| [src/JavadocViewProvider.ts](src/JavadocViewProvider.ts) | `WebviewViewProvider` — ボトムパネル Webview の管理 |
| [src/JavadocExtractor.ts](src/JavadocExtractor.ts) | カーソル位置の生コメント文字列を抽出 |
| [src/JavadocParser.ts](src/JavadocParser.ts) | 生コメント文字列を完全な HTML ページに変換 |

### 重要な制約

- **`moduleResolution: "node"`** — `module: "commonjs"` を使うため必須。TypeScript 5.x は `"commonjs"` との組み合わせで `"bundler"` をサポートしない。
- **`enableScripts: false`** — Webview HTML は静的。パーサーがサーバーサイドで完全な HTML を生成するため JS 不要。
- **CSP**: `default-src 'none'; style-src 'unsafe-inline'` — 外部リソース・スクリプト禁止。
- **ランタイム依存なし** — VS Code API と Node 組み込みモジュールのみ。

### サンプルファイル

`sample/src/com/example/` に手動テスト用 Java ファイルが4つあります。

| ファイル | 内容 |
|---|---|
| `PlainClass.java` | HTML 装飾なしのプレーンテキスト Javadoc |
| `StyledClass.java` | `<b>`, `<table>`, `<pre>{@code}`, `@param`, `@return`, `@throws`, `@deprecated` を含むリッチな Javadoc |
| `DeprecatedClass.java` | `@Deprecated` クラスと移行メモ |
| `Main.java` | 上記3クラスを使用。クラス名にカーソルを置くと `executeDefinitionProvider` 経由でクロスファイル抽出をテストできる |

## パネル登録

`contributes.viewsContainers.panel` → `javadocLensPanel` → `contributes.views.javadocLensPanel`（type `webview`）。Terminal/Output/Problems の隣に配置されます。
