package com.resourceManagement.service.request;

import com.resourceManagement.dto.request.ProjectProposalRequest;
import com.resourceManagement.dto.assignment.ExtendAssignmentRequest;
import com.resourceManagement.dto.assignment.ReleaseAssignmentRequest;
import com.resourceManagement.dto.resource.AssignResourceRequest;
import com.resourceManagement.model.entity.*;
import com.resourceManagement.model.enums.*;
import com.resourceManagement.repository.*;
import com.resourceManagement.service.assignment.ResourceAssignmentService;
import com.resourceManagement.service.resource.ResourceService;
import lombok.RequiredArgsConstructor;
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

    private void logToHistory(User performedBy, EntityType entityType, String activityType, String description, Project project, Resource resource, String role) {
        historyLogService.logActivity(entityType, activityType, description, performedBy, project, resource, role);
    }

    @Transactional
    public void createExtendRequest(String requesterEmail, ExtendAssignmentRequest dto) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ResourceAssignment currentAssignment = assignmentRepository.findById(dto.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

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
    }

    @Transactional
    public void createReleaseRequest(String requesterEmail, ReleaseAssignmentRequest dto) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ResourceAssignment currentAssignment = assignmentRepository.findById(dto.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

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
    }

    @Transactional
    public void createAssignRequest(String requesterEmail, AssignResourceRequest dto) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Resource resource = resourceRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        AssignmentRequest request = AssignmentRequest.builder()
                .requestType(RequestType.ASSIGN)
                .status(RequestStatus.PENDING)
                .requester(requester)
                .project(project)
                .resource(resource)
                .role(dto.getProjectRole())
                .startDate(LocalDate.parse(dto.getStartDate()))
                .endDate(LocalDate.parse(dto.getEndDate()))
                .build();

        requestRepository.save(request);
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
            java.util.List<ProjectRequestResource> plan = dto.getResourcePlan().stream()
                    .map(item -> {
                        Resource res = resourceRepository.findById(item.getResourceId())
                                .orElseThrow(() -> new RuntimeException("Resource not found: " + item.getResourceId()));
                        return ProjectRequestResource.builder()
                                .assignmentRequest(request)
                                .resource(res)
                                .role(item.getRole())
                                .startDate(item.getStartDate())
                                .endDate(item.getEndDate())
                                .build();
                    }).collect(java.util.stream.Collectors.toList());
            request.setResourcePlan(plan);
        }

        requestRepository.save(request);
    }

    public List<AssignmentRequest> getPendingRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getUserType() == UserType.ADMIN) {
            return requestRepository.findByStatus(RequestStatus.PENDING);
        } else {
            // Re-use current behavior: only show what they requested? 
            // Actually, if we want them to see what's pending for their project (maybe requested by others?), we'd use OR.
            // But usually only one DevMan per project. 
            // Let's stick to the user's specific requirement: "berhubungan dengan devman tersebut".
            return requestRepository.findByRequester_UserIdAndStatus(user.getUserId(), RequestStatus.PENDING);
        }
    }

    public List<AssignmentRequest> getAllRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getUserType() == UserType.ADMIN) {
            return requestRepository.findAll();
        } else {
            return requestRepository.findByRequester_UserIdOrProject_DevMan_UserId(user.getUserId(), user.getUserId());
        }
    }

    public List<AssignmentRequest> getPendingRequestsByProject(Integer projectId) {
        // Find all PENDING requests (EXTEND/RELEASE) for assignments in this project
        return requestRepository.findByProject_ProjectIdAndStatus(projectId, RequestStatus.PENDING)
                .stream()
                .filter(req -> req.getRequestType() == RequestType.EXTEND || req.getRequestType() == RequestType.RELEASE)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void approveRequest(Integer requestId) {
         AssignmentRequest req = requestRepository.findById(requestId)
                 .orElseThrow(() -> new RuntimeException("Request not found"));
         
         if (req.getStatus() != RequestStatus.PENDING) {
             throw new RuntimeException("Request is not pending");
         }

         if (req.getRequestType() == RequestType.EXTEND) {
             ExtendAssignmentRequest dto = new ExtendAssignmentRequest();
             dto.setAssignmentId(req.getAssignmentId());
             dto.setNewEndDate(req.getNewEndDate());
             dto.setReason(req.getReason());
             resourceAssignmentService.extendAssignment(dto);
             
             // Log with REQUESTER as performer (PM who submitted the request)
             String desc = String.format("Extended assignment until %s - %s", 
                 req.getNewEndDate(), 
                 req.getReason() != null ? req.getReason() : "");
             logToHistory(req.getRequester(), EntityType.ASSIGNMENT, "EXTEND", desc, 
                         req.getProject(), req.getResource(), req.getRole());
                         
         } else if (req.getRequestType() == RequestType.RELEASE) {
             ReleaseAssignmentRequest dto = new ReleaseAssignmentRequest();
             dto.setAssignmentId(req.getAssignmentId());
             dto.setReleaseDate(req.getNewEndDate());
             dto.setReason(req.getReason());
             resourceAssignmentService.releaseAssignment(dto);
             
             // Log with REQUESTER as performer (PM who submitted the request)
             String desc = String.format("Released from project on %s - %s", 
                 req.getNewEndDate(),
                 req.getReason() != null ? req.getReason() : "");
             logToHistory(req.getRequester(), EntityType.ASSIGNMENT, "RELEASE", desc, 
                         req.getProject(), req.getResource(), req.getRole());
                         
         } else if (req.getRequestType() == RequestType.PROJECT) {
             // Create project
             Project project = Project.builder()
                     .projectName(req.getProjectName())
                     .clientName(req.getClientName())
                     .devMan(req.getRequester())
                     .status(ProjectStatus.ON_GOING)
                     .build();
             Project savedProject = projectRepository.save(project);

             // Create assignments
             if (req.getResourcePlan() != null) {
                 for (ProjectRequestResource item : req.getResourcePlan()) {
                     ResourceAssignment assignment = ResourceAssignment.builder()
                             .project(savedProject)
                             .resource(item.getResource())
                             .projectRole(item.getRole())
                             .startDate(item.getStartDate())
                             .endDate(item.getEndDate())
                             .status(AssignmentStatus.ACTIVE)
                             .build();
                     assignmentRepository.save(assignment);
                     
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
             
             ResourceAssignment assignment = ResourceAssignment.builder()
                     .project(req.getProject())
                     .resource(req.getResource())
                     .projectRole(req.getRole())
                     .startDate(req.getStartDate())
                     .endDate(req.getEndDate())
                     .status(AssignmentStatus.ACTIVE)
                     .build();
             assignmentRepository.save(assignment);

             // Update resource status
             Resource res = req.getResource();
             res.setStatus(ResourceStatus.ASSIGNED);
             resourceRepository.save(res);
         }
         
         req.setStatus(RequestStatus.APPROVED);
         requestRepository.save(req);
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
        
        req.setStatus(RequestStatus.REJECTED);
        req.setRejectionReason(reason);
        requestRepository.save(req);

        // Log to History
        String desc = String.format("Rejected %s request by %s", req.getRequestType(), req.getRequester().getName());
        logToHistory(getCurrentUser(), EntityType.REQUEST, "REJECT", desc, req.getProject(), req.getResource(), req.getRole());
    }

    @Transactional
    public void recordDirectAction(User performedBy, RequestType type, AssignmentRequest details) {
        details.setRequestType(type);
        details.setStatus(RequestStatus.APPROVED);
        details.setRequester(performedBy);
        // createdAt handled by @PrePersist
        requestRepository.save(details);

        // Log to History
        String desc = String.format("Admin directly performed %s: %s", type, details.getReason() != null ? details.getReason() : "");
        logToHistory(performedBy, EntityType.ASSIGNMENT, type.name(), desc, details.getProject(), details.getResource(), details.getRole());
    }
}
