package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.Business;
import com.fiao.model.BusinessUser;
import com.fiao.model.Debt;
import com.fiao.model.Debtor;
import com.fiao.model.Invitation;
import com.fiao.model.Payment;
import com.fiao.model.User;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

final class ApiData {
    private ApiData() {}

    static String id() { return UUID.randomUUID().toString(); }

    static BigDecimal money(BigDecimal amount) { return amount.setScale(2, RoundingMode.HALF_UP); }

    static void requireEnum(String value, Set<String> allowed, String field) {
        if (value == null || !allowed.contains(value)) throw ApiException.badRequest("Valor inválido para " + field);
    }

    static int page(Requests.PageQuery query) {
        int value = query == null || query.page() == null ? 1 : query.page();
        if (value < 1) throw ApiException.badRequest("page debe ser mayor que cero");
        return value;
    }

    static int limit(Requests.PageQuery query) {
        int value = query == null || query.limit() == null ? 10 : query.limit();
        if (value < 1 || value > 100) throw ApiException.badRequest("limit debe estar entre 1 y 100");
        return value;
    }

    static Pageable pageable(Requests.PageQuery query) {
        return PageRequest.of(page(query) - 1, limit(query), Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    static Map<String, Object> paginated(Page<?> page) {
        long total = page.getTotalElements();
        return map("data", page.getContent(), "meta", map("total", total, "page", page.getNumber() + 1,
                "limit", page.getSize(), "totalPages", page.getTotalPages()));
    }

    static Map<String, Object> map(Object... pairs) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int index = 0; index < pairs.length; index += 2) {
            Object value = pairs[index + 1];
            result.put((String) pairs[index], value instanceof LocalDateTime timestamp
                    ? timestamp.toInstant(ZoneOffset.UTC) : value);
        }
        return result;
    }

    static Map<String, Object> user(User user) {
        return map("id", user.getId(), "email", user.getEmail(), "phone", user.getPhone(),
                "firstName", user.getFirstName(), "lastName", user.getLastName(),
                "documentType", name(user.getDocumentType()), "documentNumber", user.getDocumentNumber(),
                "role", name(user.getRole()), "createdAt", user.getCreatedAt(), "updatedAt", user.getUpdatedAt(),
                "inactivatedAt", user.getInactivatedAt());
    }

    static Map<String, Object> business(Business business) {
        return map("id", business.getId(), "ownerId", business.getOwner().getId(), "name", business.getName(),
                "address", business.getAddress(), "currency", business.getCurrency(), "createdAt", business.getCreatedAt(),
                "updatedAt", business.getUpdatedAt(), "inactivatedAt", business.getInactivatedAt());
    }

    static Map<String, Object> businessUser(BusinessUser member, boolean includePhone) {
        User user = member.getUser();
        Map<String, Object> nested = map("id", user.getId(), "firstName", user.getFirstName(),
                "lastName", user.getLastName(), "email", user.getEmail());
        if (includePhone) nested.put("phone", user.getPhone());
        return map("id", member.getId(), "businessId", member.getBusiness().getId(), "userId", user.getId(),
                "role", name(member.getRole()), "createdAt", member.getCreatedAt(), "user", nested);
    }

    static Map<String, Object> debtor(Debtor debtor, boolean includeBusiness) {
        Map<String, Object> result = map("id", debtor.getId(), "businessId", debtor.getBusiness().getId(),
                "userId", debtor.getUser() == null ? null : debtor.getUser().getId(), "name", debtor.getName(),
                "phone", debtor.getPhone(), "documentType", name(debtor.getDocumentType()),
                "documentNumber", debtor.getDocumentNumber(), "notes", debtor.getNotes(),
                "createdAt", debtor.getCreatedAt(), "updatedAt", debtor.getUpdatedAt(),
                "inactivatedAt", debtor.getInactivatedAt());
        if (includeBusiness) {
            result.put("business", map("id", debtor.getBusiness().getId(), "name", debtor.getBusiness().getName()));
        }
        return result;
    }

    static Map<String, Object> debtorSummaryRow(Debtor debtor, BigDecimal balance) {
        User user = debtor.getUser();
        return map("id", debtor.getId(), "businessId", debtor.getBusiness().getId(),
                "userId", user == null ? null : user.getId(), "name", debtor.getName(), "phone", debtor.getPhone(),
                "documentType", name(debtor.getDocumentType()), "documentNumber", debtor.getDocumentNumber(),
                "notes", debtor.getNotes(), "createdAt", debtor.getCreatedAt(), "updatedAt", debtor.getUpdatedAt(),
                "inactivatedAt", debtor.getInactivatedAt(), "totalBalance", balance, "hasPendingDebt", true,
                "user", user == null ? null : user(user, false));
    }

    static Map<String, Object> user(User user, boolean includeInactiveAt) {
        Map<String, Object> result = user(user);
        if (!includeInactiveAt) result.remove("inactivatedAt");
        return result;
    }

    static Map<String, Object> debt(Debt debt, boolean includeRelations) {
        Map<String, Object> result = map("id", debt.getId(), "amount", debt.getAmount(), "balance", debt.getBalance(),
                "currency", debt.getCurrency(), "description", debt.getDescription(), "status", name(debt.getStatus()),
                "dueDate", debt.getDueDate(), "createdAt", debt.getCreatedAt(), "updatedAt", debt.getUpdatedAt());
        if (includeRelations) {
            Business business = debt.getBusiness();
            Debtor debtor = debt.getDebtor();
            User user = debt.getCreatedByUser();
            result.put("business", map("id", business.getId(), "name", business.getName(), "currency", business.getCurrency()));
            result.put("debtor", map("id", debtor.getId(), "name", debtor.getName(), "phone", debtor.getPhone()));
            result.put("createdByUser", map("id", user.getId(), "firstName", user.getFirstName(), "lastName", user.getLastName()));
        }
        return result;
    }

    static Map<String, Object> payment(Payment payment) {
        User user = payment.getCreatedByUser();
        return map("id", payment.getId(), "amount", payment.getAmount(), "paymentDate", payment.getPaymentDate(),
                "method", name(payment.getMethod()), "type", name(payment.getType()), "note", payment.getNote(),
                "createdAt", payment.getCreatedAt(), "createdByUser",
                map("id", user.getId(), "firstName", user.getFirstName(), "lastName", user.getLastName()));
    }

    static Map<String, Object> invitation(Invitation invitation) {
        Debtor debtor = invitation.getDebtor();
        return map("id", invitation.getId(), "code", invitation.getCode(), "email", invitation.getEmail(),
                "phone", invitation.getPhone(), "debtorId", debtor == null ? null : debtor.getId(),
                "businessId", invitation.getBusiness().getId(), "expiresAt", invitation.getExpiresAt(),
                "status", name(invitation.getStatus()), "type", name(invitation.getType()),
                "role", name(invitation.getRole()), "createdAt", invitation.getCreatedAt(),
                "debtor", debtor == null ? null : map("id", debtor.getId(), "name", debtor.getName(), "phone", debtor.getPhone()));
    }

    static LocalDateTime nowUtc() { return LocalDateTime.now(ZoneOffset.UTC); }

    private static String name(Enum<?> value) { return value == null ? null : value.name(); }
}
