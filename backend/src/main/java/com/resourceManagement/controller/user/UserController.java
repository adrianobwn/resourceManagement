package com.resourceManagement.controller.user;

import com.resourceManagement.dto.user.CreatePmRequest;
import com.resourceManagement.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/pm")
    public ResponseEntity<?> createPm(@Valid @RequestBody CreatePmRequest request) {
        userService.createPm(request);
        return ResponseEntity.ok("PM account created successfully");
    }
}
