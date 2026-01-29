package com.resourceManagement.service.resource;

import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.entity.ResourceRequest;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.model.enums.RequestType;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import com.resourceManagement.repository.ResourceRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceRequestService {

    private final ResourceRequestRepository requestRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceAssignmentRepository assignmentRepository;

    public ResourceRequest createResourceRequest(ResourceRequest request, User requestedBy) {
        request.setRequestedBy(requestedBy);
        request.setStatus(RequestStatus.PENDING);
        request.setRequestedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    public List<ResourceRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    public List<ResourceRequest> getRequestsByUser(Integer userId) {
        return requestRepository.findByRequestedBy_UserId(userId);
    }

    @Transactional
    public ResourceRequest approveResourceRequest(Integer requestId) {
        ResourceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Resource request not found"));

        request.setStatus(RequestStatus.APPROVED);
        requestRepository.save(request);

        if (request.getRequestType() == RequestType.ASSIGN) {
            // Create new ResourceAssignment and set Resource to ASSIGNED
            ResourceAssignment assignment = ResourceAssignment.builder()
                    .resource(request.getResource())
                    .project(request.getProject())
                    .projectRole(request.getRequestedRole())
                    .startDate(request.getProposedStartDate())
                    .endDate(request.getProposedEndDate())
                    .status(AssignmentStatus.ACTIVE)
                    .build();

            assignmentRepository.save(assignment);

            // Update resource status
            Resource resource = request.getResource();
            resource.setStatus(ResourceStatus.ASSIGNED);
            resourceRepository.save(resource);

        } else if (request.getRequestType() == RequestType.RELEASE) {
            // Find existing assignment and set to RELEASED, resource to AVAILABLE
            List<ResourceAssignment> assignments = assignmentRepository
                    .findByResource_ResourceId(request.getResource().getResourceId());
            for (ResourceAssignment assignment : assignments) {
                if (assignment.getProject().getProjectId().equals(request.getProject().getProjectId())) {
                    assignment.setStatus(AssignmentStatus.RELEASED);
                    assignmentRepository.save(assignment);

                    // Check if resource has other active assignments
                    long activeAssignmentsCount = assignmentRepository.countByResource_ResourceIdAndStatus(
                            request.getResource().getResourceId(),
                            AssignmentStatus.ACTIVE);

                    // Update resource status
                    Resource resource = request.getResource();
                    if (activeAssignmentsCount == 0) {
                        resource.setStatus(ResourceStatus.AVAILABLE);
                    } else {
                        resource.setStatus(ResourceStatus.ASSIGNED);
                    }
                    resourceRepository.save(resource);
                    break;
                }
            }
        }

        return request;
    }

    @Transactional
    public ResourceRequest rejectResourceRequest(Integer requestId) {
        ResourceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Resource request not found"));

        request.setStatus(RequestStatus.REJECTED);
        return requestRepository.save(request);
    }
}
