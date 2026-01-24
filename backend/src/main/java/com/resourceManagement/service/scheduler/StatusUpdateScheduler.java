package com.resourceManagement.service.scheduler;

import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ProjectStatus;
import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.model.enums.RequestType;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.repository.AssignmentRequestRepository;
import com.resourceManagement.repository.ProjectRepository;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatusUpdateScheduler {

    private final ResourceAssignmentRepository assignmentRepository;
    private final AssignmentRequestRepository requestRepository;
    private final ProjectRepository projectRepository;
    private final ResourceRepository resourceRepository;

    // Run every minute for demo purposes (cron = "0 * * * * *")
    // In production, maybe daily: "0 0 0 * * *"
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void updateStatuses() {
        log.info("Running scheduled status update...");
        updateExpiredAssignments();
        updateProjectStatuses();
    }

    private void updateExpiredAssignments() {
        LocalDate today = LocalDate.now();
        // Find active assignments that have passed their end date (endDate < today)
        // Adjust logic: if today is 15th, and end date is 14th, it is expired.
        // So endDateBefore(today) is correct.
        List<ResourceAssignment> expiredAssignments = assignmentRepository.findByStatusAndEndDateBefore(
                AssignmentStatus.ACTIVE, today);

        for (ResourceAssignment assignment : expiredAssignments) {
            // Check if there is a pending EXTEND request for this assignment
            boolean hasPendingExtend = requestRepository.existsByAssignmentIdAndRequestTypeAndStatus(
                    assignment.getAssignmentId(), RequestType.EXTEND, RequestStatus.PENDING);

            if (!hasPendingExtend) {
                // No pending extend request -> Release the assignment
                assignment.setStatus(AssignmentStatus.RELEASED);
                assignmentRepository.save(assignment);
                log.info("Auto-released assignment ID: {} for Resource: {}", assignment.getAssignmentId(),
                        assignment.getResource().getResourceName());

                // Check if resource should be available
                checkResourceAvailability(assignment.getResource());
            } else {
                log.info("Assignment ID: {} has pending EXTEND request. Skipping auto-release.",
                        assignment.getAssignmentId());
            }
        }
    }

    private void checkResourceAvailability(Resource resource) {
        // If resource has no active assignments, set status to AVAILABLE
        List<ResourceAssignment> activeAssignments = assignmentRepository
                .findByResource_ResourceId(resource.getResourceId())
                .stream()
                .filter(a -> a.getStatus() == AssignmentStatus.ACTIVE)
                .toList();

        if (activeAssignments.isEmpty()) {
            resource.setStatus(ResourceStatus.AVAILABLE);
            resourceRepository.save(resource);
            log.info("Resource {} set to AVAILABLE", resource.getResourceName());
        }
    }

    private void updateProjectStatuses() {
        List<Project> activeProjects = projectRepository.findAll().stream()
                .filter(p -> p.getStatus() != ProjectStatus.CLOSED)
                .toList();

        for (Project project : activeProjects) {
            // Check if all assignments in this project are RELEASED (or EXPIRED, basically
            // NOT ACTIVE)
            // Logic: if count of ACTIVE assignments is 0, close the project?
            // "Apabila seluruh resource di project tersebut sudah berstatus released, maka
            // project menjadi berstatus closed"
            // This implies we look at the resource assignments for this project.
            // If there are NO active assignments, does it mean "all are released"?
            // Yes, effectively.

            long activeCount = assignmentRepository.countByProject_ProjectIdAndStatus(
                    project.getProjectId(), AssignmentStatus.ACTIVE);

            if (activeCount == 0) {
                // We should also check if there were any assignments at all?
                // If a project is new and has 0 assignments, should it be CLOSED?
                // Probably not. "Seluruh resource... sudah berstatus released".
                // Maybe check if it HAS assignments, and ALL are released.

                long totalAssignments = assignmentRepository.countByProject_ProjectId(project.getProjectId());

                if (totalAssignments > 0) {
                    // Has assignments, and none are active -> All released.
                    project.setStatus(ProjectStatus.CLOSED);
                    projectRepository.save(project);
                    log.info("Project {} auto-closed as all resources are released.", project.getProjectName());
                }
            }
        }
    }
}
