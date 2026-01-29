package com.resourceManagement.repository;

import com.resourceManagement.model.entity.AssignmentRequest;
import com.resourceManagement.model.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRequestRepository extends JpaRepository<AssignmentRequest, Integer> {

    List<AssignmentRequest> findByStatus(RequestStatus status);

    List<AssignmentRequest> findByRequester_UserId(Integer requesterId);

    List<AssignmentRequest> findByRequester_UserIdAndStatus(Integer requesterId, RequestStatus status);

    List<AssignmentRequest> findByRequester_UserIdOrProject_DevMan_UserId(Integer userId, Integer devManId);

    List<AssignmentRequest> findByProject_ProjectIdAndStatus(Integer projectId, RequestStatus status);

    List<AssignmentRequest> findByProject_ProjectId(Integer projectId);

    void deleteByProject_ProjectId(Integer projectId);
}
