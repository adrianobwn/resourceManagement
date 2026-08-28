package com.resourceManagement.service.resource;

import com.resourceManagement.dto.resource.AssignResourceRequest;
import com.resourceManagement.dto.resource.CreateResourceRequest;
import com.resourceManagement.dto.resource.ResourceResponse;
import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ProjectStatus;
import com.resourceManagement.model.enums.ResourceLevel;
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
        private final com.resourceManagement.service.request.AssignmentRequestService requestService;
        private final com.resourceManagement.repository.ProjectRequestResourceRepository projectRequestResourceRepository;
        private final com.resourceManagement.repository.HistoryLogRepository historyLogRepository;

        public List<ResourceResponse> getAllResources() {
                // People are looked up by name, so alphabetical beats newest-first here.
                List<Resource> resources = resourceRepository
                                .findAll(org.springframework.data.domain.Sort.by("resourceName"));
                return resources.stream()
                                .map(this::mapToResourceResponse)
                                .collect(Collectors.toList());
        }

        /** Only resources above ABT may mentor, so the picker offers just those. */
        public List<ResourceResponse> getReportingManagerCandidates() {
                return resourceRepository.findAll(org.springframework.data.domain.Sort.by("resourceName")).stream()
                                .filter(r -> r.getLevel() != null && r.getLevel().canBeReportingManager())
                                .map(this::mapToResourceResponse)
                                .collect(Collectors.toList());
        }

        /** Null is allowed: a resource may have no RM yet. */
        private Resource resolveReportingManager(Integer reportingManagerId) {
                if (reportingManagerId == null) {
                        return null;
                }
                Resource manager = resourceRepository.findById(reportingManagerId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Reporting manager not found with id: " + reportingManagerId));
                if (manager.getLevel() == null || !manager.getLevel().canBeReportingManager()) {
                        throw new RuntimeException("Reporting manager must be above ABT level");
                }
                return manager;
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
                                .level(request.getLevel() != null ? request.getLevel() : ResourceLevel.ABT)
                                .reportingManager(resolveReportingManager(request.getReportingManagerId()))
                                .build();

                try {
                        Resource savedResource = resourceRepository.saveAndFlush(resource);
                        long totalCount = resourceRepository.count();
                        System.out.println("Resource successfully saved. Total resources in DB: " + totalCount);

                        // Log activity
                        String currentPrincipalName = SecurityContextHolder.getContext().getAuthentication().getName();
                        User performedBy = userRepository.findByEmail(currentPrincipalName)
                                        .orElseThrow(() -> new RuntimeException("Current user not found"));

                        historyLogService.logActivity(
                                        EntityType.RESOURCE,
                                        "CREATE",
                                        String.format("Created Resource %s (%s) at level %s",
                                                        savedResource.getResourceName(),
                                                        savedResource.getEmail(),
                                                        savedResource.getLevel()),
                                        performedBy);

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
                                .project(project)
                                .resource(resource)
                                .role(request.getProjectRole())
                                .startDate(startDate)
                                .endDate(endDate)
                                .reason("Resource assigned directly by Admin")
                                .build();

                requestService.recordDirectAction(admin, RequestType.ASSIGN, savedRequest);

                // Update resource status to ASSIGNED
                resource.setStatus(ResourceStatus.ASSIGNED);
                resourceRepository.save(resource);

                return mapToResourceResponse(resource);
        }

        public List<ResourceResponse.AssignmentInfo> getResourceAssignments(Integer resourceId) {
                List<ResourceAssignment> assignments = assignmentRepository
                                .findByResource_ResourceIdOrderByStartDateDesc(resourceId);
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
                ResourceLevel oldLevel = resource.getLevel();
                String oldManager = resource.getReportingManager() != null
                                ? resource.getReportingManager().getResourceName()
                                : "-";

                if (request.getReportingManagerId() != null
                                && request.getReportingManagerId().equals(resourceId)) {
                        throw new RuntimeException("A resource cannot be its own reporting manager");
                }

                resource.setResourceName(request.getResourceName());
                resource.setEmail(request.getEmail());
                resource.setLevel(request.getLevel());
                resource.setReportingManager(resolveReportingManager(request.getReportingManagerId()));

                Resource updated = resourceRepository.save(resource);

                // Log activity
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User actor = userRepository.findByEmail(email).orElseThrow();

                // Only list what actually changed; repeating unchanged values made the log
                // unreadable ("Agus Setiawan -> Agus Setiawan").
                String newManager = updated.getReportingManager() != null
                                ? updated.getReportingManager().getResourceName()
                                : "-";
                List<String> changes = new java.util.ArrayList<>();
                if (!java.util.Objects.equals(oldName, updated.getResourceName())) {
                        changes.add(String.format("name %s -> %s", oldName, updated.getResourceName()));
                }
                if (!java.util.Objects.equals(oldEmail, updated.getEmail())) {
                        changes.add(String.format("email %s -> %s", oldEmail, updated.getEmail()));
                }
                if (!java.util.Objects.equals(oldLevel, updated.getLevel())) {
                        changes.add(String.format("level %s -> %s", oldLevel, updated.getLevel()));
                }
                if (!java.util.Objects.equals(oldManager, newManager)) {
                        changes.add(String.format("reporting manager %s -> %s", oldManager, newManager));
                }

                String changeLog = String.format("Updated Resource %s: %s",
                                updated.getResourceName(),
                                changes.isEmpty() ? "no changes" : String.join(", ", changes));

                historyLogService.logActivity(
                                EntityType.RESOURCE,
                                "UPDATE",
                                changeLog,
                                actor);

                return mapToResourceResponse(updated);
        }

        private ResourceResponse mapToResourceResponse(Resource resource) {
                // Feeds currentAssignments, which the resource modals list.
                List<ResourceAssignment> assignments = assignmentRepository
                                .findByResource_ResourceIdOrderByStartDateDesc(resource.getResourceId());

                // Count assignments that are still current (active, project open, not ended)
                long projectCount = assignments.stream()
                                .filter(ResourceService::isCurrentAssignment)
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
                                .level(resource.getLevel())
                                .reportingManagerId(resource.getReportingManager() != null
                                                ? resource.getReportingManager().getResourceId()
                                                : null)
                                .reportingManagerName(resource.getReportingManager() != null
                                                ? resource.getReportingManager().getResourceName()
                                                : null)
                                .projectCount((int) projectCount)
                                .totalAssignments(assignments.size())
                                .currentAssignments(assignmentInfos)
                                .build();
        }

        /**
         * An assignment is "current" only while it is ACTIVE, its project is still open,
         * and its end date has not passed.
         */
        static boolean isCurrentAssignment(ResourceAssignment assignment) {
                return assignment.getStatus() == AssignmentStatus.ACTIVE
                                && assignment.getProject().getStatus() != ProjectStatus.CLOSED
                                && !assignment.getEndDate().isBefore(LocalDate.now());
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
