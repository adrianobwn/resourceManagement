package com.resourceManagement.controller.project;

import com.resourceManagement.model.entity.ProjectRequest;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.service.project.ProjectRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-requests")
@RequiredArgsConstructor
public class ProjectRequestController {

    private final ProjectRequestService requestService;

    @PostMapping
    @PreAuthorize("hasRole('PM')")
    public ResponseEntity<ProjectRequest> createRequest(@RequestBody ProjectRequest request, @AuthenticationPrincipal User user) {
        ProjectRequest savedRequest = requestService.createProjectRequest(request, user);
        return ResponseEntity.ok(savedRequest);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProjectRequest>> getAllRequests() {
        List<ProjectRequest> requests = requestService.getAllRequests();
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{requestId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectRequest> approveRequest(@PathVariable Integer requestId) {
        ProjectRequest approvedRequest = requestService.approveProjectRequest(requestId);
        return ResponseEntity.ok(approvedRequest);
    }

    @PutMapping("/{requestId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectRequest> rejectRequest(@PathVariable Integer requestId) {
        ProjectRequest rejectedRequest = requestService.rejectProjectRequest(requestId);
        return ResponseEntity.ok(rejectedRequest);
    }
}
