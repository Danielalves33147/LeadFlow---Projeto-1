package br.com.leadflow.validation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import br.com.leadflow.utils.TextUtils;
import org.junit.jupiter.api.Test;

class TextUtilsTest {
    @Test void normalizesEmail(){ assertEquals("contato@empresa.com", TextUtils.normalizedEmail("  CONTATO@EMPRESA.COM  ")); }
    @Test void keepsOnlyDigits(){ assertEquals("42850000", TextUtils.digits("42850-000")); }
}
