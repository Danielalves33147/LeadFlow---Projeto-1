package br.com.leadflow.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {
    private SecurityUtils() {}
    public static LeadFlowPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof LeadFlowPrincipal principal)) throw new IllegalStateException("Usuário não autenticado.");
        return principal;
    }
}
