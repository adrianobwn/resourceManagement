package com.resourceManagement.service.assignment;

import com.resourceManagement.dto.assignment.ExtendAssignmentRequest;
import com.resourceManagement.dto.assignment.ReleaseAssignmentRequest;
import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceAssignmentService {

    private final ResourceAssignmentRepository assignmentRepository;
    private final ResourceRepository resourceRepository;

    @Transactional
    public ResourceAssignment assignResourceToProject(ResourceAssignment assignment) {
        // Save the assignment
        ResourceAssignment savedAssignment = assignmentRepository.save(assignment);

        // Update the resource status to ASSIGNED
        Resource resource = assignment.getResource();
        resource.setStatus(ResourceStatus.ASSIGNED);
        resourceRepository.save(resource);

        return savedAssignment;
    }

    @Transactional
    public ResourceAssignment extendAssignment(ExtendAssignmentRequest request) {
        ResourceAssignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + request.getAssignmentId()));

        assignment.setEndDate(request.getNewEndDate());
        // TODO: Log reason to history if needed in future
        System.out.println("Extending assignment " + assignment.getAssignmentId() + " Reason: " + request.getReason());

        return assignmentRepository.save(assignment);
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

        System.out.println("Releasing assignment " + assignment.getAssignmentId() + " Reason: " + request.getReason());

        return savedAssignment;
    }

    public List<ResourceAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }
}
