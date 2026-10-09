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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "Debt", indexes = @Index(name = "Debt_businessId_debtorId_idx", columnList = "businessId, debtorId"))
public class Debt extends UpdatedEntity {
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal balance;
    @Column(nullable = false)
    private String currency = "COP";
    private String description;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"DebtStatus\"")
    private DebtStatus status = DebtStatus.OPEN;
    @Column(columnDefinition = "timestamp(3)")
    private LocalDateTime dueDate;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "businessId", nullable = false)
    private Business business;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "debtorId", nullable = false)
    private Debtor debtor;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "createdBy", nullable = false)
    private User createdByUser;
    @OneToMany(mappedBy = "debt")
    private List<Payment> payments = new ArrayList<>();

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public DebtStatus getStatus() { return status; }
    public void setStatus(DebtStatus status) { this.status = status; }
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
    public Debtor getDebtor() { return debtor; }
    public void setDebtor(Debtor debtor) { this.debtor = debtor; }
    public User getCreatedByUser() { return createdByUser; }
    public void setCreatedByUser(User createdByUser) { this.createdByUser = createdByUser; }
    public List<Payment> getPayments() { return payments; }
}
