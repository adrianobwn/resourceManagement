package com.resourceManagement.config;

import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ProjectStatus;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import com.resourceManagement.service.assignment.ResourceAssignmentService;
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
    private final ResourceAssignmentService assignmentService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting Data Integrity Check...");
        fixAssignmentStatuses();
        // Must run before syncResourceStatuses(): releasing expired assignments is what
        // frees their resources and closes finished projects.
        assignmentService.autoReleaseAssignments();
        syncResourceStatuses();
        log.info("Data Integrity Check Completed.");
    }

    private void fixAssignmentStatuses() {
        List<com.resourceManagement.model.entity.ResourceAssignment> assignments = assignmentRepository.findAll();
        int fixedCount = 0;

        for (com.resourceManagement.model.entity.ResourceAssignment assignment : assignments) {
            boolean isReleased = assignment.getStatus() == AssignmentStatus.RELEASED;

            // Case 1: Assignment is neither RELEASED nor ACTIVE (e.g. EXPIRED or null).
            // Past-dated ones are restored to ACTIVE too, so autoReleaseAssignments()
            // below can release them properly and close the project if it is finished.
            if (!isReleased && assignment.getStatus() != AssignmentStatus.ACTIVE) {
                log.warn("Found Inconsistent Assignment (Should be ACTIVE): ID={}, Resource={}, Project={}, Status={}",
                        assignment.getAssignmentId(), assignment.getResource().getResourceName(),
                        assignment.getProject().getProjectName(), assignment.getStatus());

                assignment.setStatus(AssignmentStatus.ACTIVE);
                assignmentRepository.save(assignment);
                fixedCount++;
            }

            // Assignments whose end date has passed are deliberately left ACTIVE here:
            // autoReleaseAssignments() releases them, and only that path also auto-closes
            // the project once its last resource is gone. Marking them EXPIRED here hid
            // them from that job and left finished projects stuck ONGOING.

            // Case 2: Assignment is ACTIVE but Project is CLOSED (Should be RELEASED)
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
