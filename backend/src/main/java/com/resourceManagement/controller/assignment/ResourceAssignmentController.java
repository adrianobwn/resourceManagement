package com.resourceManagement.controller.assignment;

import com.resourceManagement.dto.assignment.ExtendAssignmentRequest;
import com.resourceManagement.dto.assignment.ReleaseAssignmentRequest;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.service.assignment.ResourceAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.resourceManagement.service.request.AssignmentRequestService;
import com.resourceManagement.repository.UserRepository;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.UserType;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class ResourceAssignmentController {

    private final ResourceAssignmentService assignmentService;
    private final AssignmentRequestService requestService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ResourceAssignment> createAssignment(@RequestBody ResourceAssignment assignment) {
        ResourceAssignment savedAssignment = assignmentService.assignResourceToProject(assignment);
        return ResponseEntity.ok(savedAssignment);
    }

    @GetMapping
    public ResponseEntity<List<ResourceAssignment>> getAllAssignments() {
        List<ResourceAssignment> assignments = assignmentService.getAllAssignments();
        return ResponseEntity.ok(assignments);
    }

    @PostMapping("/extend")
    public ResponseEntity<String> extendAssignment(@RequestBody ExtendAssignmentRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getUserType() == UserType.DEV_MANAGER) {
            requestService.createExtendRequest(email, request);
            return ResponseEntity.ok("Extend request submitted successfully");
        } else {
            // Admin direct action
            ResourceAssignment currentAssignment = assignmentService.getAssignmentById(request.getAssignmentId());
            LocalDate oldEndDate = currentAssignment.getEndDate();

            ResourceAssignment updatedAssignment = assignmentService.extendAssignment(request);

            // Log the direct admin action
            com.resourceManagement.model.entity.AssignmentRequest details = com.resourceManagement.model.entity.AssignmentRequest
                    .builder()
                    .assignmentId(updatedAssignment.getAssignmentId())
                    .project(updatedAssignment.getProject())
                    .resource(updatedAssignment.getResource())
                    .role(updatedAssignment.getProjectRole())
                    .currentEndDate(oldEndDate)
                    .newEndDate(request.getNewEndDate())
                    .reason(request.getReason())
                    .build();
            requestService.recordDirectAction(user, com.resourceManagement.model.enums.RequestType.EXTEND, details);

            return ResponseEntity.ok("Assignment extended successfully");
        }
    }

    @PostMapping("/release")
    public ResponseEntity<String> releaseAssignment(@RequestBody ReleaseAssignmentRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getUserType() == UserType.DEV_MANAGER) {
            requestService.createReleaseRequest(email, request);
            return ResponseEntity.ok("Release request submitted successfully");
        } else {
            // Admin direct action
            ResourceAssignment currentAssignment = assignmentService.getAssignmentById(request.getAssignmentId());
            LocalDate oldEndDate = currentAssignment.getEndDate();

            ResourceAssignment updatedAssignment = assignmentService.releaseAssignment(request);

            // Log the direct admin action
            com.resourceManagement.model.entity.AssignmentRequest details = com.resourceManagement.model.entity.AssignmentRequest
                    .builder()
                    .assignmentId(updatedAssignment.getAssignmentId())
                    .project(updatedAssignment.getProject())
                    .resource(updatedAssignment.getResource())
                    .role(updatedAssignment.getProjectRole())
                    .currentEndDate(oldEndDate)
                    .newEndDate(request.getReleaseDate())
                    .reason(request.getReason())
                    .build();
            requestService.recordDirectAction(user, com.resourceManagement.model.enums.RequestType.RELEASE, details);

            return ResponseEntity.ok("Assignment released successfully");
        }
    }
}
