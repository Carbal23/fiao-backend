package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "Invitation", uniqueConstraints = @UniqueConstraint(name = "Invitation_code_key", columnNames = "code"))
public class Invitation extends BaseEntity {
    @Column(nullable = false)
    private String code;
    @Column(nullable = false, columnDefinition = "timestamp(3)")
    private LocalDateTime expiresAt;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"InvitationStatus\"")
    private InvitationStatus status = InvitationStatus.PENDING;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"InvitationType\"")
    private InvitationType type = InvitationType.DEBTOR;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "\"BusinessUserRole\"")
    private BusinessUserRole role;
    private String email;
    private String phone;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "businessId", nullable = false)
    private Business business;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debtorId")
    private Debtor debtor;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public InvitationStatus getStatus() { return status; }
    public void setStatus(InvitationStatus status) { this.status = status; }
    public InvitationType getType() { return type; }
    public void setType(InvitationType type) { this.type = type; }
    public BusinessUserRole getRole() { return role; }
    public void setRole(BusinessUserRole role) { this.role = role; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
    public Debtor getDebtor() { return debtor; }
    public void setDebtor(Debtor debtor) { this.debtor = debtor; }
}
