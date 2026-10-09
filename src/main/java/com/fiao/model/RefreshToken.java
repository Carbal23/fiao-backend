package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "RefreshToken", indexes = @Index(name = "RefreshToken_userId_idx", columnList = "userId"))
public class RefreshToken extends BaseEntity {
    @Column(nullable = false)
    private String tokenHash;
    @Column(nullable = false, columnDefinition = "timestamp(3)")
    private LocalDateTime expiresAt;
    private String deviceInfo;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
