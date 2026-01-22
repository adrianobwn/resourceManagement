package com.resourceManagement.repository;

import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Integer> {

    List<Project> findByPm_UserId(Integer pmId);

    List<Project> findByStatus(ProjectStatus status);

    long countByStatus(ProjectStatus status);
}
