package com.example;

/**
 * 太字・カラー・表・コードブロックなど様々な HTML 装飾を含む Javadoc サンプルです。
 *
 * <p><b>注意:</b> このクラスは<b>スレッドセーフではありません</b>。
 * 複数スレッドから同時にアクセスする場合は外部で同期してください。</p>
 *
 * <h2>使用例</h2>
 * <pre>{@code
 * StyledClass obj = new StyledClass("example", 42, Priority.HIGH);
 * obj.process();
 * System.out.println(obj.getSummary());
 * // 出力: [HIGH] example (score=42)
 * }</pre>
 *
 * <h2>優先度の対応表</h2>
 * <table border="1">
 *   <tr><th>優先度</th><th>スコア範囲</th><th>説明</th></tr>
 *   <tr><td>HIGH</td><td>80〜100</td><td>即時対応が必要</td></tr>
 *   <tr><td>MEDIUM</td><td>40〜79</td><td>通常処理</td></tr>
 *   <tr><td>LOW</td><td>0〜39</td><td>バックグラウンド処理</td></tr>
 * </table>
 *
 * @since 2.0
 * @author Sample Author
 * @see PlainClass
 * @see DeprecatedClass
 */
public class StyledClass implements Comparable<StyledClass> {

    /** スコアの最大値。{@code 100} に固定されています。 */
    public static final int MAX_SCORE = 100;

    /**
     * エントリの名前。
     * <ul>
     *   <li>null 不可</li>
     *   <li>空文字列不可</li>
     *   <li>最大長: 255 文字</li>
     * </ul>
     */
    private String name;

    /** スコア値。有効範囲は {@code 0} 以上 {@code 100} 以下。 */
    private int score;

    /**
     * 名前とスコアを指定してインスタンスを生成します。
     *
     * @param name  エントリ名（null 不可・空文字列不可）
     * @param score スコア（0〜100）
     * @throws IllegalArgumentException name が null/空 の場合、または score が範囲外の場合
     */
    public StyledClass(String name, int score) {
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("name must not be null or empty");
        }
        if (score < 0 || score > MAX_SCORE) {
            throw new IllegalArgumentException("score out of range: " + score);
        }
        this.name = name;
        this.score = score;
    }

    /**
     * フォーマット済みのサマリー文字列を返します。
     *
     * <p>返却値の形式:</p>
     * <pre>{@code [優先度] name (score=N)}</pre>
     *
     * @return フォーマット済みのサマリー文字列。null を返さない。
     * @since 2.0
     */
    public String getSummary() {
        String priority = score >= 80 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
        return "[" + priority + "] " + name + " (score=" + score + ")";
    }

    /**
     * フィールド値の妥当性を検証します。
     *
     * <p>以下の条件をすべて満たす場合に {@code true} を返します:</p>
     * <ul>
     *   <li>{@code name} が null でなく、かつ空でない</li>
     *   <li>{@code score} が 0 以上 100 以下</li>
     * </ul>
     *
     * @return すべての制約を満たす場合 {@code true}、それ以外 {@code false}
     */
    public boolean validate() {
        return name != null && !name.isEmpty() && score >= 0 && score <= MAX_SCORE;
    }

    /**
     * スコアに応じた処理を実行します。
     *
     * <table border="1">
     *   <tr><th>スコア範囲</th><th>動作</th></tr>
     *   <tr><td>80〜100</td><td>高優先度処理 — 即時キューに積む</td></tr>
     *   <tr><td>40〜79</td><td>通常処理 — 通常キューに積む</td></tr>
     *   <tr><td>0〜39</td><td>低優先度処理 — バックグラウンドキューに積む</td></tr>
     * </table>
     *
     * @throws IllegalStateException {@code validate()} が false を返す状態で呼び出した場合
     */
    public void process() {
        if (!validate()) {
            throw new IllegalStateException("invalid state: call validate() first");
        }
        // スコアに応じたキューへの投入処理（省略）
    }

    /**
     * スコアの<b>降順</b>で比較します（スコアが高いほど順序が前になります）。
     *
     * @param other 比較対象のオブジェクト
     * @return このオブジェクトのスコアが other より大きければ負の値、等しければ 0、小さければ正の値
     * @throws NullPointerException other が null の場合
     */
    @Override
    public int compareTo(StyledClass other) {
        return Integer.compare(other.score, this.score);
    }

    /**
     * 旧形式の処理メソッドです。
     *
     * @deprecated バージョン 2.0 以降。{@link #process()} を使用してください。
     */
    @Deprecated
    public void legacyProcess() {
        process();
    }
}
