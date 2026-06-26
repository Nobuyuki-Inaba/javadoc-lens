package com.example;

/**
 * プレーンテキストのみで記述されたクラスです。
 * 装飾なし、HTML タグなし、単純な文章だけで構成される Javadoc の最小パターンを示します。
 * このクラスはユーザの名前と年齢を保持し、簡単な挨拶文を生成します。
 *
 * @since 1.0
 * @author Sample Author
 */
public class PlainClass {

    /** ユーザの名前を保持するフィールド。null は許容しない。 */
    private String name;

    /** ユーザの年齢を保持するフィールド。0 以上の値でなければならない。 */
    private int age;

    /**
     * 名前と年齢を指定してインスタンスを生成します。
     * 引数 name に null を渡した場合の動作は未定義です。
     * 引数 age に負の値を渡した場合は IllegalArgumentException をスローします。
     *
     * @param name ユーザの名前（null 不可）
     * @param age  ユーザの年齢（0 以上）
     * @throws IllegalArgumentException age が負の場合
     */
    public PlainClass(String name, int age) {
        if (age < 0) {
            throw new IllegalArgumentException("age must be non-negative: " + age);
        }
        this.name = name;
        this.age = age;
    }

    /**
     * ユーザへの挨拶文字列を返します。
     * 返却される文字列の形式は「こんにちは、名前さん（年齢歳）」です。
     *
     * @return 挨拶文字列。null を返すことはない。
     */
    public String greet() {
        return "こんにちは、" + name + "さん（" + age + "歳）";
    }

    /**
     * ユーザの名前を返します。
     *
     * @return ユーザの名前。null ではない。
     */
    public String getName() {
        return name;
    }

    /**
     * ユーザの年齢を返します。
     *
     * @return 0 以上の整数。
     */
    public int getAge() {
        return age;
    }

    /**
     * ユーザの年齢を設定します。負の値を指定した場合は無視されます。
     *
     * @param age 設定する年齢（0 以上）
     */
    public void setAge(int age) {
        if (age >= 0) {
            this.age = age;
        }
    }
}
