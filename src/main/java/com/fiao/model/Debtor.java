package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "Debtor", indexes = {
        @Index(name = "Debtor_businessId_phone_idx", columnList = "businessId, phone"),
        @Index(name = "Debtor_businessId_documentNumber_idx", columnList = "businessId, documentNumber")
})
public class Debtor extends UpdatedEntity {
    @Column(nullable = false)
    private String name;
    private String phone;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "\"DocumentType\"")
    private DocumentType documentType;
    private String documentNumber;
    private String notes;
    @Column(columnDefinition = "timestamp(3)")
    private LocalDateTime inactivatedAt;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "businessId", nullable = false)
    private Business business;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    private User user;
    @OneToMany(mappedBy = "debtor")
    private List<Debt> debts = new ArrayList<>();
    @OneToMany(mappedBy = "debtor")
    private List<Invitation> invitations = new ArrayList<>();
    @OneToMany(mappedBy = "debtor")
    private List<PaymentGroup> paymentGroups = new ArrayList<>();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getInactivatedAt() { return inactivatedAt; }
    public void setInactivatedAt(LocalDateTime inactivatedAt) { this.inactivatedAt = inactivatedAt; }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public List<Debt> getDebts() { return debts; }
    public List<Invitation> getInvitations() { return invitations; }
    public List<PaymentGroup> getPaymentGroups() { return paymentGroups; }
}
