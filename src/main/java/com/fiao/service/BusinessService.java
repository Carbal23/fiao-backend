package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.Business;
import com.fiao.model.BusinessUser;
import com.fiao.model.BusinessUserRole;
import com.fiao.model.DebtStatus;
import com.fiao.model.User;
import com.fiao.persistence.BusinessRepository;
import com.fiao.persistence.BusinessUserRepository;
import com.fiao.persistence.DebtRepository;
import com.fiao.persistence.UserRepository;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusinessService {
    private final BusinessRepository businesses;
    private final BusinessUserRepository memberships;
    private final UserRepository users;
    private final DebtRepository debts;

    public BusinessService(BusinessRepository businesses, BusinessUserRepository memberships,
                           UserRepository users, DebtRepository debts) {
        this.businesses = businesses;
        this.memberships = memberships;
        this.users = users;
        this.debts = debts;
    }

    @Transactional
    public Map<String, Object> createBusiness(Requests.CreateBusiness dto, String userId) {
        User owner = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        Business business = new Business();
        business.setId(ApiData.id());
        business.setOwner(owner);
        business.setName(dto.name());
        business.setAddress(dto.address());
        business.setCurrency(dto.currency() == null ? "COP" : dto.currency());
        businesses.save(business);
        BusinessUser membership = new BusinessUser();
        membership.setId(ApiData.id());
        membership.setBusiness(business);
        membership.setUser(owner);
        membership.setRole(BusinessUserRole.OWNER);
        memberships.save(membership);
        return ApiData.business(business);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> businesses(String userId, Requests.PageQuery query) {
        Page<Business> result = businesses.findVisibleToUser(userId, search(query), ApiData.pageable(query));
        List<Map<String, Object>> data = result.getContent().stream().map(business -> {
            Map<String, Object> row = ApiData.business(business);
            row.put("businessUsers", members(business.getId(), false));
            return row;
        }).toList();
        return paginated(result, data);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> business(String id) {
        Business business = requireBusinessEntity(id);
        Map<String, Object> result = ApiData.business(business);
        result.put("businessUsers", members(id, true));
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBusiness(String id, String userId) {
        Business business = requireBusinessEntity(id);
        if (business.getInactivatedAt() != null) throw ApiException.badRequest("Negocio inactivado");
        if (!userId.equals(business.getOwner().getId()) && !memberships.existsByBusinessIdAndUserId(id, userId)) {
            throw ApiException.forbidden("No tienes acceso a este negocio");
        }
        Map<String, Object> result = ApiData.business(business);
        result.put("businessUsers", members(id, true));
        return result;
    }

    @Transactional
    public Map<String, Object> updateBusiness(String id, Requests.UpdateBusiness dto, String userId) {
        Business business = requireBusinessEntity(id);
        if (!userId.equals(business.getOwner().getId())) {
            throw ApiException.forbidden("Solo el propietario puede actualizar el negocio");
        }
        if (business.getInactivatedAt() != null) throw ApiException.badRequest("No puedes modificar un negocio inactivado");
        if (dto.name() != null) business.setName(dto.name());
        if (dto.address() != null) business.setAddress(dto.address());
        if (dto.currency() != null) business.setCurrency(dto.currency());
        return ApiData.business(business);
    }

    @Transactional
    public Map<String, Object> inactivateBusiness(String id, String userId) {
        Business business = requireBusinessEntity(id);
        if (!userId.equals(business.getOwner().getId())) {
            throw ApiException.forbidden("Solo el propietario puede inactivar");
        }
        if (business.getInactivatedAt() != null) throw ApiException.badRequest("El negocio ya está inactivo");
        if (debts.countByBusinessIdAndStatusNotIn(id, List.of(DebtStatus.PAID, DebtStatus.CANCELLED)) > 0) {
            throw ApiException.badRequest("No puedes inactivar un negocio con deudas activas");
        }
        business.setInactivatedAt(ApiData.nowUtc());
        return Map.of("message", "Negocio inactivado correctamente");
    }

    @Transactional(readOnly = true)
    public void requireBusiness(String businessId) {
        if (businessId == null || businessId.isBlank()) {
            throw ApiException.forbidden("Debe especificar el negocio activo (x-business-id)");
        }
        Business business = businesses.findById(businessId)
                .orElseThrow(() -> ApiException.notFound("Negocio no encontrado"));
        if (business.getInactivatedAt() != null) throw ApiException.badRequest("El negocio se encuentra inactivado");
    }

    @Transactional(readOnly = true)
    public void requireBusinessMember(String businessId, String userId, String... roles) {
        requireBusiness(businessId);
        BusinessUser membership = memberships.findByBusinessIdAndUserId(businessId, userId)
                .orElseThrow(() -> ApiException.forbidden("El usuario no pertenece a este negocio"));
        if (roles.length > 0 && !List.of(roles).contains(membership.getRole().name())) {
            throw ApiException.forbidden("Permisos insuficientes para este negocio");
        }
    }

    @Transactional(readOnly = true)
    public Business requireBusinessEntity(String id) {
        return businesses.findById(id).orElseThrow(() -> ApiException.notFound("Negocio no encontrado"));
    }

    private List<Map<String, Object>> members(String businessId, boolean includePhone) {
        return memberships.findAllByBusinessIdOrderByCreatedAtAsc(businessId).stream()
                .map(member -> ApiData.businessUser(member, includePhone)).toList();
    }

    private static String search(Requests.PageQuery query) {
        return query == null || query.search() == null ? "" : query.search();
    }

    private static Map<String, Object> paginated(Page<Business> page, List<Map<String, Object>> data) {
        long total = page.getTotalElements();
        return ApiData.map("data", data, "meta", ApiData.map("total", total, "page", page.getNumber() + 1,
                "limit", page.getSize(), "totalPages", page.getTotalPages()));
    }
}
