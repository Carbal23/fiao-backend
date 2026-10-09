package com.fiao.security;

import com.fiao.api.ApiException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final String secret;
    private final Duration accessLifetime;
    private final String accessLifetimeText;

    public JwtService(@Value("${JWT_SECRET:}") String secret,
                      @Value("${JWT_EXPIRES_IN:15m}") String expiresIn) {
        this.secret = normalizeValue(secret);
        this.accessLifetime = parseDuration(normalizeValue(expiresIn));
        this.accessLifetimeText = normalizeValue(expiresIn);
    }

    public String create(String userId, String documentNumber, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("documentNumber", documentNumber)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessLifetime)))
                .signWith(signingKey())
                .compact();
    }

    public Claims parse(String token) {
        try {
            return Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token).getPayload();
        } catch (JwtException | IllegalArgumentException exception) {
            throw ApiException.unauthorized("Token inválido o expirado");
        }
    }

    private SecretKey signingKey() {
        if (secret.isBlank()) throw new IllegalStateException("JWT_SECRET must be configured");
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) throw new IllegalStateException("JWT_SECRET must contain at least 32 bytes");
        return Keys.hmacShaKeyFor(secretBytes);
    }

    public String accessLifetimeText() {
        return accessLifetimeText;
    }

    private static Duration parseDuration(String value) {
        try {
            if (value.matches("\\d+")) return Duration.ofSeconds(Long.parseLong(value));
            long amount = Long.parseLong(value.substring(0, value.length() - 1));
            return switch (value.charAt(value.length() - 1)) {
                case 's' -> Duration.ofSeconds(amount);
                case 'm' -> Duration.ofMinutes(amount);
                case 'h' -> Duration.ofHours(amount);
                case 'd' -> Duration.ofDays(amount);
                default -> throw new IllegalArgumentException("Unsupported JWT_EXPIRES_IN value");
            };
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Invalid JWT_EXPIRES_IN value", exception);
        }
    }

    private static String normalizeValue(String value) {
        String normalized = value.trim();
        if (normalized.length() >= 2
                && ((normalized.startsWith("\"") && normalized.endsWith("\""))
                || (normalized.startsWith("'") && normalized.endsWith("'")))) {
            return normalized.substring(1, normalized.length() - 1);
        }
        return normalized;
    }
}
