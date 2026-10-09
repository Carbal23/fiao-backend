package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "User")
public class User extends UpdatedEntity {
    @Column(unique = true)
    private String email;
    @Column(unique = true)
    private String phone;
    private String password;
    @Column(nullable = false)
    private String firstName;
    @Column(nullable = false)
    private String lastName;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"DocumentType\"")
    private DocumentType documentType;
    @Column(nullable = false, unique = true)
    private String documentNumber;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"Role\"")
    private Role role = Role.USER;
    @Column(columnDefinition = "timestamp(3)")
    private LocalDateTime inactivatedAt;
    @OneToMany(mappedBy = "owner")
    private List<Business> businesses = new ArrayList<>();
    @OneToMany(mappedBy = "user")
    private List<BusinessUser> businessUsers = new ArrayList<>();
    @OneToMany(mappedBy = "createdByUser")
    private List<Debt> createdDebts = new ArrayList<>();
    @OneToMany(mappedBy = "user")
    private List<Debtor> debtors = new ArrayList<>();
    @OneToMany(mappedBy = "createdByUser")
    private List<Payment> createdPayments = new ArrayList<>();
    @OneToMany(mappedBy = "user")
    private List<RefreshToken> refreshTokens = new ArrayList<>();

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public LocalDateTime getInactivatedAt() { return inactivatedAt; }
    public void setInactivatedAt(LocalDateTime inactivatedAt) { this.inactivatedAt = inactivatedAt; }
    public List<Business> getBusinesses() { return businesses; }
    public List<BusinessUser> getBusinessUsers() { return businessUsers; }
    public List<Debt> getCreatedDebts() { return createdDebts; }
    public List<Debtor> getDebtors() { return debtors; }
    public List<Payment> getCreatedPayments() { return createdPayments; }
    public List<RefreshToken> getRefreshTokens() { return refreshTokens; }
}
