package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@MappedSuperclass
public abstract class UpdatedEntity extends BaseEntity {
    @Column(nullable = false, columnDefinition = "timestamp(3)")
    protected LocalDateTime updatedAt;

    @PrePersist
    @Override
    protected void initializeBaseFields() {
        super.initializeBaseFields();
        if (updatedAt == null) updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    @PreUpdate
    protected void updateTimestamp() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
