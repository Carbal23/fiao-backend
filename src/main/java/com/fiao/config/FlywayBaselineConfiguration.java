package com.fiao.config;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayBaselineConfiguration {
    private static final Map<String, Set<String>> REQUIRED_COLUMNS = Map.ofEntries(
            Map.entry("User", Set.of("id", "email", "phone", "password", "firstName", "lastName",
                    "documentType", "documentNumber", "role", "createdAt", "updatedAt", "inactivatedAt")),
            Map.entry("Business", Set.of("id", "ownerId", "name", "address", "currency", "createdAt", "updatedAt", "inactivatedAt")),
            Map.entry("BusinessUser", Set.of("id", "businessId", "userId", "role", "createdAt")),
            Map.entry("Debtor", Set.of("id", "businessId", "userId", "name", "phone", "documentType",
                    "documentNumber", "notes", "createdAt", "updatedAt", "inactivatedAt")),
            Map.entry("Debt", Set.of("id", "businessId", "debtorId", "amount", "balance", "currency",
                    "description", "status", "dueDate", "createdBy", "createdAt", "updatedAt")),
            Map.entry("Payment", Set.of("id", "debtId", "businessId", "paymentGroupId", "amount",
                    "paymentDate", "method", "type", "note", "createdBy", "createdAt", "updatedAt")),
            Map.entry("PaymentGroup", Set.of("id", "businessId", "debtorId", "totalAmount", "createdBy", "createdAt", "reversedAt")),
            Map.entry("Invitation", Set.of("id", "businessId", "debtorId", "email", "phone", "code",
                    "expiresAt", "status", "type", "role", "createdAt")),
            Map.entry("AuditLog", Set.of("id", "userId", "action", "entity", "entityId", "meta", "createdAt")),
            Map.entry("RefreshToken", Set.of("id", "userId", "tokenHash", "expiresAt", "createdAt", "deviceInfo")));
    private static final Map<String, List<String>> REQUIRED_ENUMS = Map.of(
            "DocumentType", List.of("CC", "NIT", "FOREIGNER"),
            "Role", List.of("USER", "ADMIN", "MODERATOR", "SUSPENDED"),
            "BusinessUserRole", List.of("ADMIN", "CASHIER", "VIEWER", "OWNER"),
            "DebtStatus", List.of("OPEN", "PARTIAL", "PAID", "CANCELLED"),
            "PaymentMethod", List.of("CASH", "TRANSFER", "OTHER"),
            "PaymentType", List.of("PAYMENT", "ADJUSTMENT", "REVERSAL"),
            "InvitationStatus", List.of("PENDING", "ACCEPTED", "EXPIRED"),
            "InvitationType", List.of("DEBTOR", "BUSINESS_USER"));

    @Bean
    FlywayMigrationStrategy safeFlywayMigrationStrategy(
            @Value("${fiao.database.baseline-existing-schema:false}") boolean baselineExistingSchema) {
        return flyway -> {
            if (baselineExistingSchema && flyway.info().current() == null && hasApplicationTables(flyway)) {
                verifyExistingSchema(flyway.getConfiguration().getDataSource());
                flyway.baseline();
            }
            flyway.migrate();
        };
    }

    private static boolean hasApplicationTables(Flyway flyway) {
        try (Connection connection = flyway.getConfiguration().getDataSource().getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     SELECT EXISTS (
                       SELECT 1 FROM information_schema.tables
                       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                         AND table_name NOT IN ('flyway_schema_history', '_prisma_migrations')
                     )
                     """);
             ResultSet result = statement.executeQuery()) {
            result.next();
            return result.getBoolean(1);
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not inspect the database before Flyway baseline", exception);
        }
    }

    private static void verifyExistingSchema(DataSource dataSource) {
        try (Connection connection = dataSource.getConnection()) {
            for (Map.Entry<String, Set<String>> table : REQUIRED_COLUMNS.entrySet()) {
                for (String column : table.getValue()) {
                    try (PreparedStatement statement = connection.prepareStatement("""
                            SELECT EXISTS (
                              SELECT 1 FROM information_schema.columns
                              WHERE table_schema = 'public' AND table_name = ? AND column_name = ?
                            )
                            """)) {
                        statement.setString(1, table.getKey());
                        statement.setString(2, column);
                        try (ResultSet result = statement.executeQuery()) {
                            result.next();
                            if (!result.getBoolean(1)) {
                                throw new IllegalStateException("Refusing to baseline: missing column "
                                        + table.getKey() + "." + column);
                            }
                        }
                    }
                }
            }
            for (Map.Entry<String, List<String>> postgresEnum : REQUIRED_ENUMS.entrySet()) {
                try (PreparedStatement statement = connection.prepareStatement("""
                        SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
                        FROM pg_type t
                        JOIN pg_namespace n ON n.oid = t.typnamespace
                        JOIN pg_enum e ON e.enumtypid = t.oid
                        WHERE n.nspname = 'public' AND t.typname = ?
                        """)) {
                    statement.setString(1, postgresEnum.getKey());
                    try (ResultSet result = statement.executeQuery()) {
                        result.next();
                        String actual = result.getString(1);
                        String expected = "{" + String.join(",", postgresEnum.getValue()) + "}";
                        if (!expected.equals(actual)) {
                            throw new IllegalStateException("Refusing to baseline: PostgreSQL enum "
                                    + postgresEnum.getKey() + " does not match the expected schema");
                        }
                    }
                }
            }
            try (PreparedStatement statement = connection.prepareStatement("""
                    SELECT EXISTS (
                      SELECT 1 FROM pg_indexes
                      WHERE schemaname = 'public' AND tablename = 'User'
                        AND indexdef ILIKE '%("documentNumber")%'
                        AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
                    )
                    """);
                 ResultSet result = statement.executeQuery()) {
                result.next();
                if (!result.getBoolean(1)) {
                    throw new IllegalStateException("Refusing to baseline: User.documentNumber unique index is missing");
                }
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not verify the existing database schema for Flyway baseline", exception);
        }
    }
}
