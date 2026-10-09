package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.Business;
import com.fiao.model.BusinessUser;
import com.fiao.model.BusinessUserRole;
import com.fiao.model.User;
import com.fiao.persistence.BusinessUserRepository;
import com.fiao.persistence.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusinessUsersService {
    private static final Set<String> ROLES = Set.of("OWNER", "ADMIN", "CASHIER", "VIEWER");

    private final BusinessService businessService;
    private final BusinessUserRepository memberships;
    private final UserRepository users;

    public BusinessUsersService(BusinessService businessService, BusinessUserRepository memberships, UserRepository users) {
        this.businessService = businessService;
        this.memberships = memberships;
        this.users = users;
    }

    @Transactional
    public Map<String, Object> addBusinessUser(String businessId, String userId, String role) {
        String newRole = role == null ? "VIEWER" : role;
        ApiData.requireEnum(newRole, ROLES, "role");
        User user = users.findById(userId).filter(u -> u.getInactivatedAt() == null)
                .orElseThrow(() -> ApiException.notFound("Usuario no registrado en la app"));
        if (memberships.existsByBusinessIdAndUserId(businessId, userId)) {
            throw ApiException.badRequest("El usuario ya pertenece al negocio");
        }
        Business memberBusiness = businessService.requireBusinessEntity(businessId);
        BusinessUser member = new BusinessUser();
        member.setId(ApiData.id());
        member.setBusiness(memberBusiness);
        member.setUser(user);
        member.setRole(BusinessUserRole.valueOf(newRole));
        return ApiData.businessUser(memberships.save(member), true);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> businessUsers(String businessId, Requests.PageQuery query) {
        Page<BusinessUser> page = memberships.findMembers(businessId, search(query), ApiData.pageable(query));
        List<Map<String, Object>> data = page.getContent().stream().map(member -> ApiData.businessUser(member, true)).toList();
        long total = page.getTotalElements();
        return ApiData.map("data", data, "meta", ApiData.map("total", total, "page", page.getNumber() + 1,
                "limit", page.getSize(), "totalPages", page.getTotalPages()));
    }

    @Transactional
    public Map<String, Object> updateBusinessUser(String businessId, String memberId, String currentUserId, String role) {
        ApiData.requireEnum(role, ROLES, "role");
        BusinessUser member = memberships.findById(memberId)
                .filter(candidate -> candidate.getBusiness().getId().equals(businessId))
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado en el negocio"));
        Business business = businessService.requireBusinessEntity(businessId);
        if (member.getUser().getId().equals(business.getOwner().getId())) {
            throw ApiException.forbidden("No puedes modificar el rol del propietario del negocio");
        }
        if (member.getUser().getId().equals(currentUserId)) {
            throw ApiException.forbidden("No puedes modificar tu propio rol");
        }
        member.setRole(BusinessUserRole.valueOf(role));
        return ApiData.businessUser(member, true);
    }

    @Transactional
    public Map<String, Object> removeBusinessUser(String businessId, String memberId, String currentUserId) {
        BusinessUser member = memberships.findById(memberId)
                .filter(candidate -> candidate.getBusiness().getId().equals(businessId))
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado en el negocio"));
        Business business = businessService.requireBusinessEntity(businessId);
        if (member.getUser().getId().equals(business.getOwner().getId())) {
            throw ApiException.forbidden("No puedes eliminar al propietario del negocio");
        }
        if (member.getUser().getId().equals(currentUserId)) {
            throw ApiException.forbidden("No puedes eliminarte a ti mismo");
        }
        memberships.delete(member);
        return Map.of("message", "Usuario eliminado del negocio correctamente");
    }

    private static String search(Requests.PageQuery query) {
        return query == null || query.search() == null ? "" : query.search();
    }
}
