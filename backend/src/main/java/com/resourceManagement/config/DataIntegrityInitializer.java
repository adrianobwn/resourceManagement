package com.resourceManagement.config;

import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ProjectStatus;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataIntegrityInitializer implements CommandLineRunner {

    private final ResourceRepository resourceRepository;
    private final ResourceAssignmentRepository assignmentRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting Data Integrity Check...");
        fixAssignmentStatuses();
        syncResourceStatuses();
        log.info("Data Integrity Check Completed.");
    }

    private void fixAssignmentStatuses() {
        List<com.resourceManagement.model.entity.ResourceAssignment> assignments = assignmentRepository.findAll();
        int fixedCount = 0;
        java.time.LocalDate now = java.time.LocalDate.now();

        for (com.resourceManagement.model.entity.ResourceAssignment assignment : assignments) {
            boolean isReleased = assignment.getStatus() == AssignmentStatus.RELEASED;
            boolean isFutureOrPresent = !assignment.getEndDate().isBefore(now);

            // Case 1: Assignment is NOT Released, has Future Date, but is NOT Active (e.g.
            // EXPIRED or null)
            if (!isReleased && isFutureOrPresent && assignment.getStatus() != AssignmentStatus.ACTIVE) {
                log.warn("Found Inconsistent Assignment (Should be ACTIVE): ID={}, Resource={}, Project={}, Status={}",
                        assignment.getAssignmentId(), assignment.getResource().getResourceName(),
                        assignment.getProject().getProjectName(), assignment.getStatus());

                assignment.setStatus(AssignmentStatus.ACTIVE);
                assignmentRepository.save(assignment);
                fixedCount++;
            }

            // Case 2: Assignment is ACTIVE but date passed (Should be EXPIRED)
            if (assignment.getStatus() == AssignmentStatus.ACTIVE && !isFutureOrPresent) {
                log.warn("Found Expired Assignment (Should be EXPIRED): ID={}, Resource={}, Project={}, EndDate={}",
                        assignment.getAssignmentId(), assignment.getResource().getResourceName(),
                        assignment.getProject().getProjectName(), assignment.getEndDate());

                assignment.setStatus(AssignmentStatus.EXPIRED);
                assignmentRepository.save(assignment);
                fixedCount++;
            }

            // Case 3: Assignment is ACTIVE but Project is CLOSED (Should be RELEASED)
            if (assignment.getStatus() == AssignmentStatus.ACTIVE
                    && assignment.getProject().getStatus() == ProjectStatus.CLOSED) {
                log.warn("Found Active Assignment for CLOSED Project: ID={}, Resource={}, Project={}",
                        assignment.getAssignmentId(), assignment.getResource().getResourceName(),
                        assignment.getProject().getProjectName());

                assignment.setStatus(AssignmentStatus.RELEASED);
                assignmentRepository.save(assignment);
                fixedCount++;
            }
        }

        if (fixedCount > 0) {
            log.info("Fixed status for {} assignments.", fixedCount);
        } else {
            log.info("All assignment statuses are consistent.");
        }
    }

    private void syncResourceStatuses() {
        List<Resource> resources = resourceRepository.findAll();
        int updatedCount = 0;

        for (Resource resource : resources) {
            long activeAssignments = assignmentRepository.countByResource_ResourceIdAndStatus(
                    resource.getResourceId(),
                    AssignmentStatus.ACTIVE);

            ResourceStatus correctStatus = activeAssignments > 0 ? ResourceStatus.ASSIGNED : ResourceStatus.AVAILABLE;

            if (resource.getStatus() != correctStatus) {
                log.warn("Mismatch found for Resource: {} (ID: {}). Current: {}, Expected: {}. Fixing...",
                        resource.getResourceName(), resource.getResourceId(), resource.getStatus(), correctStatus);

                resource.setStatus(correctStatus);
                resourceRepository.save(resource);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            log.info("Fixed status for {} resources.", updatedCount);
        } else {
            log.info("All resource statuses are consistent.");
        }
    }
}
