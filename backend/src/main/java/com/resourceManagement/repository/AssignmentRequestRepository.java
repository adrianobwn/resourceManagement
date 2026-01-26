package com.resourceManagement.repository;

import com.resourceManagement.model.entity.AssignmentRequest;
import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.model.enums.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRequestRepository extends JpaRepository<AssignmentRequest, Integer> {

    List<AssignmentRequest> findByStatus(RequestStatus status);

    List<AssignmentRequest> findByRequester_UserId(Integer requesterId);

    List<AssignmentRequest> findByRequester_UserIdAndStatus(Integer requesterId, RequestStatus status);

    List<AssignmentRequest> findByRequester_UserIdOrProject_Pm_UserId(Integer userId, Integer pmId);

    boolean existsByAssignmentIdAndRequestTypeAndStatus(Integer assignmentId, RequestType requestType,
            RequestStatus status);

    void deleteByProject_ProjectId(Integer projectId);
}
