package com.resourceManagement.repository;

import com.resourceManagement.model.entity.ResourceAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceAssignmentRepository extends JpaRepository<ResourceAssignment, Integer> {

    List<ResourceAssignment> findByResource_ResourceId(Integer resourceId);

    List<ResourceAssignment> findByProject_ProjectId(Integer projectId);

    List<ResourceAssignment> findByStatus(String status);
}
