package com.example.cd2.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

/**
 * Xac thuc cho /api/n8n/** bang header X-API-Key. Khong dang ky la @Component:
 * duoc tao truc tiep trong SecurityConfig de chi chay ben trong chuoi bao mat.
 */
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-API-Key";

    private final byte[] expectedKey;

    public ApiKeyAuthFilter(String apiKey) {
        this.expectedKey = apiKey.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/n8n/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String provided = request.getHeader(HEADER);
        if (provided != null) {
            if (provided.startsWith("=")) {
                provided = provided.substring(1);
            }
            if (MessageDigest.isEqual(provided.getBytes(StandardCharsets.UTF_8), expectedKey)) {
                var auth = new UsernamePasswordAuthenticationToken(
                        "n8n-service", null, List.of(new SimpleGrantedAuthority("ROLE_N8N")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }
}
