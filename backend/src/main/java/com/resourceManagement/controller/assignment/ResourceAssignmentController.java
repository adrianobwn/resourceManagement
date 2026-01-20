package com.resourceManagement.controller.assignment;

import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.service.assignment.ResourceAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class ResourceAssignmentController {

    private final ResourceAssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceAssignment> createAssignment(@RequestBody ResourceAssignment assignment) {
        ResourceAssignment savedAssignment = assignmentService.assignResourceToProject(assignment);
        return ResponseEntity.ok(savedAssignment);
    }

    @GetMapping
    public ResponseEntity<List<ResourceAssignment>> getAllAssignments() {
        List<ResourceAssignment> assignments = assignmentService.getAllAssignments();
        return ResponseEntity.ok(assignments);
    }
}
