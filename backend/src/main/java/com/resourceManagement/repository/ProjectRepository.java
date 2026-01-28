package com.resourceManagement.repository;

import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Integer> {

    List<Project> findByDevMan_UserId(Integer devManId);

    List<Project> findByStatus(ProjectStatus status);

    List<Project> findByDevMan_UserIdAndStatus(Integer devManId, ProjectStatus status);

    long countByStatus(ProjectStatus status);

    long countByDevMan_UserIdAndStatus(Integer devManId, ProjectStatus status);
}
