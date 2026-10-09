package com.fiao.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.fiao.service.AuthService;
import com.fiao.service.BusinessService;
import com.fiao.service.BusinessUsersService;
import com.fiao.service.DebtorsService;
import com.fiao.service.DebtsService;
import com.fiao.service.InvitationsService;
import com.fiao.service.PaymentsService;
import com.fiao.service.UsersService;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "JWT_SECRET=unit-test-secret-that-is-at-least-32-bytes-long",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
})
@AutoConfigureMockMvc
class ApiControllerTest {
    @MockitoBean private AuthService authService;
    @MockitoBean private BusinessService businessService;
    @MockitoBean private BusinessUsersService businessUsersService;
    @MockitoBean private DebtorsService debtorsService;
    @MockitoBean private DebtsService debtsService;
    @MockitoBean private InvitationsService invitationsService;
    @MockitoBean private PaymentsService paymentsService;
    @MockitoBean private UsersService usersService;

    @Autowired
    private MockMvc mvc;

    @Test
    void healthRemainsPublicAndUsesTheApiPrefix() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void openApiDocumentIsAvailable() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("FIAO API"))
                .andExpect(jsonPath("$.paths['/api/health']").exists());
    }

    @Test
    void allOperationsAreGroupedByTheirController() throws Exception {
        String response = mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode paths = new ObjectMapper().readTree(response).path("paths");
        Map<String, Integer> expectedCounts = Map.of(
                "Health", 1, "Auth", 3, "Users", 6, "Business", 5,
                "Debtors", 7, "Debts", 4, "Payments", 5,
                "Business Users", 4, "Invitations", 4);
        Map<String, Integer> actualCounts = new java.util.HashMap<>();
        paths.forEach(path -> path.forEach(operation -> {
            assertEquals(1, operation.path("tags").size());
            actualCounts.merge(operation.path("tags").get(0).asText(), 1, Integer::sum);
        }));
        assertEquals(expectedCounts, actualCounts);
        assertEquals("Debts", paths.path("/api/debtors/{debtorId}/debts")
                .path("get").path("tags").get(0).asText());
        assertEquals("Payments", paths.path("/api/debts/{debtId}/payments")
                .path("get").path("tags").get(0).asText());
    }

    @Test
    void businessRoutesRequireAuthentication() throws Exception {
        mvc.perform(get("/api/business"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.statusCode").value(401));
    }

    @Test
    void registrationRejectsInvalidPayloads() throws Exception {
        mvc.perform(post("/api/users")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
    }
}
