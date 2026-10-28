package com.resourceManagement.service.request;

import com.resourceManagement.dto.request.ProjectProposalRequest;
import com.resourceManagement.dto.assignment.ExtendAssignmentRequest;
import com.resourceManagement.dto.assignment.ReleaseAssignmentRequest;
import com.resourceManagement.dto.resource.AssignResourceRequest;
import com.resourceManagement.model.entity.*;
import com.resourceManagement.model.enums.*;
import com.resourceManagement.repository.*;
import com.resourceManagement.service.assignment.ResourceAssignmentService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentRequestService {

        private final AssignmentRequestRepository requestRepository;
        private final UserRepository userRepository;
        private final ResourceAssignmentRepository assignmentRepository;
        private final ResourceAssignmentService resourceAssignmentService;
        private final ProjectRepository projectRepository;
        private final ResourceRepository resourceRepository;
        private final com.resourceManagement.service.project.HistoryLogService historyLogService;
        private final com.resourceManagement.service.project.NotificationService notificationService;

        private void logToHistory(User performedBy, EntityType entityType, String activityType, String description,
                        Project project, Resource resource, String role) {
                historyLogService.logActivity(entityType, activityType, description, performedBy, project, resource,
                                role);
        }

        /** A DevMan may only ask for changes on projects they manage. */
        private void requireOwnProject(User requester, Project project) {
                if (project.getDevMan() == null || !project.getDevMan().getUserId().equals(requester.getUserId())) {
                        throw new RuntimeException("You can only submit requests for projects you manage.");
                }
        }

        /** Extend/release requests need an active assignment with nothing else waiting on it. */
        private void requireOpenAssignment(ResourceAssignment assignment) {
                if (assignment.getStatus() != AssignmentStatus.ACTIVE) {
                        throw new RuntimeException("Assignment is no longer active.");
                }
                if (!requestRepository.findByAssignmentIdAndStatus(assignment.getAssignmentId(), RequestStatus.PENDING)
                                .isEmpty()) {
                        throw new RuntimeException("This assignment already has a pending request.");
                }
        }

        @Transactional
        public void createExtendRequest(String requesterEmail, ExtendAssignmentRequest dto) {
                User requester = userRepository.findByEmail(requesterEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                ResourceAssignment currentAssignment = assignmentRepository.findById(dto.getAssignmentId())
                                .orElseThrow(() -> new RuntimeException("Assignment not found"));
                requireOwnProject(requester, currentAssignment.getProject());
                requireOpenAssignment(currentAssignment);
                if (dto.getNewEndDate() == null || !dto.getNewEndDate().isAfter(currentAssignment.getEndDate())) {
                        throw new RuntimeException("New end date must be after the current end date ("
                                        + currentAssignment.getEndDate() + ")");
                }

                AssignmentRequest request = AssignmentRequest.builder()
                                .requestType(RequestType.EXTEND)
                                .status(RequestStatus.PENDING)
                                .requester(requester)
                                .project(currentAssignment.getProject())
                                .resource(currentAssignment.getResource())
                                .role(currentAssignment.getProjectRole())
                                .assignmentId(dto.getAssignmentId())
                                .currentEndDate(currentAssignment.getEndDate())
                                .newEndDate(dto.getNewEndDate())
                                .reason(dto.getReason())
                                .build();

                requestRepository.save(request);

                notificationService.notifyAllAdmins(NotificationType.RESOURCE_REQUEST,
                                String.format("%s requested to extend %s on %s until %s",
                                                requester.getName(),
                                                currentAssignment.getResource().getResourceName(),
                                                currentAssignment.getProject().getProjectName(),
                                                dto.getNewEndDate()));
        }

        @Transactional
        public void createReleaseRequest(String requesterEmail, ReleaseAssignmentRequest dto) {
                User requester = userRepository.findByEmail(requesterEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                ResourceAssignment currentAssignment = assignmentRepository.findById(dto.getAssignmentId())
                                .orElseThrow(() -> new RuntimeException("Assignment not found"));
                requireOwnProject(requester, currentAssignment.getProject());
                requireOpenAssignment(currentAssignment);

                AssignmentRequest request = AssignmentRequest.builder()
                                .requestType(RequestType.RELEASE)
                                .status(RequestStatus.PENDING)
                                .requester(requester)
                                .project(currentAssignment.getProject())
                                .resource(currentAssignment.getResource())
                                .role(currentAssignment.getProjectRole())
                                .assignmentId(dto.getAssignmentId())
                                .currentEndDate(currentAssignment.getEndDate())
                                .newEndDate(dto.getReleaseDate()) // Release date maps to newEndDate
                                .reason(dto.getReason())
                                .build();

                requestRepository.save(request);

                notificationService.notifyAllAdmins(NotificationType.RESOURCE_REQUEST,
                                String.format("%s requested to release %s from %s on %s",
                                                requester.getName(),
                                                currentAssignment.getResource().getResourceName(),
                                                currentAssignment.getProject().getProjectName(),
                                                dto.getReleaseDate()));
        }

        @Transactional
        public void createAssignRequest(String requesterEmail, AssignResourceRequest dto) {
                User requester = userRepository.findByEmail(requesterEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Resource resource = resourceRepository.findById(dto.getResourceId())
                                .orElseThrow(() -> new RuntimeException("Resource not found"));
                Project project = projectRepository.findById(dto.getProjectId())
                                .orElseThrow(() -> new RuntimeException("Project not found"));
                requireOwnProject(requester, project);
                if (project.getStatus() == ProjectStatus.CLOSED) {
                        throw new RuntimeException("Cannot assign resources to a CLOSED project");
                }

                // Check for existing active assignment to this project with the SAME ROLE
                long activeAssignments = assignmentRepository
                                .countByResource_ResourceIdAndProject_ProjectIdAndProjectRoleAndStatus(
                                                resource.getResourceId(),
                                                project.getProjectId(),
                                                dto.getProjectRole(),
                                                AssignmentStatus.ACTIVE);

                if (activeAssignments > 0) {
                        throw new RuntimeException("Resource is already assigned to this project with this role.");
                }

                // Check for existing pending request to this project with the SAME ROLE
                long pendingRequests = requestRepository.countByResource_ResourceIdAndProject_ProjectIdAndRoleAndStatus(
                                resource.getResourceId(),
                                project.getProjectId(),
                                dto.getProjectRole(),
                                RequestStatus.PENDING);

                if (pendingRequests > 0) {
                        throw new RuntimeException(
                                        "A pending assignment request already exists for this resource and role in this project.");
                }

                LocalDate startDate = LocalDate.parse(dto.getStartDate());
                LocalDate endDate = LocalDate.parse(dto.getEndDate());
                LocalDate today = LocalDate.now();

                if (startDate.isBefore(today)) {
                        throw new RuntimeException("Start date cannot be in the past.");
                }

                if (!endDate.isAfter(startDate)) {
                        throw new RuntimeException("End date must be after start date.");
                }

                AssignmentRequest request = AssignmentRequest.builder()
                                .requestType(RequestType.ASSIGN)
                                .status(RequestStatus.PENDING)
                                .requester(requester)
                                .project(project)
                                .resource(resource)
                                .role(dto.getProjectRole())
                                .startDate(startDate)
                                .endDate(endDate)
                                .build();

                requestRepository.save(request);

                notificationService.notifyAllAdmins(NotificationType.RESOURCE_REQUEST,
                                String.format("%s requested to assign %s to %s as %s",
                                                requester.getName(),
                                                resource.getResourceName(),
                                                project.getProjectName(),
                                                dto.getProjectRole()));
        }

        @Transactional
        public void submitProjectProposal(String email, ProjectProposalRequest dto) {
                User requester = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                AssignmentRequest request = AssignmentRequest.builder()
                                .requestType(RequestType.PROJECT)
                                .status(RequestStatus.PENDING)
                                .requester(requester)
                                .projectName(dto.getProjectName())
                                .clientName(dto.getClientName())
                                .description(dto.getDescription())
                                .build();

                if (dto.getResourcePlan() != null) {
                        java.util.Set<String> uniqueAssignments = new java.util.HashSet<>();
                        for (com.resourceManagement.dto.request.ProjectProposalRequest.ResourcePlanItem item : dto
                                        .getResourcePlan()) {
                                String key = item.getResourceId() + ":" + item.getRole();
                                if (!uniqueAssignments.add(key)) {
                                        throw new RuntimeException("Duplicate resource and role in proposal: "
                                                        + item.getResourceId() + " as " + item.getRole());
                                }
                        }

                        java.util.List<ProjectRequestResource> plan = dto.getResourcePlan().stream()
                                        .map(item -> {
                                                Resource res = resourceRepository.findById(item.getResourceId())
                                                                .orElseThrow(() -> new RuntimeException(
                                                                                "Resource not found: " + item
                                                                                                .getResourceId()));
                                                return ProjectRequestResource.builder()
                                                                .assignmentRequest(request)
                                                                .resource(res)
                                                                .role(item.getRole())
                                                                .startDate(item.getStartDate())
                                                                .endDate(item.getEndDate())
                                                                .build();
                                        }).collect(java.util.stream.Collectors.toList());

                        // Validate dates in the plan
                        LocalDate today = LocalDate.now();
                        for (ProjectRequestResource item : plan) {
                                LocalDate start = item.getStartDate();
                                LocalDate end = item.getEndDate();
                                if (start.isBefore(today)) {
                                        throw new RuntimeException(
                                                        "Start date for " + item.getResource().getResourceName()
                                                                        + " cannot be in the past.");
                                }
                                if (!end.isAfter(start)) {
                                        throw new RuntimeException(
                                                        "End date for " + item.getResource().getResourceName()
                                                                        + " must be after start date.");
                                }
                        }
                        request.setResourcePlan(plan);
                }

                requestRepository.save(request);

                notificationService.notifyAllAdmins(NotificationType.PROJECT_REQUEST,
                                String.format("%s proposed a new project: %s (%s)",
                                                requester.getName(),
                                                dto.getProjectName(),
                                                dto.getClientName()));
        }

        public List<AssignmentRequest> getPendingRequests(String userEmail) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getUserType() == UserType.Admin) {
                        return requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING);
                } else {
                        // Re-use current behavior: only show what they requested?
                        // Actually, if we want them to see what's pending for their project (maybe
                        // requested by others?), we'd use OR.
                        // But usually only one DevMan per project.
                        // Let's stick to the user's specific requirement: "berhubungan dengan devman
                        // tersebut".
                        return requestRepository.findByRequester_UserIdAndStatusOrderByCreatedAtDesc(user.getUserId(),
                                        RequestStatus.PENDING);
                }
        }

        public List<AssignmentRequest> getAllRequests(String userEmail) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getUserType() == UserType.Admin) {
                        return requestRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
                } else {
                        return requestRepository.findByRequester_UserIdOrProject_DevMan_UserIdOrderByCreatedAtDesc(
                                        user.getUserId(), user.getUserId());
                }
        }

        public List<AssignmentRequest> getPendingRequestsByProject(Integer projectId) {
                // Find all PENDING requests (EXTEND/RELEASE) for assignments in this project
                return requestRepository.findByProject_ProjectIdAndStatusOrderByCreatedAtDesc(projectId,
                                RequestStatus.PENDING)
                                .stream()
                                .filter(req -> req.getRequestType() == RequestType.EXTEND
                                                || req.getRequestType() == RequestType.RELEASE)
                                .collect(java.util.stream.Collectors.toList());
        }

        @Transactional
        public void approveRequest(Integer requestId) {
                AssignmentRequest req = requestRepository.findById(requestId)
                                .orElseThrow(() -> new RuntimeException("Request not found"));

                if (req.getStatus() != RequestStatus.PENDING) {
                        throw new RuntimeException("Request is not pending");
                }

                // The Admin who decides is the performer; the DevMan is named in the description.
                User admin = getCurrentUser();

                if (req.getRequestType() == RequestType.EXTEND) {
                        ExtendAssignmentRequest dto = new ExtendAssignmentRequest();
                        dto.setAssignmentId(req.getAssignmentId());
                        dto.setNewEndDate(req.getNewEndDate());
                        dto.setReason(req.getReason());
                        resourceAssignmentService.extendAssignment(dto); // rejects inactive assignments

                        String desc = String.format("Extended %s from %s to %s (requested by %s)%s",
                                        describeRequestTarget(req),
                                        req.getCurrentEndDate(),
                                        req.getNewEndDate(),
                                        req.getRequester().getName(),
                                        reasonSuffix(req.getReason()));
                        logToHistory(admin, EntityType.ASSIGNMENT, "EXTEND", desc,
                                        req.getProject(), req.getResource(), req.getRole());

                } else if (req.getRequestType() == RequestType.RELEASE) {
                        ReleaseAssignmentRequest dto = new ReleaseAssignmentRequest();
                        dto.setAssignmentId(req.getAssignmentId());
                        dto.setReleaseDate(req.getNewEndDate());
                        dto.setReason(req.getReason());
                        resourceAssignmentService.releaseAssignment(dto); // rejects inactive assignments

                        String desc = String.format("Released %s on %s (requested by %s)%s",
                                        describeRequestTarget(req),
                                        req.getNewEndDate(),
                                        req.getRequester().getName(),
                                        reasonSuffix(req.getReason()));
                        logToHistory(admin, EntityType.ASSIGNMENT, "RELEASE", desc,
                                        req.getProject(), req.getResource(), req.getRole());

                } else if (req.getRequestType() == RequestType.PROJECT) {
                        // Create project
                        Project project = Project.builder()
                                        .projectName(req.getProjectName())
                                        .clientName(req.getClientName())
                                        .devMan(req.getRequester())
                                        .status(ProjectStatus.ONGOING)
                                        .build();
                        Project savedProject = projectRepository.save(project);
                        logToHistory(admin, EntityType.PROJECT, "PROJECT",
                                        String.format("Approved project proposal %s for client %s (requested by %s)",
                                                        savedProject.getProjectName(), savedProject.getClientName(),
                                                        req.getRequester().getName()),
                                        savedProject, null, null);

                        // Create assignments
                        if (req.getResourcePlan() != null) {
                                java.util.Set<String> processedAssignments = new java.util.HashSet<>();
                                for (ProjectRequestResource item : req.getResourcePlan()) {
                                        // Skip if already processed in this batch (prevent duplicates)
                                        String key = item.getResource().getResourceId() + ":" + item.getRole();
                                        if (!processedAssignments.add(key)) {
                                                continue;
                                        }

                                        ResourceAssignment assignment = ResourceAssignment.builder()
                                                        .project(savedProject)
                                                        .resource(item.getResource())
                                                        .projectRole(item.getRole())
                                                        .startDate(item.getStartDate())
                                                        .endDate(item.getEndDate())
                                                        .status(AssignmentStatus.ACTIVE)
                                                        .build();
                                        assignmentRepository.save(assignment);
                                        logAssign(admin, savedProject, item.getResource(), item.getRole(),
                                                        item.getStartDate(), item.getEndDate(),
                                                        "from the approved proposal of " + req.getRequester().getName());

                                        // Update resource status
                                        Resource res = item.getResource();
                                        res.setStatus(ResourceStatus.ASSIGNED);
                                        resourceRepository.save(res);
                                }
                        }
                } else if (req.getRequestType() == RequestType.ASSIGN) {
                        // Validate project status - cannot assign to closed projects
                        if (req.getProject().getStatus() == ProjectStatus.CLOSED) {
                                throw new RuntimeException("Cannot assign resources to a CLOSED project");
                        }

                        // Check for existing active assignment to this project with the SAME ROLE
                        long activeAssignments = assignmentRepository
                                        .countByResource_ResourceIdAndProject_ProjectIdAndProjectRoleAndStatus(
                                                        req.getResource().getResourceId(),
                                                        req.getProject().getProjectId(),
                                                        req.getRole(),
                                                        AssignmentStatus.ACTIVE);

                        if (activeAssignments > 0) {
                                throw new RuntimeException(
                                                "Resource is already assigned to this project with this role.");
                        }

                        ResourceAssignment assignment = ResourceAssignment.builder()
                                        .project(req.getProject())
                                        .resource(req.getResource())
                                        .projectRole(req.getRole())
                                        .startDate(req.getStartDate())
                                        .endDate(req.getEndDate())
                                        .status(AssignmentStatus.ACTIVE)
                                        .build();
                        assignmentRepository.save(assignment);
                        logAssign(admin, req.getProject(), req.getResource(), req.getRole(),
                                        req.getStartDate(), req.getEndDate(),
                                        "requested by " + req.getRequester().getName());

                        // Update resource status
                        Resource res = req.getResource();
                        res.setStatus(ResourceStatus.ASSIGNED);
                        resourceRepository.save(res);
                }

                req.setStatus(RequestStatus.APPROVED);
                requestRepository.save(req);

                String approvedTarget = describeRequestTarget(req);

                notificationService.createNotification(req.getRequester(), NotificationType.APPROVAL_RESULT,
                                String.format("Your %s request for %s has been approved",
                                                req.getRequestType(), approvedTarget));

                // Admins get it too, so the outcome shows up on their Activities badge.
                notificationService.notifyAllAdmins(NotificationType.APPROVAL_RESULT,
                                String.format("%s request for %s by %s was approved",
                                                req.getRequestType(), approvedTarget,
                                                req.getRequester().getName()));
        }

        /** One wording for every new assignment, whichever path created it. */
        private void logAssign(User performedBy, Project project, Resource resource, String role,
                        LocalDate start, LocalDate end, String origin) {
                logToHistory(performedBy, EntityType.ASSIGNMENT, "ASSIGN",
                                String.format("Assigned %s to %s as %s from %s to %s (%s)",
                                                resource.getResourceName(), project.getProjectName(), role, start, end,
                                                origin),
                                project, resource, role);
        }

        /** " - reason" when there is one, empty otherwise. */
        private String reasonSuffix(String reason) {
                return (reason != null && !reason.isBlank()) ? " - " + reason : "";
        }

        /** Project proposals carry a name instead of a linked project/resource. */
        private String describeRequestTarget(AssignmentRequest req) {
                if (req.getRequestType() == RequestType.PROJECT) {
                        return req.getProjectName();
                }
                String resourceName = req.getResource() != null ? req.getResource().getResourceName() : "resource";
                String projectName = req.getProject() != null ? req.getProject().getProjectName() : "project";
                return resourceName + " on " + projectName;
        }

        private User getCurrentUser() {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                return userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Logged in user not found"));
        }

        @Transactional
        public void rejectRequest(Integer requestId, String reason) {
                AssignmentRequest req = requestRepository.findById(requestId)
                                .orElseThrow(() -> new RuntimeException("Request not found"));
                if (req.getStatus() != RequestStatus.PENDING) {
                        throw new RuntimeException("Request is not pending");
                }

                req.setStatus(RequestStatus.REJECTED);
                req.setRejectionReason(reason);
                requestRepository.save(req);

                String target = describeRequestTarget(req);
                String suffix = reasonSuffix(reason);

                // Log to History
                String desc = String.format("Rejected %s request for %s from %s%s",
                                req.getRequestType(), target, req.getRequester().getName(), suffix);
                logToHistory(getCurrentUser(), EntityType.REQUEST, "REJECT", desc, req.getProject(), req.getResource(),
                                req.getRole());

                notificationService.createNotification(req.getRequester(), NotificationType.APPROVAL_RESULT,
                                String.format("Your %s request for %s has been rejected%s",
                                                req.getRequestType(), target, suffix));

                // Admins get it too, so the outcome shows up on their Activities badge.
                notificationService.notifyAllAdmins(NotificationType.APPROVAL_RESULT,
                                String.format("%s request for %s by %s was rejected%s",
                                                req.getRequestType(), target, req.getRequester().getName(),
                                                suffix));
        }

        @Transactional
        public void recordDirectAction(User performedBy, RequestType type, AssignmentRequest details) {
                details.setRequestType(type);
                details.setStatus(RequestStatus.APPROVED);
                details.setRequester(performedBy);
                // createdAt handled by @PrePersist
                requestRepository.save(details);

                // Same facts as the approval path: who, where, and the dates that changed.
                String who = details.getResource() != null ? details.getResource().getResourceName() : "";
                String where = details.getProject() != null ? details.getProject().getProjectName() : "";
                String desc;
                EntityType entity = EntityType.ASSIGNMENT;
                switch (type) {
                        case ASSIGN -> desc = String.format("Assigned %s to %s as %s from %s to %s by Admin",
                                        who, where, details.getRole(), details.getStartDate(), details.getEndDate());
                        case EXTEND -> desc = String.format("Extended %s on %s from %s to %s by Admin%s",
                                        who, where, details.getCurrentEndDate(), details.getNewEndDate(),
                                        reasonSuffix(details.getReason()));
                        case RELEASE -> desc = String.format("Released %s from %s on %s by Admin%s",
                                        who, where, details.getNewEndDate(), reasonSuffix(details.getReason()));
                        case PROJECT -> {
                                entity = EntityType.PROJECT;
                                desc = String.format("Created project %s for client %s by Admin",
                                                details.getProjectName(), details.getClientName());
                        }
                        default -> desc = type + " by Admin";
                }
                logToHistory(performedBy, entity, type.name(), desc, details.getProject(),
                                details.getResource(),
                                details.getRole());
        }
}
