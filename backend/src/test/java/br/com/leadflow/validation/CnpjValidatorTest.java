package br.com.leadflow.validation;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class CnpjValidatorTest {
    @Test void acceptsValidCnpj(){ assertTrue(CnpjValidator.isValid("11222333000181")); }
    @Test void rejectsRepeatedDigits(){ assertFalse(CnpjValidator.isValid("11111111111111")); }
    @Test void rejectsWrongCheckDigits(){ assertFalse(CnpjValidator.isValid("11222333000182")); }
}
