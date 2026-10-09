package com.fiao.api;

import com.fiao.service.BusinessService;
import jakarta.servlet.http.HttpServletRequest;

abstract class ControllerSupport {
    protected String businessContext(BusinessService businesses, String businessId, String userId, String... roles) {
        businesses.requireBusinessMember(businessId, userId, roles);
        return businessId;
    }

    protected String requireUser(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (!(userId instanceof String value) || value.isBlank()) throw ApiException.unauthorized("Usuario no autenticado");
        return value;
    }
}
