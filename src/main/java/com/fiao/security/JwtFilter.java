package com.fiao.security;

import com.fiao.api.ApiException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        Claims claims;
        try {
            claims = jwtService.parse(authorization.substring(7));
        } catch (ApiException exception) {
            response.setStatus(exception.status().value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"statusCode\":401,\"message\":\"Token inválido o expirado\",\"error\":\"Unauthorized\"}");
            return;
        }
        request.setAttribute("userId", claims.getSubject());
        chain.doFilter(request, response);
    }
}
