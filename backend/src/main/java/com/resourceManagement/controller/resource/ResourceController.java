package com.resourceManagement.controller.resource;

import com.resourceManagement.dto.resource.AssignResourceRequest;
import com.resourceManagement.dto.resource.CreateResourceRequest;
import com.resourceManagement.dto.resource.ResourceResponse;
import com.resourceManagement.service.resource.ResourceService;
import com.resourceManagement.service.request.AssignmentRequestService;
import com.resourceManagement.repository.UserRepository;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.UserType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;
    private final AssignmentRequestService requestService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getAllResources() {
        List<ResourceResponse> resources = resourceService.getAllResources();
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{resourceId}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable Integer resourceId) {
        ResourceResponse resource = resourceService.getResourceById(resourceId);
        return ResponseEntity.ok(resource);
    }

    @PostMapping
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody CreateResourceRequest request) {
        ResourceResponse resource = resourceService.createResource(request);
        return ResponseEntity.ok(resource);
    }

    @PostMapping("/assign")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> assignResource(@Valid @RequestBody AssignResourceRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getUserType() == UserType.PM) {
            requestService.createAssignRequest(email, request);
            return ResponseEntity.ok("Assignment request submitted successfully");
        } else {
            resourceService.assignResourceToProject(request);
            return ResponseEntity.ok("Resource assigned successfully");
        }
    }

    @GetMapping("/{resourceId}/assignments")
    public ResponseEntity<List<ResourceResponse.AssignmentInfo>> getResourceAssignments(
            @PathVariable Integer resourceId) {
        List<ResourceResponse.AssignmentInfo> assignments = resourceService.getResourceAssignments(resourceId);
        return ResponseEntity.ok(assignments);
    }
}
