package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.Business;
import com.fiao.model.Debt;
import com.fiao.model.DebtStatus;
import com.fiao.model.Debtor;
import com.fiao.model.Payment;
import com.fiao.model.PaymentGroup;
import com.fiao.model.PaymentMethod;
import com.fiao.model.PaymentType;
import com.fiao.persistence.BusinessRepository;
import com.fiao.persistence.DebtRepository;
import com.fiao.persistence.DebtorRepository;
import com.fiao.persistence.PaymentGroupRepository;
import com.fiao.persistence.PaymentRepository;
import com.fiao.persistence.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentsService {
    private static final Set<String> METHODS = Set.of("CASH", "TRANSFER", "OTHER");
    private static final Set<String> TYPES = Set.of("PAYMENT", "ADJUSTMENT", "REVERSAL");

    private final PaymentRepository payments;
    private final DebtRepository debts;
    private final PaymentGroupRepository groups;
    private final BusinessRepository businesses;
    private final DebtorRepository debtors;
    private final UserRepository users;

    public PaymentsService(PaymentRepository payments, DebtRepository debts, PaymentGroupRepository groups,
                           BusinessRepository businesses, DebtorRepository debtors, UserRepository users) {
        this.payments = payments;
        this.debts = debts;
        this.groups = groups;
        this.businesses = businesses;
        this.debtors = debtors;
        this.users = users;
    }

    @Transactional
    public Map<String, Object> createPayment(String businessId, String userId, Requests.CreatePayment dto) {
        ApiData.requireEnum(dto.method(), METHODS, "method");
        ApiData.requireEnum(dto.type(), TYPES, "type");
        if (dto.amount().signum() <= 0) throw ApiException.badRequest("El monto debe ser mayor a cero");
        Debt debt = debts.findByIdForUpdate(dto.debtId())
                .orElseThrow(() -> ApiException.notFound("Deuda no encontrada"));
        validatePayment(debt, businessId, dto.amount(), dto.type());
        Payment payment = createMovement(debt, businessId, userId, dto.amount(), dto.method(), dto.type(), dto.note(), null);
        recalculateDebt(debt);
        return ApiData.payment(payment);
    }

    @Transactional
    public Map<String, Object> globalPayment(String businessId, String userId, Requests.CreateGlobalPayment dto) {
        ApiData.requireEnum(dto.method(), METHODS, "method");
        Debtor debtor = debtors.findByIdAndBusinessId(dto.debtorId(), businessId)
                .orElseThrow(() -> ApiException.notFound("Deudor no encontrado"));
        List<Debt> pending = debts.findOpenForDebtorForUpdate(
                dto.debtorId(), businessId, DebtStatus.OPEN, DebtStatus.PARTIAL);
        if (pending.isEmpty()) throw ApiException.badRequest("El deudor no tiene deudas pendientes");
        BigDecimal total = pending.stream().map(Debt::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (dto.amount().compareTo(total) > 0) {
            throw ApiException.badRequest("El monto excede la deuda total (" + total + ")");
        }
        PaymentGroup group = new PaymentGroup();
        group.setId(ApiData.id());
        group.setBusiness(requireBusiness(businessId));
        group.setDebtor(debtor);
        group.setTotalAmount(ApiData.money(dto.amount()));
        group.setCreatedBy(userId);
        groups.save(group);

        BigDecimal remaining = ApiData.money(dto.amount());
        List<Map<String, Object>> applied = new ArrayList<>();
        for (Debt debt : pending) {
            if (remaining.signum() <= 0) break;
            BigDecimal previous = debt.getBalance();
            BigDecimal amount = remaining.min(previous);
            Payment payment = createMovement(debt, businessId, userId, amount, dto.method(), "PAYMENT", dto.note(), group);
            recalculateDebt(debt);
            applied.add(ApiData.map("paymentId", payment.getId(), "debtId", debt.getId(),
                    "appliedAmount", amount, "previousBalance", previous, "newBalance", debt.getBalance(),
                    "status", debt.getStatus().name()));
            remaining = remaining.subtract(amount);
        }
        return ApiData.map("message", "Pago global aplicado",
                "group", ApiData.map("id", group.getId(), "totalAmount", dto.amount()),
                "debtor", ApiData.map("id", debtor.getId(), "name", debtor.getName()),
                "summary", ApiData.map("totalApplied", dto.amount(), "debtsAffected", applied.size()),
                "payments", applied);
    }

    @Transactional
    public Map<String, Object> reversePaymentGroup(String businessId, String userId, String groupId) {
        PaymentGroup group = groups.findByIdForUpdate(groupId)
                .orElseThrow(() -> ApiException.notFound("Grupo de pago no encontrado"));
        if (!businessId.equals(group.getBusiness().getId())) throw ApiException.badRequest("No pertenece al negocio");
        if (group.getReversedAt() != null) throw ApiException.badRequest("Este pago global ya fue reversado");
        List<Payment> originalPayments = payments.findAllByPaymentGroupIdAndType(groupId, PaymentType.PAYMENT);
        if (originalPayments.isEmpty()) throw ApiException.badRequest("No hay pagos para reversar");
        for (Payment original : originalPayments) {
            Debt debt = debts.findByIdForUpdate(original.getDebt().getId())
                    .orElseThrow(() -> ApiException.notFound("Deuda no encontrada"));
            createMovement(debt, businessId, userId, original.getAmount(), original.getMethod().name(),
                    "REVERSAL", "Reversal of " + original.getId(), null);
            recalculateDebt(debt);
        }
        group.setReversedAt(ApiData.nowUtc());
        return Map.of("message", "Pago global reversado correctamente", "reversedCount", originalPayments.size());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> payments(String businessId, Requests.PageQuery query, String type, String method) {
        return paymentPage(businessId, null, query, type, method);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> paymentsByDebt(String debtId, String businessId, Requests.PageQuery query,
                                              String type, String method) {
        if (debts.countByIdAndBusinessId(debtId, businessId) == 0) {
            throw ApiException.notFound("Deuda no encontrada");
        }
        return paymentPage(businessId, debtId, query, type, method);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> paymentsForDebt(String debtId) {
        return payments.findAllByDebtIdOrderByPaymentDateDesc(debtId).stream().map(ApiData::payment).toList();
    }

    private Map<String, Object> paymentPage(String businessId, String debtId, Requests.PageQuery query,
                                            String typeValue, String methodValue) {
        PaymentType type = null;
        PaymentMethod method = null;
        if (typeValue != null) {
            ApiData.requireEnum(typeValue, TYPES, "type");
            type = PaymentType.valueOf(typeValue);
        }
        if (methodValue != null) {
            ApiData.requireEnum(methodValue, METHODS, "method");
            method = PaymentMethod.valueOf(methodValue);
        }
        Page<Payment> page = payments.search(businessId, debtId,
                type == null ? PaymentType.PAYMENT : type, type != null,
                method == null ? PaymentMethod.CASH : method, method != null,
                search(query), ApiData.pageable(query));
        List<Map<String, Object>> data = page.getContent().stream().map(ApiData::payment).toList();
        long total = page.getTotalElements();
        return ApiData.map("data", data, "meta", ApiData.map("total", total, "page", page.getNumber() + 1,
                "limit", page.getSize(), "totalPages", page.getTotalPages()));
    }

    private void validatePayment(Debt debt, String businessId, BigDecimal amount, String type) {
        if (!businessId.equals(debt.getBusiness().getId())) {
            throw ApiException.badRequest("La deuda no pertenece al negocio activo");
        }
        if (debt.getStatus() == DebtStatus.PAID && "PAYMENT".equals(type)) {
            throw ApiException.badRequest("La deuda ya está saldada");
        }
        if ("PAYMENT".equals(type) && amount.compareTo(debt.getBalance()) > 0) {
            throw ApiException.badRequest("El pago no puede ser mayor al saldo actual (" + debt.getBalance() + ")");
        }
        if (debt.getStatus() == DebtStatus.CANCELLED) {
            throw ApiException.badRequest("La deuda fue cancelada, no se pueden registrar pagos");
        }
    }

    private Payment createMovement(Debt debt, String businessId, String userId, BigDecimal amount,
                                   String method, String type, String note, PaymentGroup group) {
        Payment payment = new Payment();
        payment.setId(ApiData.id());
        payment.setDebt(debt);
        payment.setBusiness(requireBusiness(businessId));
        payment.setCreatedByUser(users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found")));
        payment.setPaymentGroup(group);
        payment.setAmount(ApiData.money(amount));
        payment.setMethod(PaymentMethod.valueOf(method));
        payment.setType(PaymentType.valueOf(type));
        payment.setNote(note);
        return payments.save(payment);
    }

    private void recalculateDebt(Debt debt) {
        if (debt.getStatus() == DebtStatus.CANCELLED) {
            throw ApiException.badRequest("No se pueden recalcular deudas canceladas");
        }
        BigDecimal movements = payments.signedMovements(debt.getId(), PaymentType.PAYMENT);
        BigDecimal balance = debt.getAmount().add(movements == null ? BigDecimal.ZERO : movements)
                .max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        debt.setBalance(balance);
        debt.setStatus(balance.compareTo(debt.getAmount()) == 0 ? DebtStatus.OPEN
                : balance.signum() == 0 ? DebtStatus.PAID : DebtStatus.PARTIAL);
    }

    private Business requireBusiness(String businessId) {
        return businesses.findById(businessId).orElseThrow(() -> ApiException.notFound("Negocio no encontrado"));
    }

    private static String search(Requests.PageQuery query) {
        return query == null || query.search() == null ? "" : query.search();
    }
}
