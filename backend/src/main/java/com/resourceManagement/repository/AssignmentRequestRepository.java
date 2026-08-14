package com.resourceManagement.repository;

import com.resourceManagement.model.entity.AssignmentRequest;
import com.resourceManagement.model.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRequestRepository extends JpaRepository<AssignmentRequest, Integer> {

    // Newest first: these back the Notifications and Activities lists.
    List<AssignmentRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<AssignmentRequest> findByRequester_UserId(Integer requesterId);

    List<AssignmentRequest> findByRequester_UserIdAndStatusOrderByCreatedAtDesc(Integer requesterId,
            RequestStatus status);

    List<AssignmentRequest> findByRequester_UserIdOrProject_DevMan_UserIdOrderByCreatedAtDesc(Integer userId,
            Integer devManId);

    List<AssignmentRequest> findByProject_ProjectIdAndStatusOrderByCreatedAtDesc(Integer projectId,
            RequestStatus status);

    List<AssignmentRequest> findByProject_ProjectId(Integer projectId);

    long countByResource_ResourceIdAndProject_ProjectIdAndRoleAndStatus(Integer resourceId, Integer projectId,
            String role, RequestStatus status);

    void deleteByProject_ProjectId(Integer projectId);

    void deleteByResource_ResourceId(Integer resourceId);

    void deleteByRequester_UserId(Integer requesterId);
}
