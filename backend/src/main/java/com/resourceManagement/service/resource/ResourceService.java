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
import com.resourceManagement.repository.UserRepository;
import com.resourceManagement.service.project.HistoryLogService;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.EntityType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.model.enums.RequestType;
import com.resourceManagement.repository.AssignmentRequestRepository;
import com.resourceManagement.model.entity.AssignmentRequest;

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
        private final UserRepository userRepository;
        private final HistoryLogService historyLogService;
        private final AssignmentRequestRepository requestRepository;
        private final com.resourceManagement.repository.ProjectRequestResourceRepository projectRequestResourceRepository;
        private final com.resourceManagement.repository.HistoryLogRepository historyLogRepository;

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

                // Check for existing active assignment to this project with the SAME ROLE
                long activeAssignments = assignmentRepository
                                .countByResource_ResourceIdAndProject_ProjectIdAndProjectRoleAndStatus(
                                                resource.getResourceId(),
                                                project.getProjectId(),
                                                request.getProjectRole(),
                                                AssignmentStatus.ACTIVE);

                if (activeAssignments > 0) {
                        throw new RuntimeException(
                                        "Resource is already assigned to this project with this role. Use 'Extend' to modify the existing assignment or choose a different role.");
                }

                // Check for existing pending request to this project with the SAME ROLE
                long pendingRequests = requestRepository.countByResource_ResourceIdAndProject_ProjectIdAndRoleAndStatus(
                                resource.getResourceId(),
                                project.getProjectId(),
                                request.getProjectRole(),
                                RequestStatus.PENDING);

                if (pendingRequests > 0) {
                        throw new RuntimeException(
                                        "A pending assignment request already exists for this resource and role in this project.");
                }

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


                // Record Activity (Assignment Request) to make it visible in Activities page
                // Find current admin user
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User admin = userRepository.findByEmail(email).orElseThrow();

                AssignmentRequest savedRequest = AssignmentRequest.builder()
                                .requestType(RequestType.ASSIGN)
                                .status(RequestStatus.APPROVED)
                                .requester(admin)
                                .project(project)
                                .resource(resource)
                                .role(request.getProjectRole())
                                .startDate(startDate)
                                .endDate(endDate)
                                .reason("Resource assigned directly by Admin")
                                .build();

                requestRepository.save(savedRequest);

                // Log to history logs
                historyLogService.logActivity(
                                EntityType.ASSIGNMENT,
                                "ASSIGN",
                                String.format("Admin directly assigned %s to project %s as %s",
                                                resource.getResourceName(), project.getProjectName(),
                                                request.getProjectRole()),
                                admin,
                                project,
                                resource,
                                request.getProjectRole());

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

        @Transactional
        public void deleteResource(Integer resourceId) {
                Resource resource = resourceRepository.findById(resourceId)
                                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + resourceId));

                // Check if resource has any active assignments
                List<ResourceAssignment> activeAssignments = assignmentRepository
                                .findByResource_ResourceId(resourceId)
                                .stream()
                                .filter(a -> a.getStatus() == AssignmentStatus.ACTIVE)
                                .collect(Collectors.toList());

                if (!activeAssignments.isEmpty()) {
                        throw new RuntimeException(
                                        "Cannot delete resource with active assignments. Please release all assignments first.");
                }

                // Delete all assignments
                assignmentRepository.deleteByResource_ResourceId(resourceId);

                // Delete from project request resources (proposals)
                projectRequestResourceRepository.deleteByResource_ResourceId(resourceId);

                // Delete from assignment requests
                requestRepository.deleteByResource_ResourceId(resourceId);

                // Delete history logs
                historyLogRepository.deleteByResource_ResourceId(resourceId);

                // Log deletion (this log will be deleted eventually if we delete everything,
                // but for now it's okay)
                String currentPrincipalName = SecurityContextHolder.getContext().getAuthentication().getName();
                User performedBy = userRepository.findByEmail(currentPrincipalName)
                                .orElseThrow(() -> new RuntimeException("Current user not found"));

                historyLogService.logActivity(
                                EntityType.RESOURCE,
                                "DELETE",
                                "Deleted Resource: " + resource.getResourceName(),
                                performedBy);

                // Delete the resource
                resourceRepository.delete(resource);
        }

        @Transactional
        public ResourceResponse updateResource(Integer resourceId,
                        com.resourceManagement.dto.resource.UpdateResourceRequest request) {
                Resource resource = resourceRepository.findById(resourceId)
                                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + resourceId));

                String oldName = resource.getResourceName();
                String oldEmail = resource.getEmail();

                resource.setResourceName(request.getResourceName());
                resource.setEmail(request.getEmail());

                Resource updated = resourceRepository.save(resource);

                // Log activity
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User actor = userRepository.findByEmail(email).orElseThrow();

                String changeLog = String.format("Updated Resource: %s -> %s, %s -> %s",
                                oldName, request.getResourceName(),
                                oldEmail, request.getEmail());

                historyLogService.logActivity(
                                EntityType.RESOURCE,
                                "UPDATE",
                                changeLog,
                                actor);

                return mapToResourceResponse(updated);
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
                                .totalAssignments(assignments.size())
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
