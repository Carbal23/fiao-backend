package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "BusinessUser", uniqueConstraints = @UniqueConstraint(
        name = "BusinessUser_businessId_userId_key", columnNames = {"businessId", "userId"}))
public class BusinessUser extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"BusinessUserRole\"")
    private BusinessUserRole role = BusinessUserRole.VIEWER;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "businessId", nullable = false)
    private Business business;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    public BusinessUserRole getRole() { return role; }
    public void setRole(BusinessUserRole role) { this.role = role; }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
