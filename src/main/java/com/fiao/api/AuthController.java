package com.fiao.api;

import com.fiao.api.Requests.Login;
import com.fiao.api.Requests.Logout;
import com.fiao.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/auth/login")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> login(@Valid @RequestBody Login body) {
        return service.login(body);
    }

    @PostMapping("/auth/refresh")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> refresh(@RequestHeader(value = "x-refresh-token", required = false) String token,
                                      @RequestHeader(value = "x-device-info", required = false) String deviceInfo) {
        if (token == null || token.isBlank()) throw ApiException.badRequest("Refresh token no enviado");
        return service.refresh(token, deviceInfo);
    }

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> logout(@RequestHeader(value = "x-refresh-token", required = false) String token,
                                      @RequestBody(required = false) Logout body) {
        return service.logout(token, body != null && Boolean.TRUE.equals(body.allDevices()));
    }
}
