package com.example.cd2.security;

import com.example.cd2.entity.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTtlSeconds;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.access-ttl-seconds:900}") long accessTtlSeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtlSeconds = accessTtlSeconds;
    }

    public long getAccessTtlSeconds() {
        return accessTtlSeconds;
    }

    public String generateAccessToken(UserAccount account) {
        Date now = new Date();
        return Jwts.builder()
                .subject(account.getEmail())
                .claim("uid", account.getId())
                .claim("role", account.getRole().name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessTtlSeconds * 1000))
                .signWith(key)
                .compact();
    }

    /** Tra ve email (subject) neu token hop le, nguoc lai rong. */
    public Optional<String> validateAndGetEmail(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload();
            return Optional.ofNullable(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
