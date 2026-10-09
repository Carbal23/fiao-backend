package com.fiao.api;

import com.fiao.api.Requests.CreateGlobalPayment;
import com.fiao.api.Requests.CreatePayment;
import com.fiao.api.Requests.PageQuery;
import com.fiao.service.BusinessService;
import com.fiao.service.PaymentsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Payments")
public class PaymentsController extends ControllerSupport {
    private final BusinessService businesses;
    private final PaymentsService service;

    public PaymentsController(BusinessService businesses, PaymentsService service) {
        this.businesses = businesses;
        this.service = service;
    }

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createPayment(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                             @Valid @RequestBody CreatePayment body, HttpServletRequest request) {
        String userId = requireUser(request);
        String business = businessContext(businesses, businessId, userId, "ADMIN", "OWNER", "CASHIER");
        return service.createPayment(business, userId, body);
    }

    @PostMapping("/payments/global")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> globalPayment(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                              @Valid @RequestBody CreateGlobalPayment body, HttpServletRequest request) {
        String userId = requireUser(request);
        String business = businessContext(businesses, businessId, userId, "ADMIN", "OWNER", "CASHIER");
        return service.globalPayment(business, userId, body);
    }

    @PostMapping("/payments/global/reverse/{groupId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> reversePayment(@PathVariable String groupId,
                                               @RequestHeader(value = "x-business-id", required = false) String businessId,
                                               HttpServletRequest request) {
        String userId = requireUser(request);
        String business = businessContext(businesses, businessId, userId, "ADMIN", "OWNER");
        return service.reversePaymentGroup(business, userId, groupId);
    }

    @GetMapping("/payments")
    public Map<String, Object> payments(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                        @ModelAttribute PageQuery query, @RequestParam(required = false) String type,
                                        @RequestParam(required = false) String method, HttpServletRequest request) {
        return service.payments(businessContext(businesses, businessId, requireUser(request)), query, type, method);
    }

    @GetMapping("/debts/{debtId}/payments")
    public Map<String, Object> paymentsByDebt(@PathVariable String debtId,
                                               @RequestHeader(value = "x-business-id", required = false) String businessId,
                                               @ModelAttribute PageQuery query, @RequestParam(required = false) String type,
                                               @RequestParam(required = false) String method, HttpServletRequest request) {
        String business = businessContext(businesses, businessId, requireUser(request));
        return service.paymentsByDebt(debtId, business, query, type, method);
    }
}
