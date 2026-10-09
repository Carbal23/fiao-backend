package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.Business;
import com.fiao.model.Debt;
import com.fiao.model.DebtStatus;
import com.fiao.model.Debtor;
import com.fiao.persistence.BusinessRepository;
import com.fiao.persistence.DebtRepository;
import com.fiao.persistence.DebtorRepository;
import com.fiao.persistence.PaymentRepository;
import com.fiao.persistence.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DebtsService {
    private static final Set<String> STATUSES = Set.of("OPEN", "PARTIAL", "PAID", "CANCELLED");

    private final DebtRepository debts;
    private final DebtorRepository debtors;
    private final BusinessRepository businesses;
    private final UserRepository users;
    private final PaymentRepository payments;

    public DebtsService(DebtRepository debts, DebtorRepository debtors, BusinessRepository businesses,
                        UserRepository users, PaymentRepository payments) {
        this.debts = debts;
        this.debtors = debtors;
        this.businesses = businesses;
        this.users = users;
        this.payments = payments;
    }

    @Transactional
    public Map<String, Object> createDebt(String businessId, String userId, Requests.CreateDebt dto) {
        Debtor debtor = debtors.findByIdAndBusinessId(dto.debtorId(), businessId)
                .filter(candidate -> candidate.getInactivatedAt() == null)
                .orElseThrow(() -> ApiException.notFound("Deudor no encontrado"));
        Business business = businesses.findById(businessId)
                .orElseThrow(() -> ApiException.notFound("Negocio no encontrado"));
        Debt debt = new Debt();
        debt.setId(ApiData.id());
        debt.setBusiness(business);
        debt.setDebtor(debtor);
        BigDecimal amount = ApiData.money(dto.amount());
        debt.setAmount(amount);
        debt.setBalance(amount);
        debt.setCurrency(business.getCurrency());
        debt.setDescription(dto.description());
        debt.setStatus(DebtStatus.OPEN);
        debt.setDueDate(dto.dueDate() == null ? null : LocalDateTime.ofInstant(dto.dueDate(), ZoneOffset.UTC));
        debt.setCreatedByUser(users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found")));
        return debtDetail(debts.saveAndFlush(debt));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debts(String businessId, Requests.PageQuery query, String status, Boolean overdue) {
        return searchPage(businessId, null, query, status, overdue);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debtsByDebtor(String debtorId, String businessId, Requests.PageQuery query,
                                             String status, Boolean overdue) {
        if (debtors.findByIdAndBusinessId(debtorId, businessId).isEmpty()) {
            throw ApiException.notFound("Deudor no encontrado");
        }
        return searchPage(businessId, debtorId, query, status, overdue);
    }

    @Transactional
    public Map<String, Object> updateDebtStatus(String id, String businessId, Requests.UpdateDebtStatus dto) {
        ApiData.requireEnum(dto.status(), STATUSES, "status");
        Debt debt = debts.findById(id).filter(candidate -> candidate.getBusiness().getId().equals(businessId))
                .orElseThrow(() -> ApiException.notFound("Deuda no encontrada"));
        Set<String> allowed = switch (debt.getStatus()) {
            case OPEN -> Set.of("PARTIAL", "PAID", "CANCELLED");
            case PARTIAL -> Set.of("PAID", "CANCELLED");
            case CANCELLED, PAID -> Set.of();
        };
        if (!allowed.contains(dto.status())) throw ApiException.badRequest("Transición de estado inválida");
        if ("CANCELLED".equals(dto.status()) && payments.existsByDebtId(id)) {
            throw ApiException.badRequest("No puedes cancelar una deuda con pagos registrados");
        }
        debt.setStatus(DebtStatus.valueOf(dto.status()));
        return debtDetail(debt);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debt(String id, boolean includeRelations) {
        Debt debt = debts.findById(id).orElseThrow(() -> ApiException.notFound("Deuda no encontrada"));
        return includeRelations ? debtDetail(debt) : ApiData.debt(debt, false);
    }

    private Map<String, Object> searchPage(String businessId, String debtorId, Requests.PageQuery query,
                                          String statusValue, Boolean overdue) {
        DebtStatus status = null;
        if (statusValue != null) {
            ApiData.requireEnum(statusValue, STATUSES, "status");
            status = DebtStatus.valueOf(statusValue);
        }
        Page<Debt> page = debts.search(businessId, debtorId, status == null ? DebtStatus.OPEN : status, status != null,
                search(query), overdue,
                ApiData.nowUtc(), DebtStatus.OPEN, DebtStatus.PARTIAL, ApiData.pageable(query));
        List<Map<String, Object>> data = page.getContent().stream().map(this::debtDetail).toList();
        long total = page.getTotalElements();
        return ApiData.map("data", data, "meta", ApiData.map("total", total, "page", page.getNumber() + 1,
                "limit", page.getSize(), "totalPages", page.getTotalPages()));
    }

    private Map<String, Object> debtDetail(Debt debt) {
        Map<String, Object> result = ApiData.debt(debt, true);
        result.put("payments", payments.findAllByDebtIdOrderByPaymentDateDesc(debt.getId()).stream()
                .map(ApiData::payment).toList());
        return result;
    }

    private static String search(Requests.PageQuery query) {
        return query == null || query.search() == null ? "" : query.search();
    }
}
