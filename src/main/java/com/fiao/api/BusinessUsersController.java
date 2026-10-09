package com.fiao.api;

import com.fiao.api.Requests.CreateBusinessUser;
import com.fiao.api.Requests.PageQuery;
import com.fiao.api.Requests.UpdateBusinessUser;
import com.fiao.service.BusinessService;
import com.fiao.service.BusinessUsersService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Business Users")
public class BusinessUsersController extends ControllerSupport {
    private final BusinessService businesses;
    private final BusinessUsersService service;

    public BusinessUsersController(BusinessService businesses, BusinessUsersService service) {
        this.businesses = businesses;
        this.service = service;
    }

    @PostMapping("/business-users")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addBusinessUser(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                                @Valid @RequestBody CreateBusinessUser body, HttpServletRequest request) {
        String userId = requireUser(request);
        String business = businessContext(businesses, businessId, userId, "ADMIN", "OWNER");
        return service.addBusinessUser(business, body.userId(), body.role());
    }

    @GetMapping("/business-users")
    public Map<String, Object> businessUsers(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                             @ModelAttribute PageQuery query, HttpServletRequest request) {
        String business = businessContext(businesses, businessId, requireUser(request), "ADMIN", "OWNER", "CASHIER", "VIEWER");
        return service.businessUsers(business, query);
    }

    @PatchMapping("/business-users/{id}")
    public Map<String, Object> updateBusinessUser(@PathVariable String id,
                                                   @RequestHeader(value = "x-business-id", required = false) String businessId,
                                                   @Valid @RequestBody UpdateBusinessUser body,
                                                   HttpServletRequest request) {
        String userId = requireUser(request);
        String business = businessContext(businesses, businessId, userId, "ADMIN", "OWNER");
        return service.updateBusinessUser(business, id, userId, body.role());
    }

    @DeleteMapping("/business-users/{id}")
    public Map<String, Object> removeBusinessUser(@PathVariable String id,
                                                   @RequestHeader(value = "x-business-id", required = false) String businessId,
                                                   HttpServletRequest request) {
        String userId = requireUser(request);
        String business = businessContext(businesses, businessId, userId, "OWNER");
        return service.removeBusinessUser(business, id, userId);
    }
}
