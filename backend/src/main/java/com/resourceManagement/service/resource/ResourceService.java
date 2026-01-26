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
        private final com.resourceManagement.service.assignment.ResourceAssignmentService resourceAssignmentService;

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
                System.out.println("Attempting to create resource: " + request.getResourceName() + " ("
                                + request.getEmail() + ")");

                // Check if email already exists
                if (resourceRepository.existsByEmail(request.getEmail())) {
                        System.err.println("Resource creation failed: Email already exists: " + request.getEmail());
                        throw new RuntimeException("Email already exists");
                }

                // Generate sequential Employee ID (e.g., EMP001, EMP002) based on current count
                long count = resourceRepository.count();
                String employeeId = String.format("EMP%03d", count + 1);

                Resource resource = Resource.builder()
                                .resourceName(request.getResourceName())
                                .employeeId(employeeId) // Fallback for stability
                                .email(request.getEmail())
                                .status(request.getStatus() != null ? request.getStatus() : ResourceStatus.AVAILABLE)
                                .build();

                try {
                        Resource savedResource = resourceRepository.saveAndFlush(resource);
                        long totalCount = resourceRepository.count();
                        System.out.println("Resource successfully saved. Total resources in DB: " + totalCount);
                        return mapToResourceResponse(savedResource);
                } catch (Exception e) {
                        System.err.println("Error saving resource to DB: " + e.getMessage());
                        e.printStackTrace();
                        throw new RuntimeException("DB Persistence Error: " + e.getMessage());
                }
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

                // Delegate to ResourceAssignmentService to handle validation, saving, and
                // logging
                resourceAssignmentService.assignResourceToProject(assignment);

                return mapToResourceResponse(resource);
        }

        public List<ResourceResponse.AssignmentInfo> getResourceAssignments(Integer resourceId) {
                List<ResourceAssignment> assignments = assignmentRepository.findByResource_ResourceId(resourceId);
                return assignments.stream()
                                .map(this::mapToAssignmentInfo)
                                .collect(Collectors.toList());
        }

        private ResourceResponse mapToResourceResponse(Resource resource) {
                List<ResourceAssignment> assignments = assignmentRepository
                                .findByResource_ResourceId(resource.getResourceId());

                // Count active assignments
                long projectCount = assignments.stream()
                                .filter(a -> a.getStatus() == AssignmentStatus.ACTIVE)
                                .count();

                // Include all assignments for track record purposes
                List<ResourceResponse.AssignmentInfo> assignmentInfos = assignments.stream()
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
