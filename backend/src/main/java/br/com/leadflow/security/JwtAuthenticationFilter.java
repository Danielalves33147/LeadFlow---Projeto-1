package br.com.leadflow.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext()
            .getAuthentication() == null) {
                try {
                    JwtService
                        .TokenClaims claims = jwtService
                        .validate(header
                        .substring(7));
                    LeadFlowPrincipal principal = userDetailsService
                        .loadById(claims
                        .userId());
                    if (principal
                        .isEnabled()) {
                            var auth = new UsernamePasswordAuthenticationToken(principal, null, principal
                                .getAuthorities());
                            SecurityContextHolder
                                .getContext()
                                .setAuthentication(auth);
                        }
                } catch (RuntimeException ignored) {
                    SecurityContextHolder
                        .clearContext();
                }
            }
        filterChain
            .doFilter(request, response);
    }
}
