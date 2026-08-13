package br.com.leadflow.validation;

import br.com.leadflow.utils.TextUtils;

public final class CnpjValidator {
    private CnpjValidator() {}

    public static boolean isValid(String raw) {
        String cnpj = TextUtils.digits(raw);
        if (cnpj == null || cnpj.length() != 14 || cnpj.chars().distinct().count() == 1) return false;
        return digit(cnpj.substring(0, 12), new int[]{5,4,3,2,9,8,7,6,5,4,3,2}) == cnpj.charAt(12)-'0'
            && digit(cnpj.substring(0, 13), new int[]{6,5,4,3,2,9,8,7,6,5,4,3,2}) == cnpj.charAt(13)-'0';
    }

    private static int digit(String base, int[] weights) {
        int sum = 0;
        for (int i=0; i<weights.length; i++) sum += (base.charAt(i)-'0') * weights[i];
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
}
