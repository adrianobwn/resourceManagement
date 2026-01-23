package com.resourceManagement.repository;

import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.enums.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Integer> {

    Optional<Resource> findByEmployeeId(String employeeId);

    Optional<Resource> findByEmail(String email);

    boolean existsByEmployeeId(String employeeId);

    boolean existsByEmail(String email);

    long countByStatus(ResourceStatus status);
}
