package com.resourceManagement.service.assignment;

import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
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

    public List<ResourceAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }
}
