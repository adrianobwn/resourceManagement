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
            return requestRepository.findByRequester_UserIdAndStatus(user.getUserId(), RequestStatus.PENDING);
        }
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
         } else if (req.getRequestType() == RequestType.RELEASE) {
             ReleaseAssignmentRequest dto = new ReleaseAssignmentRequest();
             dto.setAssignmentId(req.getAssignmentId());
             dto.setReleaseDate(req.getNewEndDate());
             dto.setReason(req.getReason());
             resourceAssignmentService.releaseAssignment(dto);
         } else if (req.getRequestType() == RequestType.PROJECT) {
             // Create project
             Project project = Project.builder()
                     .projectName(req.getProjectName())
                     .clientName(req.getClientName())
                     .pm(req.getRequester())
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

    @Transactional
    public void rejectRequest(Integer requestId) {
        AssignmentRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        req.setStatus(RequestStatus.REJECTED);
        requestRepository.save(req);
    }
}
