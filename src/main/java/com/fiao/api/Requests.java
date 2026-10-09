package com.fiao.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class Requests {
    private Requests() {}

    public record Login(@NotBlank String identifier, @NotBlank String password, String deviceInfo) {}
    public record Logout(Boolean allDevices) {}
    public record CreateUser(
            @NotBlank String firstName, @NotBlank String lastName, @NotBlank String documentType,
            @NotBlank String documentNumber, @Email String email, String phone,
            @NotBlank @Size(min = 6) String password, String role) {}
    public record UpdateUser(
            String firstName, String lastName, String documentType, String documentNumber,
            @Email String email, String phone, @Size(min = 6) String password, String role) {}
    public record CreateBusiness(@NotBlank @Size(max = 100) String name, @Size(max = 200) String address, String currency) {}
    public record UpdateBusiness(@Size(max = 100) String name, @Size(max = 200) String address, String currency) {}
    public record CreateDebtor(
            @NotBlank String name, String phone, String documentType, String documentNumber, String notes) {}
    public record UpdateDebtor(String name, String phone, String documentType, String documentNumber, String notes) {}
    public record CreateDebt(
            @NotBlank String debtorId, @NotNull @Positive BigDecimal amount, String description, Instant dueDate) {}
    public record UpdateDebtStatus(@NotBlank String status) {}
    public record CreatePayment(
            @NotBlank String debtId, @NotNull BigDecimal amount, @NotBlank String method,
            @NotBlank String type, String note) {}
    public record CreateGlobalPayment(
            @NotBlank String debtorId, @NotNull @Positive BigDecimal amount, @NotBlank String method, String note) {}
    public record CreateBusinessUser(@NotBlank String userId, String role) {}
    public record UpdateBusinessUser(@NotBlank String role) {}
    public record CreateInvitation(
            String debtorId, @Email String email, String phone, @NotBlank String type,
            String role, Instant expiresAt) {}
    public record AcceptInvitation(@NotBlank String code) {}
    public record PageQuery(@Min(1) Integer page, @Min(1) @jakarta.validation.constraints.Max(100) Integer limit,
                            String search, String sortBy, String order) {}
}
