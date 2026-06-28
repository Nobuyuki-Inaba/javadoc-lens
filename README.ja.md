# Javadoc Lens

Javadoc コメントを Java ソースファイルから読み取り、VS Code のボトムパネルに HTML でリアルタイム表示する拡張機能です。

![スクリーンショット](images/screenshot.png)

## 機能

- カーソルを置くだけで、その位置のメソッド・クラス・フィールドの Javadoc を自動表示
- `<table>`、`<b>`、`<pre>` などの HTML タグをそのままレンダリング
- `{@code}`、`{@link}`、`{@literal}` などのインラインタグに対応
- `@param`、`@return`、`@throws`、`@deprecated` などのブロックタグを見やすく整形
- 別ファイルに定義されたクラス・メソッドも、定義ジャンプ経由で Javadoc を表示

## 使い方

1. Java ファイルを開く
2. ボトムパネルの **JAVADOC LENS** タブを選択
3. Javadoc コメントがあるメソッドやクラスにカーソルを移動すると、パネルに内容が表示されます

パネルが見つからない場合は、コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）から **Javadoc Lens: Open Settings** を実行してください。

## 設定

| 設定項目 | 説明 | デフォルト |
|---|---|---|
| `javadocLens.debounceMs` | カーソル移動から表示更新までの遅延（ミリ秒） | `400` |

## 動作要件

- VS Code 1.85.0 以上
- Java ファイル（`.java`）を開いたときに自動的に有効化されます

## ライセンス

MIT
