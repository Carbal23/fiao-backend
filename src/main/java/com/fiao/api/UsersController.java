package com.fiao.api;

import com.fiao.api.Requests.CreateUser;
import com.fiao.api.Requests.UpdateUser;
import com.fiao.service.UsersService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Users")
public class UsersController extends ControllerSupport {
    private final UsersService service;

    public UsersController(UsersService service) { this.service = service; }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createUser(@Valid @RequestBody CreateUser body) {
        return service.createUser(body);
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users(HttpServletRequest request) {
        requireUser(request);
        return service.users();
    }

    @GetMapping("/users/me/dashboard")
    public Map<String, Object> dashboard(HttpServletRequest request) {
        return service.dashboard(requireUser(request));
    }

    @GetMapping("/users/{id}")
    public Map<String, Object> user(@PathVariable String id, HttpServletRequest request) {
        requireUser(request);
        return service.user(id);
    }

    @PatchMapping("/users/{id}")
    public Map<String, Object> updateUser(@PathVariable String id, @Valid @RequestBody UpdateUser body,
                                          HttpServletRequest request) {
        requireUser(request);
        return service.updateUser(id, body);
    }

    @PatchMapping("/users/{id}/inactivate")
    public Map<String, Object> inactivateUser(@PathVariable String id, HttpServletRequest request) {
        requireUser(request);
        return service.inactivateUser(id);
    }
}
