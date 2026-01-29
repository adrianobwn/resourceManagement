package com.resourceManagement.controller.resource;

import com.resourceManagement.dto.resource.AssignResourceRequest;
import com.resourceManagement.dto.resource.CreateResourceRequest;
import com.resourceManagement.dto.resource.ResourceResponse;
import com.resourceManagement.service.resource.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

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
    public ResponseEntity<ResourceResponse> assignResource(@Valid @RequestBody AssignResourceRequest request) {
        ResourceResponse resource = resourceService.assignResourceToProject(request);
        return ResponseEntity.ok(resource);
    }

    @GetMapping("/{resourceId}/assignments")
    public ResponseEntity<List<ResourceResponse.AssignmentInfo>> getResourceAssignments(
            @PathVariable Integer resourceId) {
        List<ResourceResponse.AssignmentInfo> assignments = resourceService.getResourceAssignments(resourceId);
        return ResponseEntity.ok(assignments);
    }

    @PutMapping("/{resourceId}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable Integer resourceId,
            @Valid @RequestBody com.resourceManagement.dto.resource.UpdateResourceRequest request) {
        ResourceResponse updated = resourceService.updateResource(resourceId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{resourceId}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Integer resourceId) {
        resourceService.deleteResource(resourceId);
        return ResponseEntity.ok().build();
    }
}
