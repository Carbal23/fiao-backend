package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.Business;
import com.fiao.model.DebtStatus;
import com.fiao.model.Debtor;
import com.fiao.model.DocumentType;
import com.fiao.model.User;
import com.fiao.persistence.BusinessRepository;
import com.fiao.persistence.DebtorRepository;
import com.fiao.persistence.DebtRepository;
import com.fiao.persistence.UserRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DebtorsService {
    private static final Set<String> DOCUMENT_TYPES = Set.of("CC", "NIT", "FOREIGNER");

    private final DebtorRepository debtors;
    private final BusinessRepository businesses;
    private final UserRepository users;
    private final DebtRepository debts;

    public DebtorsService(DebtorRepository debtors, BusinessRepository businesses,
                          UserRepository users, DebtRepository debts) {
        this.debtors = debtors;
        this.businesses = businesses;
        this.users = users;
        this.debts = debts;
    }

    @Transactional
    public Map<String, Object> createDebtor(String businessId, Requests.CreateDebtor dto) {
        if (dto.documentType() != null) ApiData.requireEnum(dto.documentType(), DOCUMENT_TYPES, "documentType");
        if (debtors.findExisting(businessId, dto.documentNumber(), dto.phone()).isPresent()) {
            throw ApiException.badRequest("Ya existe un deudor con estos datos en este negocio.");
        }
        User user = users.findMatchingDebtor(dto.documentNumber(), dto.phone()).orElse(null);
        Debtor debtor = new Debtor();
        debtor.setId(ApiData.id());
        debtor.setBusiness(requireBusiness(businessId));
        debtor.setUser(user);
        debtor.setName(dto.name());
        debtor.setPhone(dto.phone());
        debtor.setDocumentType(dto.documentType() == null ? null : DocumentType.valueOf(dto.documentType()));
        debtor.setDocumentNumber(dto.documentNumber());
        debtor.setNotes(dto.notes());
        return ApiData.debtor(debtors.saveAndFlush(debtor), false);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debtors(String businessId, Requests.PageQuery query, Boolean hasDebt) {
        return debtorPage(debtors.search(businessId, null, search(query), hasDebt,
                DebtStatus.OPEN, DebtStatus.PARTIAL, ApiData.pageable(query)));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debtorsForUser(String userId, Requests.PageQuery query, Boolean hasDebt) {
        return debtorPage(debtors.search(null, userId, search(query), hasDebt,
                DebtStatus.OPEN, DebtStatus.PARTIAL, ApiData.pageable(query)));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debtorSummary(String businessId, int top) {
        long total = debtors.countActiveByBusiness(businessId);
        long withDebt = debtors.countWithDebt(businessId, DebtStatus.OPEN, DebtStatus.PARTIAL);
        BigDecimal balance = debtors.pendingBalanceByBusiness(businessId, DebtStatus.OPEN, DebtStatus.PARTIAL);
        List<Map<String, Object>> topDebtors = new ArrayList<>();
        if (top > 0) {
            debtors.findTopWithBalance(businessId, DebtStatus.OPEN, DebtStatus.PARTIAL, PageRequest.of(0, top))
                    .forEach(row -> {
                Debtor debtor = (Debtor) row[0];
                topDebtors.add(ApiData.debtorSummaryRow(debtor, (BigDecimal) row[1]));
            });
        }
        return ApiData.map("totalBalance", balance == null ? BigDecimal.ZERO : balance,
                "totalDebtors", total, "debtorsWithDebt", withDebt, "debtorsClear", total - withDebt,
                "topDebtors", topDebtors);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debtor(String id, String businessId) {
        Debtor debtor = debtors.findByIdAndBusinessId(id, businessId)
                .filter(candidate -> candidate.getInactivatedAt() == null)
                .orElseThrow(() -> ApiException.notFound("Deudor no encontrado"));
        Map<String, Object> result = ApiData.debtor(debtor, true);
        result.put("user", debtor.getUser() == null ? null : ApiData.user(debtor.getUser()));
        result.put("debts", debts.findAllByDebtorIdOrderByCreatedAtDesc(id).stream()
                .map(this::detailDebt).toList());
        return result;
    }

    @Transactional
    public Map<String, Object> updateDebtor(String id, String businessId, Requests.UpdateDebtor dto) {
        Debtor debtor = activeDebtor(id, businessId);
        if (dto.documentType() != null) ApiData.requireEnum(dto.documentType(), DOCUMENT_TYPES, "documentType");
        if (dto.name() != null) debtor.setName(dto.name());
        if (dto.phone() != null) debtor.setPhone(dto.phone());
        if (dto.documentType() != null) debtor.setDocumentType(DocumentType.valueOf(dto.documentType()));
        if (dto.documentNumber() != null) debtor.setDocumentNumber(dto.documentNumber());
        if (dto.notes() != null) debtor.setNotes(dto.notes());
        return debtor(id, businessId);
    }

    @Transactional
    public Map<String, Object> inactivateDebtor(String id, String businessId) {
        Debtor debtor = activeDebtor(id, businessId);
        if (debtors.hasPendingDebt(id, DebtStatus.OPEN, DebtStatus.PARTIAL)) {
            throw ApiException.badRequest("No se puede inactivar un deudor con saldo pendiente. Registra el pago o cancela sus deudas primero.");
        }
        debtor.setInactivatedAt(ApiData.nowUtc());
        return Map.of("message", "Deudor quedo inactivo correctamente");
    }

    private Map<String, Object> debtorPage(Page<Debtor> page) {
        List<Map<String, Object>> data = page.getContent().stream().map(debtor -> {
            User user = debtor.getUser();
            Business business = debtor.getBusiness();
            return ApiData.map("id", debtor.getId(), "businessId", business.getId(),
                    "userId", user == null ? null : user.getId(), "name", debtor.getName(), "phone", debtor.getPhone(),
                    "documentType", debtor.getDocumentType() == null ? null : debtor.getDocumentType().name(),
                    "documentNumber", debtor.getDocumentNumber(), "notes", debtor.getNotes(),
                    "createdAt", debtor.getCreatedAt(), "updatedAt", debtor.getUpdatedAt(),
                    "inactivatedAt", debtor.getInactivatedAt(),
                    "totalBalance", debtors.pendingBalance(debtor.getId(), DebtStatus.OPEN, DebtStatus.PARTIAL),
                    "hasPendingDebt", debtors.hasPendingDebt(debtor.getId(), DebtStatus.OPEN, DebtStatus.PARTIAL),
                    "user", user == null ? null : ApiData.user(user, false),
                    "business", ApiData.map("id", business.getId(), "name", business.getName()));
        }).toList();
        long total = page.getTotalElements();
        return ApiData.map("data", data, "meta", ApiData.map("total", total, "page", page.getNumber() + 1,
                "limit", page.getSize(), "totalPages", page.getTotalPages()));
    }

    private Map<String, Object> detailDebt(com.fiao.model.Debt debt) {
        Map<String, Object> result = ApiData.debt(debt, false);
        result.put("businessId", debt.getBusiness().getId());
        result.put("debtorId", debt.getDebtor().getId());
        result.put("createdBy", debt.getCreatedByUser().getId());
        return result;
    }

    private Debtor activeDebtor(String id, String businessId) {
        return debtors.findByIdAndBusinessId(id, businessId)
                .filter(candidate -> candidate.getInactivatedAt() == null)
                .orElseThrow(() -> ApiException.notFound("Deudor no encontrado"));
    }

    private Business requireBusiness(String businessId) {
        return businesses.findById(businessId).orElseThrow(() -> ApiException.notFound("Negocio no encontrado"));
    }

    private static String search(Requests.PageQuery query) {
        return query == null || query.search() == null ? "" : query.search();
    }
}
