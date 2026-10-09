package com.fiao.api;

import com.fiao.api.Requests.CreateDebtor;
import com.fiao.api.Requests.PageQuery;
import com.fiao.api.Requests.UpdateDebtor;
import com.fiao.service.BusinessService;
import com.fiao.service.DebtorsService;
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
@Tag(name = "Debtors")
public class DebtorsController extends ControllerSupport {
    private final BusinessService businesses;
    private final DebtorsService service;

    public DebtorsController(BusinessService businesses, DebtorsService service) {
        this.businesses = businesses;
        this.service = service;
    }

    @PostMapping("/debtors")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createDebtor(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                            @Valid @RequestBody CreateDebtor body, HttpServletRequest request) {
        String userId = requireUser(request);
        String business = businessContext(businesses, businessId, userId, "ADMIN", "OWNER", "CASHIER");
        return service.createDebtor(business, body);
    }

    @GetMapping("/debtors")
    public Map<String, Object> debtors(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                       @ModelAttribute PageQuery query, @RequestParam(required = false) Boolean hasDebt,
                                       HttpServletRequest request) {
        String business = businessContext(businesses, businessId, requireUser(request));
        return service.debtors(business, query, hasDebt);
    }

    @GetMapping("/debtors/me/all")
    public Map<String, Object> debtorsForUser(@ModelAttribute PageQuery query, @RequestParam(required = false) Boolean hasDebt,
                                              HttpServletRequest request) {
        return service.debtorsForUser(requireUser(request), query, hasDebt);
    }

    @GetMapping("/debtors/summary")
    public Map<String, Object> debtorSummary(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                             @RequestParam(defaultValue = "5") int top, HttpServletRequest request) {
        return service.debtorSummary(businessContext(businesses, businessId, requireUser(request)), top);
    }

    @GetMapping("/debtors/{id}")
    public Map<String, Object> debtor(@PathVariable String id,
                                      @RequestHeader(value = "x-business-id", required = false) String businessId,
                                      HttpServletRequest request) {
        return service.debtor(id, businessContext(businesses, businessId, requireUser(request)));
    }

    @PatchMapping("/debtors/{id}")
    public Map<String, Object> updateDebtor(@PathVariable String id,
                                            @RequestHeader(value = "x-business-id", required = false) String businessId,
                                            @Valid @RequestBody UpdateDebtor body, HttpServletRequest request) {
        String business = businessContext(businesses, businessId, requireUser(request), "ADMIN", "OWNER");
        return service.updateDebtor(id, business, body);
    }

    @PatchMapping("/debtors/{id}/inactivate")
    public Map<String, Object> inactivateDebtor(@PathVariable String id,
                                                @RequestHeader(value = "x-business-id", required = false) String businessId,
                                                HttpServletRequest request) {
        String business = businessContext(businesses, businessId, requireUser(request), "ADMIN", "OWNER");
        return service.inactivateDebtor(id, business);
    }
}
