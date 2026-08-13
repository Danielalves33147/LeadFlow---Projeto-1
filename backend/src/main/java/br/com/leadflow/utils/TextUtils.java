package br.com.leadflow.utils;

public final class TextUtils {
    private TextUtils() {}
    public static String digits(String value) { return value == null ? null : value.replaceAll("\\D", ""); }
    public static String normalizedEmail(String value) { return value == null ? null : value.trim().toLowerCase(); }
    public static String trimToNull(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isEmpty() ? null : v;
    }
}
