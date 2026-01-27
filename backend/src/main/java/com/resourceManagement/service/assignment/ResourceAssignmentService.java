package com.resourceManagement.service.assignment;

import com.resourceManagement.dto.assignment.ExtendAssignmentRequest;
import com.resourceManagement.dto.assignment.ReleaseAssignmentRequest;
import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import com.resourceManagement.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.resourceManagement.repository.AssignmentRequestRepository;
import com.resourceManagement.service.project.HistoryLogService;
import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.model.enums.EntityType;
import com.resourceManagement.repository.UserRepository;
import com.resourceManagement.model.entity.AssignmentRequest;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.RequestType;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceAssignmentService {

    private final ResourceAssignmentRepository assignmentRepository;
    private final ResourceRepository resourceRepository;
    private final AssignmentRequestRepository requestRepository;
    private final HistoryLogService historyLogService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository; // Added injection

    private void recordDirectAction(User performedBy, RequestType type, AssignmentRequest details) {
        details.setRequestType(type);
        details.setStatus(RequestStatus.APPROVED);
        details.setRequester(performedBy);
        requestRepository.save(details);

        // Log to History
        String desc = String.format("Admin directly performed %s: %s", type, details.getReason() != null ? details.getReason() : "");
        historyLogService.logActivity(EntityType.ASSIGNMENT, type.name(), desc, performedBy, details.getProject(), details.getResource(), details.getRole());
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public ResourceAssignment assignResourceToProject(ResourceAssignment assignment) { // Added method signature
        // Validate project status
        if (assignment.getProject().getStatus() == com.resourceManagement.model.enums.ProjectStatus.CLOSED) {
            throw new RuntimeException("Cannot assign resources to a CLOSED project");
        }

        // Save the assignment
        ResourceAssignment savedAssignment = assignmentRepository.save(assignment);

        // Update the resource status to ASSIGNED
        Resource resource = assignment.getResource();
        resource.setStatus(ResourceStatus.ASSIGNED);
        resourceRepository.save(resource);

        // Record Activity
        AssignmentRequest details = AssignmentRequest.builder()
                .project(assignment.getProject())
                .resource(assignment.getResource())
                .role(assignment.getProjectRole())
                .startDate(assignment.getStartDate())
                .endDate(assignment.getEndDate())
                .reason("Directly assigned by Admin")
                .build();
        recordDirectAction(getCurrentUser(), RequestType.ASSIGN, details);

        return savedAssignment;
    }

    @Transactional
    public ResourceAssignment extendAssignment(ExtendAssignmentRequest request) {
        ResourceAssignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + request.getAssignmentId()));

        assignment.setEndDate(request.getNewEndDate());
        ResourceAssignment saved = assignmentRepository.save(assignment);

        // Activity logging is handled by the caller (either approval flow or direct action)
        return saved;
    }

    @Transactional
    public ResourceAssignment releaseAssignment(ReleaseAssignmentRequest request) {
        ResourceAssignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + request.getAssignmentId()));

        assignment.setEndDate(request.getReleaseDate());
        assignment.setStatus(AssignmentStatus.RELEASED);
        
        // Save assignment first
        ResourceAssignment savedAssignment = assignmentRepository.save(assignment);

        // Set resource status to AVAILABLE
        Resource resource = assignment.getResource();
        resource.setStatus(ResourceStatus.AVAILABLE);
        resourceRepository.save(resource);

        // Check if all resources in this project are now released
        long activeCount = assignmentRepository.countByProject_ProjectIdAndStatus(
            assignment.getProject().getProjectId(), 
            AssignmentStatus.ACTIVE
        );
        if (activeCount == 0) {
            com.resourceManagement.model.entity.Project project = assignment.getProject();
            project.setStatus(com.resourceManagement.model.enums.ProjectStatus.CLOSED);
            projectRepository.save(project); // Saved the project
            
            // Log project closure
            historyLogService.logActivity(
                EntityType.PROJECT, 
                "AUTO_CLOSE", 
                "Project closed automatically as all resources were released", 
                getCurrentUser(), 
                project, 
                null, 
                null
            );
        }

        // Activity logging is handled by the caller (either approval flow or direct action)
        return savedAssignment;
    }

    public List<ResourceAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }
}
