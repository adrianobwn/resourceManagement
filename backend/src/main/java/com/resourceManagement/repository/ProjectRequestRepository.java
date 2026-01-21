package com.resourceManagement.repository;

import com.resourceManagement.model.entity.ProjectRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRequestRepository extends JpaRepository<ProjectRequest, Integer> {

    List<ProjectRequest> findByRequestedBy_UserId(Integer userId);

    List<ProjectRequest> findByStatus(String status);
}
