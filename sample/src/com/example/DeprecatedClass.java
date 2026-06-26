package com.example;

/**
 * バージョン 1.x 時代の実装クラスです。
 *
 * <p><b>このクラスは非推奨です。</b>
 * 代わりに {@link StyledClass} を使用してください。</p>
 *
 * <h2>マイグレーションガイド</h2>
 * <pre>{@code
 * // 旧コード（非推奨）
 * DeprecatedClass old = new DeprecatedClass("test");
 * old.doSomething();
 *
 * // 新コード（推奨）
 * StyledClass newObj = new StyledClass("test", 50);
 * newObj.validate();
 * newObj.process();
 * }</pre>
 *
 * @deprecated バージョン 2.0。{@link StyledClass} を使用してください。
 * @since 1.0
 */
@Deprecated
public class DeprecatedClass {

    private String data;

    /**
     * データ文字列を指定してインスタンスを生成します。
     *
     * @param data データ文字列
     * @deprecated {@link StyledClass#StyledClass(String, int)} を使用してください。
     */
    @Deprecated
    public DeprecatedClass(String data) {
        this.data = data;
    }

    /**
     * 何らかの処理を実行します。
     *
     * @deprecated {@link StyledClass#process()} を使用してください。
     */
    @Deprecated
    public void doSomething() {
        System.out.println("legacy: " + data);
    }

    /**
     * データ文字列を返します。
     *
     * @return データ文字列（形式は未定義）
     * @deprecated {@link StyledClass#getSummary()} を使用してください。
     */
    @Deprecated
    public String getData() {
        return data;
    }
}
