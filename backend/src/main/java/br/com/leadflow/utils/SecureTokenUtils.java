package br.com.leadflow.utils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

public final class SecureTokenUtils {

    private static final SecureRandom SECURE_RANDOM =
        new SecureRandom();

    private SecureTokenUtils() {
    }

    public static String generate() {
        byte[] bytes = new byte[48];

        SECURE_RANDOM.nextBytes(bytes);

        return Base64
            .getUrlEncoder()
            .withoutPadding()
            .encodeToString(bytes);
    }

    public static String hash(
        String value
    ) {
        try {
            byte[] digest = MessageDigest
                .getInstance("SHA-256")
                .digest(
                    value.getBytes(
                        StandardCharsets.UTF_8
                    )
                );

            return HexFormat
                .of()
                .formatHex(digest);

        } catch (Exception exception) {
            throw new IllegalStateException(
                "Não foi possível gerar o hash do token.",
                exception
            );
        }
    }
}