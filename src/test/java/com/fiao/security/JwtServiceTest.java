package com.fiao.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fiao.api.ApiException;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
    private final JwtService jwtService = new JwtService("unit-test-secret-that-is-at-least-32-bytes-long", "1d");

    @Test
    void signsAndParsesTheExistingUserClaims() {
        String token = jwtService.create("user-1", "123456", "USER");
        Claims claims = jwtService.parse(token);

        assertEquals("user-1", claims.getSubject());
        assertEquals("123456", claims.get("documentNumber"));
        assertEquals("USER", claims.get("role"));
        assertEquals("1d", jwtService.accessLifetimeText());
    }

    @Test
    void rejectsInvalidTokens() {
        assertThrows(ApiException.class, () -> jwtService.parse("not-a-token"));
    }

    @Test
    void acceptsQuotedValuesFromDotenvFiles() {
        JwtService quotedService = new JwtService(
                "\"unit-test-secret-that-is-at-least-32-bytes-long\"",
                "\"1d\"");

        Claims claims = quotedService.parse(
                quotedService.create("user-1", "123456", "USER"));

        assertEquals("user-1", claims.getSubject());
        assertEquals("1d", quotedService.accessLifetimeText());
    }
}
