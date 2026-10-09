package com.fiao.api;

import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<Map<String, Object>> handleApi(ApiException exception) {
        return response(exception.status(), exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst().orElse("Datos inválidos");
        return response(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException exception) {
        return response(HttpStatus.BAD_REQUEST, "Solicitud inválida o enum no reconocido");
    }

    @ExceptionHandler(DuplicateKeyException.class)
    ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateKeyException exception) {
        return response(HttpStatus.BAD_REQUEST, "Ya existe un registro con esos datos únicos");
    }

    private ResponseEntity<Map<String, Object>> response(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "statusCode", status.value(),
                "message", message,
                "error", status.getReasonPhrase()));
    }
}
