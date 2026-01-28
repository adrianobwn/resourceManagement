package com.resourceManagement.controller.user;

import com.resourceManagement.dto.user.CreatePmRequest;
import com.resourceManagement.dto.user.PmListResponse;
import com.resourceManagement.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/pm")
    public ResponseEntity<?> createPm(@Valid @RequestBody CreatePmRequest request) {
        userService.createPm(request);
        return ResponseEntity.ok("DevMan account created successfully");
    }

    @GetMapping("/pms")
    public ResponseEntity<List<PmListResponse>> getAllPms() {
        return ResponseEntity.ok(userService.getAllPms());
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok().build();
    }
}
