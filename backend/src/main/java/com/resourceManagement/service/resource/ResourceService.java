package com.resourceManagement.service.resource;

import com.resourceManagement.dto.resource.AssignResourceRequest;
import com.resourceManagement.dto.resource.CreateResourceRequest;
import com.resourceManagement.dto.resource.ResourceResponse;
import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.repository.ProjectRepository;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceAssignmentRepository assignmentRepository;
    private final ProjectRepository projectRepository;

    public List<ResourceResponse> getAllResources() {
        List<Resource> resources = resourceRepository.findAll();
        return resources.stream()
                .map(this::mapToResourceResponse)
                .collect(Collectors.toList());
    }

    public ResourceResponse getResourceById(Integer resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + resourceId));
        return mapToResourceResponse(resource);
    }

    @Transactional
    public ResourceResponse createResource(CreateResourceRequest request) {
        // Check if employee ID already exists
        if (resourceRepository.existsByEmployeeId(request.getEmployeeId())) {
            throw new RuntimeException("Employee ID already exists");
        }

        // Check if email already exists
        if (resourceRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Resource resource = Resource.builder()
                .resourceName(request.getResourceName())
                .employeeId(request.getEmployeeId())
                .email(request.getEmail())
                .status(request.getStatus() != null ? request.getStatus() : ResourceStatus.AVAILABLE)
                .build();

        Resource savedResource = resourceRepository.save(resource);
        return mapToResourceResponse(savedResource);
    }

    @Transactional
    public ResourceResponse assignResourceToProject(AssignResourceRequest request) {
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate startDate = LocalDate.parse(request.getStartDate(), formatter);
        LocalDate endDate = LocalDate.parse(request.getEndDate(), formatter);

        ResourceAssignment assignment = ResourceAssignment.builder()
                .resource(resource)
                .project(project)
                .projectRole(request.getProjectRole())
                .startDate(startDate)
                .endDate(endDate)
                .status(AssignmentStatus.ACTIVE)
                .build();

        assignmentRepository.save(assignment);

        // Update resource status to ASSIGNED
        resource.setStatus(ResourceStatus.ASSIGNED);
        resourceRepository.save(resource);

        return mapToResourceResponse(resource);
    }

    public List<ResourceResponse.AssignmentInfo> getResourceAssignments(Integer resourceId) {
        List<ResourceAssignment> assignments = assignmentRepository.findByResource_ResourceId(resourceId);
        return assignments.stream()
                .map(this::mapToAssignmentInfo)
                .collect(Collectors.toList());
    }

    private ResourceResponse mapToResourceResponse(Resource resource) {
        List<ResourceAssignment> assignments = assignmentRepository.findByResource_ResourceId(resource.getResourceId());
        
        // Count active assignments
        long projectCount = assignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.ACTIVE)
                .count();

        List<ResourceResponse.AssignmentInfo> assignmentInfos = assignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.ACTIVE)
                .map(this::mapToAssignmentInfo)
                .collect(Collectors.toList());

        return ResourceResponse.builder()
                .resourceId(resource.getResourceId())
                .resourceName(resource.getResourceName())
                .employeeId(resource.getEmployeeId())
                .email(resource.getEmail())
                .status(resource.getStatus())
                .projectCount((int) projectCount)
                .currentAssignments(assignmentInfos)
                .build();
    }

    private ResourceResponse.AssignmentInfo mapToAssignmentInfo(ResourceAssignment assignment) {
        return ResourceResponse.AssignmentInfo.builder()
                .assignmentId(assignment.getAssignmentId())
                .projectId(assignment.getProject().getProjectId())
                .projectName(assignment.getProject().getProjectName())
                .projectRole(assignment.getProjectRole())
                .startDate(assignment.getStartDate().toString())
                .endDate(assignment.getEndDate().toString())
                .assignmentStatus(assignment.getStatus().name())
                .projectStatus(assignment.getProject().getStatus().name())
                .build();
    }
}
