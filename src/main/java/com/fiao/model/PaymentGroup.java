package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PaymentGroup", indexes = {
        @Index(name = "PaymentGroup_businessId_idx", columnList = "businessId"),
        @Index(name = "PaymentGroup_debtorId_idx", columnList = "debtorId"),
        @Index(name = "PaymentGroup_reversedAt_idx", columnList = "reversedAt")
})
public class PaymentGroup extends BaseEntity {
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;
    @Column(nullable = false)
    private String createdBy;
    @Column(columnDefinition = "timestamp(3)")
    private LocalDateTime reversedAt;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "businessId", nullable = false)
    private Business business;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "debtorId", nullable = false)
    private Debtor debtor;
    @OneToMany(mappedBy = "paymentGroup")
    private List<Payment> payments = new ArrayList<>();

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getReversedAt() { return reversedAt; }
    public void setReversedAt(LocalDateTime reversedAt) { this.reversedAt = reversedAt; }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
    public Debtor getDebtor() { return debtor; }
    public void setDebtor(Debtor debtor) { this.debtor = debtor; }
    public List<Payment> getPayments() { return payments; }
}
