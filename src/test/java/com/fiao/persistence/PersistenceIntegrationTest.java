package com.fiao.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fiao.model.Business;
import com.fiao.api.ApiException;
import com.fiao.model.Debt;
import com.fiao.model.Debtor;
import com.fiao.model.Payment;
import com.fiao.model.User;
import com.fiao.api.Requests;
import com.fiao.service.AuthService;
import com.fiao.service.BusinessService;
import com.fiao.service.BusinessUsersService;
import com.fiao.service.DebtorsService;
import com.fiao.service.DebtsService;
import com.fiao.service.InvitationsService;
import com.fiao.service.PaymentsService;
import com.fiao.service.UsersService;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = "JWT_SECRET=integration-test-secret-that-is-at-least-32-bytes-long")
class PersistenceIntegrationTest {
    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private UsersService usersService;

    @Autowired
    private AuthService authService;

    @Autowired
    private BusinessService businessService;

    @Autowired
    private BusinessUsersService businessUsersService;

    @Autowired
    private DebtorsService debtorsService;

    @Autowired
    private DebtsService debtsService;

    @Autowired
    private PaymentsService paymentsService;

    @Autowired
    private InvitationsService invitationsService;

    @Autowired
    private Flyway flyway;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Test
    void flywayCreatesFinalSchemaAndRepeatedStartupIsSafe() {
        assertEquals(1, flyway.info().applied().length);
        Number tableCount = (Number) entityManager.createNativeQuery("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name IN (
                  'User','Business','BusinessUser','Debtor','Debt','Payment','PaymentGroup',
                  'Invitation','AuditLog','RefreshToken')
                """).getSingleResult();
        assertEquals(10, tableCount.intValue());
        flyway.migrate();
        assertEquals(1, flyway.info().applied().length);
    }

    @Test
    void userBusinessDebtorDebtAndPaymentPersistWithRelationsAndBalances() {
        String suffix = UUID.randomUUID().toString();
        Map<String, Object> user = usersService.createUser(new Requests.CreateUser(
                "Ada", "Lovelace", "CC", suffix, "ada-" + suffix + "@example.test",
                null, "secure-password", null));
        String userId = (String) user.get("id");
        Map<String, Object> business = businessService.createBusiness(
                new Requests.CreateBusiness("Analytical Engines", null, null), userId);
        String businessId = (String) business.get("id");
        Map<String, Object> debtor = debtorsService.createDebtor(businessId,
                new Requests.CreateDebtor("Charles Babbage", "555" + suffix.substring(0, 6),
                        "NIT", suffix, null));
        String debtorId = (String) debtor.get("id");
        Map<String, Object> debt = debtsService.createDebt(businessId, userId,
                new Requests.CreateDebt(debtorId, new BigDecimal("125.00"), "Engine design", null));
        String debtId = (String) debt.get("id");
        Map<String, Object> secondDebt = debtsService.createDebt(businessId, userId,
                new Requests.CreateDebt(debtorId, new BigDecimal("125.00"), "Second engine design", null));
        String secondDebtId = (String) secondDebt.get("id");
        Map<String, Object> payment = paymentsService.createPayment(businessId, userId,
                new Requests.CreatePayment(debtId, new BigDecimal("25.00"), "CASH", "PAYMENT", null));
        Map<String, Object> globalPayment = paymentsService.globalPayment(businessId, userId,
                new Requests.CreateGlobalPayment(debtorId, new BigDecimal("130.00"), "CASH", null));
        java.util.List<?> appliedPayments = (java.util.List<?>) globalPayment.get("payments");
        assertEquals(debtId, ((Map<?, ?>) appliedPayments.get(0)).get("debtId"));
        assertEquals(new BigDecimal("100.00"), ((Map<?, ?>) appliedPayments.get(0)).get("appliedAmount"));
        assertEquals(secondDebtId, ((Map<?, ?>) appliedPayments.get(1)).get("debtId"));
        assertEquals(new BigDecimal("30.00"), ((Map<?, ?>) appliedPayments.get(1)).get("appliedAmount"));
        String paymentGroupId = (String) ((Map<?, ?>) globalPayment.get("group")).get("id");
        paymentsService.reversePaymentGroup(businessId, userId, paymentGroupId);
        paymentsService.createPayment(businessId, userId,
                new Requests.CreatePayment(debtId, new BigDecimal("5.00"), "CASH", "ADJUSTMENT", "balance correction"));
        Requests.PageQuery page = new Requests.PageQuery(null, null, null, null, null);
        assertEquals(1, ((java.util.List<?>) businessService.businesses(userId, page).get("data")).size());
        assertEquals(1, ((java.util.List<?>) businessUsersService.businessUsers(businessId, page).get("data")).size());
        assertEquals(1, ((java.util.List<?>) debtorsService.debtors(businessId, page, null).get("data")).size());
        assertEquals(2, ((java.util.List<?>) debtsService.debts(businessId, page, null, null).get("data")).size());
        assertEquals(6, ((java.util.List<?>) paymentsService.payments(businessId, page, null, null).get("data")).size());

        entityManager.clear();
        User persistedUser = entityManager.find(User.class, userId);
        Business persistedBusiness = entityManager.find(Business.class, businessId);
        Debtor persistedDebtor = entityManager.find(Debtor.class, debtorId);
        Debt persistedDebt = entityManager.find(Debt.class, debtId);
        Payment persistedPayment = entityManager.find(Payment.class, payment.get("id"));

        assertNotNull(persistedUser);
        assertEquals(userId, persistedBusiness.getOwner().getId());
        assertEquals(businessId, persistedDebtor.getBusiness().getId());
        assertEquals(userId, persistedDebtor.getUser().getId());
        assertEquals(new BigDecimal("125.00"), persistedDebt.getAmount());
        assertEquals(new BigDecimal("105.00"), persistedDebt.getBalance());
        assertEquals("PARTIAL", persistedDebt.getStatus().name());
        assertEquals(new BigDecimal("125.00"), entityManager.find(Debt.class, secondDebtId).getBalance());
        assertEquals(debtId, persistedPayment.getDebt().getId());
        assertEquals(businessId, persistedPayment.getBusiness().getId());
        assertTrue(((Map<?, ?>) payment.get("createdByUser")).containsKey("id"));
    }

    @Test
    void repositorySearchPaginationSummaryAndBusinessRoleBoundariesAreEnforced() {
        String suffix = UUID.randomUUID().toString();
        String userId = createUser("Grace", "Hopper", suffix);
        String businessId = (String) businessService.createBusiness(
                new Requests.CreateBusiness("Compiler business " + suffix, null, null), userId).get("id");
        String debtorId = (String) debtorsService.createDebtor(businessId,
                new Requests.CreateDebtor("Pending " + suffix, null, "CC", suffix, null)).get("id");
        debtsService.createDebt(businessId, userId,
                new Requests.CreateDebt(debtorId, new BigDecimal("40.00"), "Pending balance", null));
        for (int i = 0; i < 14; i++) {
            debtorsService.createDebtor(businessId,
                    new Requests.CreateDebtor("Clear " + i + " " + suffix, null, null, null, null));
        }

        Requests.PageQuery filtered = new Requests.PageQuery(1, 1, "Pending " + suffix, null, null);
        Map<String, Object> result = debtorsService.debtors(businessId, filtered, true);
        assertEquals(1, ((java.util.List<?>) result.get("data")).size());
        assertEquals(1L, ((Map<?, ?>) result.get("meta")).get("total"));
        assertEquals(1L, ((Map<?, ?>) debtorsService.debtorSummary(businessId, 5)).get("debtorsWithDebt"));

        Requests.PageQuery paged = new Requests.PageQuery(2, 3, suffix, null, null);
        Map<String, Object> secondPage = debtorsService.debtors(businessId, paged, null);
        assertEquals(3, ((java.util.List<?>) secondPage.get("data")).size());
        assertEquals(15L, ((Map<?, ?>) secondPage.get("meta")).get("total"));
        assertEquals(5, ((Map<?, ?>) secondPage.get("meta")).get("totalPages"));

        String viewerId = createUser("Katherine", "Johnson", UUID.randomUUID().toString());
        assertThrows(ApiException.class, () -> businessService.requireBusinessMember(businessId, viewerId));
        Map<String, Object> invitation = invitationsService.createInvitation(businessId,
                new Requests.CreateInvitation(null, "viewer@example.test", null, "BUSINESS_USER", "VIEWER", null));
        String code = (String) ((Map<?, ?>) invitation.get("invitation")).get("code");
        invitationsService.acceptInvitation(code, viewerId);
        assertThrows(ApiException.class, () -> businessService.requireBusinessMember(businessId, viewerId, "ADMIN"));
        businessService.requireBusinessMember(businessId, viewerId, "VIEWER");
        assertThrows(ApiException.class, () -> invitationsService.acceptInvitation(code, viewerId));
    }

    @Test
    void loginAndRefreshTokenUseDomainRepositoriesAndHashedCredentials() {
        String suffix = UUID.randomUUID().toString();
        String email = "login-" + suffix + "@example.test";
        String userId = (String) usersService.createUser(new Requests.CreateUser(
                "Login", "User", "CC", suffix, email, null, "secure-password", null)).get("id");
        Map<String, Object> login = authService.login(new Requests.Login(email, "secure-password", "integration"));
        assertEquals(userId, ((Map<?, ?>) login.get("user")).get("id"));
        String refreshToken = (String) login.get("refreshToken");
        Map<String, Object> refreshed = authService.refresh(refreshToken, "integration");
        assertEquals(userId, ((Map<?, ?>) refreshed.get("user")).get("id"));
        assertThrows(ApiException.class,
                () -> authService.login(new Requests.Login(email, "wrong-password", "integration")));
        assertEquals("Logout realizado", authService.logout(refreshToken, false).get("message"));
        assertThrows(ApiException.class, () -> authService.refresh(refreshToken, "integration"));
    }

    private String createUser(String firstName, String lastName, String suffix) {
        return (String) usersService.createUser(new Requests.CreateUser(firstName, lastName, "CC", suffix,
                "user-" + suffix + "@example.test", null, "secure-password", null)).get("id");
    }
}
