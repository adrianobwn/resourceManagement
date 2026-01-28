package com.resourceManagement.controller.resource;

import com.resourceManagement.model.entity.ResourceRequest;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.service.resource.ResourceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resource-requests")
@RequiredArgsConstructor
public class ResourceRequestController {

    private final ResourceRequestService requestService;

    @PostMapping
    @PreAuthorize("hasRole('PM')")
    public ResponseEntity<ResourceRequest> createRequest(@RequestBody ResourceRequest request, @AuthenticationPrincipal User user) {
        ResourceRequest savedRequest = requestService.createResourceRequest(request, user);
        return ResponseEntity.ok(savedRequest);
    }

    @GetMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<List<ResourceRequest>> getAllRequests() {
        List<ResourceRequest> requests = requestService.getAllRequests();
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{requestId}/approve")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ResourceRequest> approveRequest(@PathVariable Integer requestId) {
        ResourceRequest approvedRequest = requestService.approveResourceRequest(requestId);
        return ResponseEntity.ok(approvedRequest);
    }

    @PutMapping("/{requestId}/reject")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ResourceRequest> rejectRequest(@PathVariable Integer requestId) {
        ResourceRequest rejectedRequest = requestService.rejectResourceRequest(requestId);
        return ResponseEntity.ok(rejectedRequest);
    }
}
