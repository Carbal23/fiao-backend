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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "Payment", indexes = {
        @Index(name = "Payment_businessId_idx", columnList = "businessId"),
        @Index(name = "Payment_debtId_businessId_idx", columnList = "debtId, businessId"),
        @Index(name = "Payment_paymentGroupId_idx", columnList = "paymentGroupId")
})
public class Payment extends UpdatedEntity {
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(nullable = false, columnDefinition = "timestamp(3)")
    private LocalDateTime paymentDate;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"PaymentMethod\"")
    private PaymentMethod method = PaymentMethod.CASH;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"PaymentType\"")
    private PaymentType type = PaymentType.PAYMENT;
    private String note;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "debtId", nullable = false)
    private Debt debt;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "businessId", nullable = false)
    private Business business;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paymentGroupId")
    private PaymentGroup paymentGroup;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "createdBy", nullable = false)
    private User createdByUser;

    @jakarta.persistence.PrePersist
    @Override
    protected void initializeBaseFields() {
        super.initializeBaseFields();
        if (paymentDate == null) paymentDate = LocalDateTime.now(ZoneOffset.UTC);
    }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
    public PaymentMethod getMethod() { return method; }
    public void setMethod(PaymentMethod method) { this.method = method; }
    public PaymentType getType() { return type; }
    public void setType(PaymentType type) { this.type = type; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Debt getDebt() { return debt; }
    public void setDebt(Debt debt) { this.debt = debt; }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
    public PaymentGroup getPaymentGroup() { return paymentGroup; }
    public void setPaymentGroup(PaymentGroup paymentGroup) { this.paymentGroup = paymentGroup; }
    public User getCreatedByUser() { return createdByUser; }
    public void setCreatedByUser(User createdByUser) { this.createdByUser = createdByUser; }
}
