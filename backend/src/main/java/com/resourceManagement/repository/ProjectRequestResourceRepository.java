package com.resourceManagement.repository;

import com.resourceManagement.model.entity.ProjectRequestResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRequestResourceRepository extends JpaRepository<ProjectRequestResource, Integer> {
    void deleteByResource_ResourceId(Integer resourceId);
}
