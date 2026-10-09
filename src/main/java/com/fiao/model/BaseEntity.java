package com.fiao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@MappedSuperclass
public abstract class BaseEntity {
    @Id
    @Column(nullable = false, updatable = false)
    protected String id;

    @Column(nullable = false, updatable = false, columnDefinition = "timestamp(3)")
    protected LocalDateTime createdAt;

    @PrePersist
    protected void initializeBaseFields() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
