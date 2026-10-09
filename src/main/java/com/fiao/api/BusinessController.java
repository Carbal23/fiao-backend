package com.fiao.api;

import com.fiao.api.Requests.CreateBusiness;
import com.fiao.api.Requests.PageQuery;
import com.fiao.api.Requests.UpdateBusiness;
import com.fiao.service.BusinessService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Business")
public class BusinessController extends ControllerSupport {
    private final BusinessService service;

    public BusinessController(BusinessService service) { this.service = service; }

    @PostMapping("/business")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createBusiness(@Valid @RequestBody CreateBusiness body, HttpServletRequest request) {
        return service.createBusiness(body, requireUser(request));
    }

    @GetMapping("/business")
    public Map<String, Object> businesses(@ModelAttribute PageQuery query, HttpServletRequest request) {
        return service.businesses(requireUser(request), query);
    }

    @GetMapping("/business/{id}")
    public Map<String, Object> business(@PathVariable String id, HttpServletRequest request) {
        return service.getBusiness(id, requireUser(request));
    }

    @PatchMapping("/business/{id}")
    public Map<String, Object> updateBusiness(@PathVariable String id, @Valid @RequestBody UpdateBusiness body,
                                              HttpServletRequest request) {
        return service.updateBusiness(id, body, requireUser(request));
    }

    @PatchMapping("/business/{id}/inactivate")
    public Map<String, Object> inactivateBusiness(@PathVariable String id, HttpServletRequest request) {
        return service.inactivateBusiness(id, requireUser(request));
    }
}
