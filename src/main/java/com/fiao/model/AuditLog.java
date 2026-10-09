package com.fiao.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "AuditLog")
public class AuditLog extends BaseEntity {
    private String userId;
    @Column(nullable = false)
    private String action;
    @Column(nullable = false)
    private String entity;
    private String entityId;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode meta;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public JsonNode getMeta() { return meta; }
    public void setMeta(JsonNode meta) { this.meta = meta; }
}
