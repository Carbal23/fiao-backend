package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.BusinessUser;
import com.fiao.model.BusinessUserRole;
import com.fiao.model.Debtor;
import com.fiao.model.Invitation;
import com.fiao.model.InvitationStatus;
import com.fiao.model.InvitationType;
import com.fiao.model.User;
import com.fiao.persistence.BusinessRepository;
import com.fiao.persistence.BusinessUserRepository;
import com.fiao.persistence.DebtorRepository;
import com.fiao.persistence.InvitationRepository;
import com.fiao.persistence.UserRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationsService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Set<String> TYPES = Set.of("DEBTOR", "BUSINESS_USER");
    private static final Set<String> ROLES = Set.of("OWNER", "ADMIN", "CASHIER", "VIEWER");

    private final InvitationRepository invitations;
    private final BusinessRepository businesses;
    private final DebtorRepository debtors;
    private final BusinessUserRepository memberships;
    private final UserRepository users;

    public InvitationsService(InvitationRepository invitations, BusinessRepository businesses,
                              DebtorRepository debtors, BusinessUserRepository memberships, UserRepository users) {
        this.invitations = invitations;
        this.businesses = businesses;
        this.debtors = debtors;
        this.memberships = memberships;
        this.users = users;
    }

    @Transactional
    public Map<String, Object> createInvitation(String businessId, Requests.CreateInvitation dto) {
        if (dto.email() == null && dto.phone() == null) {
            throw ApiException.badRequest("Debe especificar email o teléfono para enviar la invitación");
        }
        ApiData.requireEnum(dto.type(), TYPES, "type");
        if (dto.role() != null) ApiData.requireEnum(dto.role(), ROLES, "role");
        Debtor debtor = null;
        if ("DEBTOR".equals(dto.type())) {
            if (dto.debtorId() == null) throw ApiException.badRequest("Debe enviar debtorId");
            debtor = debtors.findByIdAndBusinessId(dto.debtorId(), businessId)
                    .orElseThrow(() -> ApiException.notFound("Deudor no existe"));
        } else if (dto.role() == null) {
            throw ApiException.badRequest("Debe especificar rol");
        }
        Instant expiry = dto.expiresAt() == null ? Instant.now().plus(7, ChronoUnit.DAYS) : dto.expiresAt();
        Invitation invitation = new Invitation();
        invitation.setId(ApiData.id());
        invitation.setBusiness(businesses.findById(businessId)
                .orElseThrow(() -> ApiException.notFound("Negocio no encontrado")));
        invitation.setDebtor(debtor);
        invitation.setEmail(dto.email());
        invitation.setPhone(dto.phone());
        invitation.setCode(randomCode());
        invitation.setExpiresAt(LocalDateTime.ofInstant(expiry, ZoneOffset.UTC));
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setType(InvitationType.valueOf(dto.type()));
        invitation.setRole(dto.role() == null ? null : BusinessUserRole.valueOf(dto.role()));
        invitations.save(invitation);
        return ApiData.map("message", "Invitación creada", "invitation", invitation(invitation.getCode()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> invitation(String code) {
        Invitation invitation = invitations.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("Código inválido"));
        validateInvitation(invitation);
        return ApiData.invitation(invitation);
    }

    @Transactional
    public Map<String, Object> acceptInvitation(String code, String userId) {
        Invitation invitation = invitations.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("Código inválido"));
        validateInvitation(invitation);
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (invitation.getType() == InvitationType.DEBTOR && invitation.getDebtor() != null
                && invitation.getDebtor().getUser() == null) {
            invitation.getDebtor().setUser(user);
        }
        if (invitation.getType() == InvitationType.BUSINESS_USER
                && !memberships.existsByBusinessIdAndUserId(invitation.getBusiness().getId(), userId)) {
            BusinessUser member = new BusinessUser();
            member.setId(ApiData.id());
            member.setBusiness(invitation.getBusiness());
            member.setUser(user);
            member.setRole(invitation.getRole() == null ? BusinessUserRole.VIEWER : invitation.getRole());
            memberships.save(member);
        }
        invitation.setStatus(InvitationStatus.ACCEPTED);
        return Map.of("message", "Invitación aceptada correctamente");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> invitations(String businessId, Requests.PageQuery query) {
        Page<Invitation> page = invitations.search(businessId, search(query), ApiData.pageable(query));
        List<Map<String, Object>> data = page.getContent().stream().map(ApiData::invitation).toList();
        long total = page.getTotalElements();
        return ApiData.map("data", data, "meta", ApiData.map("total", total, "page", page.getNumber() + 1,
                "limit", page.getSize(), "totalPages", page.getTotalPages()));
    }

    private void validateInvitation(Invitation invitation) {
        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw ApiException.badRequest("Esta invitación ya fue usada");
        }
        if (invitation.getExpiresAt().toInstant(ZoneOffset.UTC).isBefore(Instant.now())) {
            throw ApiException.badRequest("La invitación ya expiró");
        }
    }

    private static String search(Requests.PageQuery query) {
        return query == null || query.search() == null ? "" : query.search();
    }

    private static String randomCode() {
        byte[] bytes = new byte[3];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
