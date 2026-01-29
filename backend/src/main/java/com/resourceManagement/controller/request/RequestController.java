package com.resourceManagement.controller.request;

import com.resourceManagement.dto.request.AssignmentRequestResponse;
import com.resourceManagement.dto.request.ProjectProposalRequest;
import com.resourceManagement.dto.resource.AssignResourceRequest;
import com.resourceManagement.model.entity.AssignmentRequest;
import com.resourceManagement.model.enums.RequestType;
import com.resourceManagement.service.request.AssignmentRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

    private final AssignmentRequestService requestService;

    @GetMapping
    public ResponseEntity<List<AssignmentRequestResponse>> getRequests() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<AssignmentRequestResponse> responses = requestService.getPendingRequests(email)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/history")
    public ResponseEntity<List<AssignmentRequestResponse>> getRequestHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<AssignmentRequestResponse> responses = requestService.getAllRequests(email)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/project/{projectId}/pending")
    public ResponseEntity<List<AssignmentRequestResponse>> getPendingRequestsByProject(
            @PathVariable Integer projectId) {
        List<AssignmentRequestResponse> responses = requestService.getPendingRequestsByProject(projectId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/project")
    public ResponseEntity<String> submitProjectProposal(@RequestBody ProjectProposalRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        requestService.submitProjectProposal(email, request);
        return ResponseEntity.ok("Project proposal submitted successfully");
    }

    @PostMapping("/assign")
    public ResponseEntity<String> submitAssignRequest(@RequestBody AssignResourceRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        requestService.createAssignRequest(email, request);
        return ResponseEntity.ok("Assignment request submitted successfully");
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<String> approveRequest(@PathVariable Integer id) {
        requestService.approveRequest(id);
        return ResponseEntity.ok("Request approved successfully");
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectRequest(@PathVariable Integer id,
            @RequestBody java.util.Map<String, String> body) {
        String reason = body.get("reason");
        requestService.rejectRequest(id, reason);
        return ResponseEntity.ok("Request rejected successfully");
    }

    private AssignmentRequestResponse mapToResponse(AssignmentRequest req) {
        AssignmentRequestResponse.AssignmentRequestResponseBuilder builder = AssignmentRequestResponse.builder()
                .id(req.getRequestId())
                .assignmentId(req.getAssignmentId()) // Add assignmentId for EXTEND/RELEASE matching
                .type(req.getRequestType().name())
                .status(req.getStatus().name())
                .requester(req.getRequester().getName())
                .reason(req.getReason())
                .submittedDate(req.getCreatedAt());

        if (req.getResource() != null) {
            builder.resource(req.getResource().getResourceName());
        }
        if (req.getProject() != null) {
            builder.project(req.getProject().getProjectName());
        } else if (req.getProjectName() != null) {
            builder.project(req.getProjectName());
        }

        builder.role(req.getRole())
                .currentEndDate(req.getCurrentEndDate())
                .startDate(req.getStartDate())
                .newEndDate(req.getRequestType() == RequestType.ASSIGN ? req.getEndDate() : req.getNewEndDate())
                .projectName(req.getProjectName())
                .clientName(req.getClientName())
                .description(req.getDescription())
                .rejectionReason(req.getRejectionReason());

        if (req.getResourcePlan() != null) {
            List<AssignmentRequestResponse.ResourcePlanItem> plan = req.getResourcePlan().stream()
                    .map(item -> AssignmentRequestResponse.ResourcePlanItem.builder()
                            .name(item.getResource().getResourceName())
                            .role(item.getRole())
                            .startDate(item.getStartDate())
                            .endDate(item.getEndDate())
                            .build())
                    .collect(Collectors.toList());
            builder.resourcePlan(plan);
        }

        return builder.build();
    }
}
