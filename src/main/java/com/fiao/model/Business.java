package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Business")
public class Business extends UpdatedEntity {
    @Column(nullable = false)
    private String name;
    private String address;
    @Column(nullable = false)
    private String currency = "COP";
    @Column(columnDefinition = "timestamp(3)")
    private LocalDateTime inactivatedAt;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ownerId", nullable = false)
    private User owner;
    @OneToMany(mappedBy = "business")
    private List<BusinessUser> businessUsers = new ArrayList<>();
    @OneToMany(mappedBy = "business")
    private List<Debt> debts = new ArrayList<>();
    @OneToMany(mappedBy = "business")
    private List<Debtor> debtors = new ArrayList<>();
    @OneToMany(mappedBy = "business")
    private List<Payment> payments = new ArrayList<>();
    @OneToMany(mappedBy = "business")
    private List<Invitation> invitations = new ArrayList<>();
    @OneToMany(mappedBy = "business")
    private List<PaymentGroup> paymentGroups = new ArrayList<>();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDateTime getInactivatedAt() { return inactivatedAt; }
    public void setInactivatedAt(LocalDateTime inactivatedAt) { this.inactivatedAt = inactivatedAt; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public List<BusinessUser> getBusinessUsers() { return businessUsers; }
    public List<Debt> getDebts() { return debts; }
    public List<Debtor> getDebtors() { return debtors; }
    public List<Payment> getPayments() { return payments; }
    public List<Invitation> getInvitations() { return invitations; }
    public List<PaymentGroup> getPaymentGroups() { return paymentGroups; }
}
