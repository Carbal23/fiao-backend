package com.fiao.service;

import com.fiao.api.ApiException;
import com.fiao.api.Requests;
import com.fiao.model.Business;
import com.fiao.model.DocumentType;
import com.fiao.model.Role;
import com.fiao.model.User;
import com.fiao.persistence.BusinessRepository;
import com.fiao.persistence.DebtorRepository;
import com.fiao.persistence.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsersService {
    private static final Set<String> DOCUMENT_TYPES = Set.of("CC", "NIT", "FOREIGNER");
    private static final Set<String> USER_ROLES = Set.of("USER", "ADMIN", "MODERATOR", "SUSPENDED");

    private final UserRepository users;
    private final BusinessRepository businesses;
    private final DebtorRepository debtors;
    private final PasswordEncoder passwordEncoder;

    public UsersService(UserRepository users, BusinessRepository businesses, DebtorRepository debtors,
                        PasswordEncoder passwordEncoder) {
        this.users = users;
        this.businesses = businesses;
        this.debtors = debtors;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Map<String, Object> createUser(Requests.CreateUser dto) {
        ApiData.requireEnum(dto.documentType(), DOCUMENT_TYPES, "documentType");
        String role = dto.role() == null ? "USER" : dto.role();
        ApiData.requireEnum(role, USER_ROLES, "role");
        User existing = users.findExisting(dto.email(), dto.phone(), dto.documentNumber()).orElse(null);
        if (existing != null) {
            if (existing.getInactivatedAt() != null) {
                throw ApiException.badRequest("Ya existe un usuario registrado con estos datos, pero actualmente está inactivo.");
            }
            if (dto.email() != null && dto.email().equals(existing.getEmail())) {
                throw ApiException.badRequest("El correo electrónico ya está registrado.");
            }
            if (dto.phone() != null && dto.phone().equals(existing.getPhone())) {
                throw ApiException.badRequest("El número de teléfono ya está registrado.");
            }
            throw ApiException.badRequest("El número de documento ya está registrado.");
        }
        User user = new User();
        user.setId(ApiData.id());
        user.setEmail(dto.email());
        user.setPhone(dto.phone());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setDocumentType(DocumentType.valueOf(dto.documentType()));
        user.setDocumentNumber(dto.documentNumber());
        user.setRole(Role.valueOf(role));
        users.saveAndFlush(user);
        users.attachMatchingDebtors(user, dto.documentNumber(), dto.phone());
        return ApiData.user(users.findById(user.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> users() {
        return users.findAllByInactivatedAtIsNullOrderByCreatedAtDesc().stream().map(ApiData::user).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> user(String id) {
        return ApiData.user(requireUser(id));
    }

    @Transactional
    public Map<String, Object> updateUser(String id, Requests.UpdateUser dto) {
        User user = requireUser(id);
        if (dto.documentType() != null) ApiData.requireEnum(dto.documentType(), DOCUMENT_TYPES, "documentType");
        if (dto.role() != null) ApiData.requireEnum(dto.role(), USER_ROLES, "role");
        if (dto.firstName() != null) user.setFirstName(dto.firstName());
        if (dto.lastName() != null) user.setLastName(dto.lastName());
        if (dto.documentType() != null) user.setDocumentType(DocumentType.valueOf(dto.documentType()));
        if (dto.documentNumber() != null) user.setDocumentNumber(dto.documentNumber());
        if (dto.email() != null) user.setEmail(dto.email());
        if (dto.phone() != null) user.setPhone(dto.phone());
        if (dto.role() != null) user.setRole(Role.valueOf(dto.role()));
        if (dto.password() != null) user.setPassword(passwordEncoder.encode(dto.password()));
        return ApiData.user(users.save(user));
    }

    @Transactional
    public Map<String, Object> inactivateUser(String id) {
        User user = requireUser(id);
        user.setInactivatedAt(ApiData.nowUtc());
        return Map.of("message", "User inactivated successfully");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard(String userId) {
        requireUser(userId);
        List<Map<String, Object>> owned = businesses.findAllByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .map(b -> ApiData.map("id", b.getId(), "name", b.getName(), "address", b.getAddress(),
                        "currency", b.getCurrency(), "createdAt", b.getCreatedAt())).toList();
        List<Map<String, Object>> working = businesses.findWorkingBusinesses(userId).stream()
                .map(b -> b.getBusinessUsers().stream().filter(m -> m.getUser().getId().equals(userId))
                        .findFirst().map(m -> ApiData.map("id", m.getId(), "role", m.getRole().name(),
                                "business", ApiData.map("id", b.getId(), "name", b.getName(),
                                        "address", b.getAddress(), "currency", b.getCurrency())))
                        .orElseThrow()).toList();
        List<Map<String, Object>> clients = debtors.findAllByUserId(userId).stream().map(d -> {
            Business b = d.getBusiness();
            return ApiData.map("id", d.getId(), "name", d.getName(), "phone", d.getPhone(),
                    "business", ApiData.map("id", b.getId(), "name", b.getName(), "currency", b.getCurrency()));
        }).toList();
        return ApiData.map("ownedBusinesses", owned, "workingBusinesses", working, "clientBusinesses", clients);
    }

    User requireUser(String id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
