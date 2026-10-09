package com.fiao.api;

import com.fiao.api.Requests.AcceptInvitation;
import com.fiao.api.Requests.CreateInvitation;
import com.fiao.api.Requests.PageQuery;
import com.fiao.service.BusinessService;
import com.fiao.service.InvitationsService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Invitations")
public class InvitationsController extends ControllerSupport {
    private final BusinessService businesses;
    private final InvitationsService service;

    public InvitationsController(BusinessService businesses, InvitationsService service) {
        this.businesses = businesses;
        this.service = service;
    }

    @PostMapping("/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createInvitation(@RequestHeader(value = "x-business-id", required = false) String businessId,
                                                 @Valid @RequestBody CreateInvitation body, HttpServletRequest request) {
        String business = businessContext(businesses, businessId, requireUser(request), "ADMIN", "OWNER");
        return service.createInvitation(business, body);
    }

    @GetMapping("/invitations/{code}")
    public Map<String, Object> invitation(@PathVariable String code, HttpServletRequest request) {
        requireUser(request);
        return service.invitation(code);
    }

    @PostMapping("/invitations/accept")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> acceptInvitation(@Valid @RequestBody AcceptInvitation body,
                                                 HttpServletRequest request) {
        return service.acceptInvitation(body.code(), requireUser(request));
    }

    @GetMapping("/invitations/business/{businessId}")
    public Map<String, Object> invitations(@PathVariable String businessId,
                                            @RequestHeader(value = "x-business-id", required = false) String headerBusinessId,
                                            @ModelAttribute PageQuery query, HttpServletRequest request) {
        String userId = requireUser(request);
        String activeBusinessId = businessContext(businesses, headerBusinessId == null ? businessId : headerBusinessId, userId, "ADMIN", "OWNER");
        if (!businessId.equals(activeBusinessId)) throw ApiException.forbidden("El negocio activo no coincide con el solicitado");
        return service.invitations(businessId, query);
    }
}
