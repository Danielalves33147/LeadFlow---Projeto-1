package br.com.leadflow.security;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final byte[] secret;
    private final long expirationSeconds;
    private final ObjectMapper objectMapper;

    public JwtService(@Value("${leadflow.jwt.secret}") String secret,
                      @Value("${leadflow.jwt.expiration-seconds}") long expirationSeconds,
                      ObjectMapper objectMapper) {
        if (secret == null || secret.length() < 32) throw new IllegalArgumentException("JWT secret deve possuir ao menos 32 caracteres.");
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationSeconds = expirationSeconds;
        this.objectMapper = objectMapper;
    }

    public String generate(LeadFlowPrincipal principal) {
        try {
            String header = base64(objectMapper.writeValueAsBytes(Map.of("alg", "HS256", "typ", "JWT")));
            Instant now = Instant.now();
            Map<String, Object> payloadMap = new LinkedHashMap<>();
            payloadMap.put("sub", principal.getUsername());
            payloadMap.put("uid", principal.getUserId());
            payloadMap.put("cid", principal.getCompanyId());
            payloadMap.put("role", principal.getRole().name());
            payloadMap.put("iat", now.getEpochSecond());
            payloadMap.put("exp", now.plusSeconds(expirationSeconds).getEpochSecond());
            String payload = base64(objectMapper.writeValueAsBytes(payloadMap));
            String unsigned = header + "." + payload;
            return unsigned + "." + base64(sign(unsigned));
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível gerar token.", e);
        }
    }

    public TokenClaims validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) throw new IllegalArgumentException("Token inválido");
            String unsigned = parts[0] + "." + parts[1];
            if (!MessageDigest.isEqual(sign(unsigned), Base64.getUrlDecoder().decode(parts[2]))) throw new IllegalArgumentException("Assinatura inválida");
            Map<String,Object> payload = objectMapper.readValue(Base64.getUrlDecoder().decode(parts[1]), new TypeReference<>() {});
            long exp = ((Number)payload.get("exp")).longValue();
            if (Instant.now().getEpochSecond() >= exp) throw new IllegalArgumentException("Token expirado");
            return new TokenClaims(((Number)payload.get("uid")).longValue(), (String)payload.get("sub"), exp);
        } catch (Exception e) {
            throw new IllegalArgumentException("Token inválido.", e);
        }
    }

    public long getExpirationSeconds() { return expirationSeconds; }

    private byte[] sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
    }

    private String base64(byte[] bytes) { return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    public record TokenClaims(Long userId, String email, long expiresAt) {}
}
