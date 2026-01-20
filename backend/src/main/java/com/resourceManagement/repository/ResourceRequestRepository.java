package com.resourceManagement.repository;

import com.resourceManagement.model.entity.ResourceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRequestRepository extends JpaRepository<ResourceRequest, Integer> {

    List<ResourceRequest> findByRequestedBy_UserId(Integer userId);

    List<ResourceRequest> findByStatus(String status);

    List<ResourceRequest> findByResource_ResourceId(Integer resourceId);

    List<ResourceRequest> findByProject_ProjectId(Integer projectId);
}
