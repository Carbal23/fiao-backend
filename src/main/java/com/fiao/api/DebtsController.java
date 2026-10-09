package com.fiao.api;

import com.fiao.api.Requests.CreateDebt;
import com.fiao.api.Requests.PageQuery;
import com.fiao.api.Requests.UpdateDebtStatus;
import com.fiao.service.BusinessService;
import com.fiao.service.DebtsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
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
@Tag(name = "Debts")
public class DebtsController extends ControllerSupport {
    private final BusinessService businesses;
    private final DebtsService service;

    public DebtsController(BusinessService businesses, DebtsService service) {
        this.businesses = businesses;
        this.service = service;
    }

    @PostMapping("/debts")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createDebt(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                          @Valid @RequestBody CreateDebt body, HttpServletRequest request) {
        String userId = requireUser(request);
        String business = businessContext(businesses, businessId, userId, "ADMIN", "OWNER", "CASHIER");
        return service.createDebt(business, userId, body);
    }

    @GetMapping("/debts")
    public Map<String, Object> debts(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                     @ModelAttribute PageQuery query, @RequestParam(required = false) String status,
                                     @RequestParam(required = false) Boolean overdue, HttpServletRequest request) {
        return service.debts(businessContext(businesses, businessId, requireUser(request)), query, status, overdue);
    }

    @GetMapping("/debtors/{debtorId}/debts")
    public Map<String, Object> debtsByDebtor(@PathVariable String debtorId,
                                              @RequestHeader(value = "x-business-id", required = false) String businessId,
                                              @ModelAttribute PageQuery query, @RequestParam(required = false) String status,
                                              @RequestParam(required = false) Boolean overdue, HttpServletRequest request) {
        String business = businessContext(businesses, businessId, requireUser(request));
        return service.debtsByDebtor(debtorId, business, query, status, overdue);
    }

    @PatchMapping("/debts/{id}/status")
    public Map<String, Object> updateDebtStatus(@PathVariable String id,
                                                 @RequestHeader(value = "x-business-id", required = false) String businessId,
                                                 @Valid @RequestBody UpdateDebtStatus body, HttpServletRequest request) {
        String business = businessContext(businesses, businessId, requireUser(request), "ADMIN", "OWNER", "CASHIER");
        return service.updateDebtStatus(id, business, body);
    }
}
