package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.RefreshToken;
import com.fiao.model.User;
import com.fiao.persistence.RefreshTokenRepository;
import com.fiao.persistence.UserRepository;
import com.fiao.security.JwtService;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final int refreshDays;

    public AuthService(UserRepository users, RefreshTokenRepository refreshTokens, PasswordEncoder passwordEncoder,
                       JwtService jwtService, @Value("${JWT_REFRESH_TOKEN_EXPIRES_DAYS:30}") int refreshDays) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshDays = refreshDays;
    }

    @Transactional
    public Map<String, Object> login(Requests.Login dto) {
        User user = users.findActiveByIdentifier(dto.identifier()).orElse(null);
        if (user == null || user.getPassword() == null || !passwordEncoder.matches(dto.password(), user.getPassword())) {
            throw ApiException.unauthorized("Credenciales inválidas");
        }
        refreshTokens.deleteAllByUserIdAndDeviceInfo(user.getId(), dto.deviceInfo());
        String secret = randomToken();
        Instant expires = Instant.now().plus(refreshDays, ChronoUnit.DAYS);
        RefreshToken refresh = new RefreshToken();
        refresh.setId(ApiData.id());
        refresh.setUser(user);
        refresh.setTokenHash(passwordEncoder.encode(secret));
        refresh.setExpiresAt(java.time.LocalDateTime.ofInstant(expires, java.time.ZoneOffset.UTC));
        refresh.setDeviceInfo(dto.deviceInfo());
        refreshTokens.save(refresh);
        return tokenResponse(user, user.getId() + "." + secret, expires);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> refresh(String token, String deviceInfo) {
        String[] parts = parseRefreshToken(token);
        RefreshToken matched = refreshTokens.findAllByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(
                        parts[0], ApiData.nowUtc()).stream()
                .filter(candidate -> deviceInfo == null || deviceInfo.equals(candidate.getDeviceInfo()))
                .filter(candidate -> passwordEncoder.matches(parts[1], candidate.getTokenHash()))
                .findFirst().orElse(null);
        if (matched == null) throw ApiException.unauthorized("Refresh token inválido o expirado");
        User user = users.findById(matched.getUser().getId())
                .filter(candidate -> candidate.getInactivatedAt() == null)
                .orElseThrow(() -> ApiException.unauthorized("Usuario no encontrado"));
        return tokenResponse(user, token, matched.getExpiresAt().toInstant(java.time.ZoneOffset.UTC));
    }

    @Transactional
    public Map<String, Object> logout(String token, boolean allDevices) {
        if (token == null || token.isBlank()) throw ApiException.badRequest("Refresh token no enviado");
        String[] parts = parseRefreshToken(token);
        if (allDevices) {
            refreshTokens.deleteAllByUserId(parts[0]);
            return Map.of("message", "Sesiones cerradas en todos los dispositivos");
        }
        for (RefreshToken refresh : refreshTokens.findAllByUserId(parts[0])) {
            if (passwordEncoder.matches(parts[1], refresh.getTokenHash())) {
                refreshTokens.delete(refresh);
                return Map.of("message", "Logout realizado");
            }
        }
        return Map.of("message", "Logout realizado (token no encontrado o ya eliminado)");
    }

    private Map<String, Object> tokenResponse(User user, String refreshToken, Instant refreshExpires) {
        Map<String, Object> safeUser = ApiData.user(user);
        return ApiData.map("user", safeUser,
                "accessToken", jwtService.create(user.getId(), user.getDocumentNumber(), user.getRole().name()),
                "accessTokenExpiresIn", jwtService.accessLifetimeText(), "refreshToken", refreshToken,
                "refreshTokenExpiresAt", refreshExpires.toString());
    }

    private String[] parseRefreshToken(String token) {
        if (token == null) throw ApiException.badRequest("Refresh token no enviado");
        int separator = token.indexOf('.');
        if (separator <= 0 || separator == token.length() - 1) throw ApiException.unauthorized("Token inválido");
        return new String[]{token.substring(0, separator), token.substring(separator + 1)};
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
