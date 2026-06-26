package com.example;

/**
 * Javadoc Lens の動作確認用エントリポイントです。
 *
 * <p>このファイルを VS Code で開き、下記のクラス名やメソッド名に
 * カーソルを乗せると Javadoc Lens パネルに各クラスの Javadoc が表示されます。</p>
 *
 * <h2>テスト手順</h2>
 * <ol>
 *   <li>VS Code 設定で {@code javadocLens.roots} に sample フォルダのパスを設定する</li>
 *   <li>ボトムパネルの「Javadoc Lens」タブを開く</li>
 *   <li>各クラス名・メソッド名にカーソルを移動して表示を確認する</li>
 * </ol>
 */
public class Main {

    public static void main(String[] args) {

        // ── PlainClass のテスト ──────────────────────────────────────────────
        // ↑ "PlainClass" にカーソルを乗せると Javadoc が表示される
        PlainClass plain = new PlainClass("田中太郎", 30);

        // ↓ メソッド名にカーソルを乗せるとメソッドの Javadoc にスクロールする
        String greeting = plain.greet();
        String name = plain.getName();
        int age = plain.getAge();
        plain.setAge(31);

        System.out.println(greeting);
        System.out.println("name=" + name + ", age=" + age);

        // ── StyledClass のテスト ─────────────────────────────────────────────
        // ↑ "StyledClass" にカーソルを乗せると色付き Javadoc が表示される
        StyledClass styled = new StyledClass("example-task", 85);

        // ↓ 各メソッド名でスクロール位置が変わることを確認できる
        boolean valid = styled.validate();
        if (valid) {
            styled.process();
        }
        String summary = styled.getSummary();
        System.out.println(summary);

        // MAX_SCORE フィールドにカーソルを乗せてフィールドの Javadoc を確認
        System.out.println("MAX_SCORE=" + StyledClass.MAX_SCORE);

        // ── DeprecatedClass のテスト ─────────────────────────────────────────
        // ↑ "DeprecatedClass" にカーソルを乗せると非推奨クラスの Javadoc が表示される
        DeprecatedClass deprecated = new DeprecatedClass("legacy-data");

        // ↓ 非推奨メソッドの Javadoc も確認できる
        deprecated.doSomething();
        String data = deprecated.getData();
        System.out.println("data=" + data);

        // ── compareTo のテスト ───────────────────────────────────────────────
        StyledClass a = new StyledClass("high-priority", 90);
        StyledClass b = new StyledClass("low-priority", 20);
        int cmp = a.compareTo(b);  // ← "compareTo" にカーソルを乗せる
        System.out.println("compare result: " + cmp);
    }
}
