package com.resourceManagement.service.dashboard;

import com.resourceManagement.dto.dashboard.ActiveProjectResponse;
import com.resourceManagement.dto.dashboard.AssignmentEndingSoonResponse;
import com.resourceManagement.dto.dashboard.DashboardStatsResponse;
import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ProjectStatus;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.repository.ProjectRepository;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ResourceRepository resourceRepository;
    private final ProjectRepository projectRepository;
    private final ResourceAssignmentRepository assignmentRepository;

    public DashboardStatsResponse getStats() {
        long totalResources = resourceRepository.count();
        long availableResources = resourceRepository.countByStatus(ResourceStatus.AVAILABLE);
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ON_GOING);
        // For now, pending requests is 0 since we don't have a request entity yet
        long pendingRequests = 0;

        return DashboardStatsResponse.builder()
                .totalResources(totalResources)
                .availableResources(availableResources)
                .activeProjects(activeProjects)
                .pendingRequests(pendingRequests)
                .build();
    }

    public List<AssignmentEndingSoonResponse> getAssignmentsEndingSoon(int days) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);

        List<ResourceAssignment> assignments = assignmentRepository
                .findByStatusAndEndDateBetween(AssignmentStatus.ACTIVE, today, endDate);

        return assignments.stream()
                .map(a -> AssignmentEndingSoonResponse.builder()
                        .assignmentId(a.getAssignmentId())
                        .resourceName(a.getResource().getResourceName())
                        .projectRole(a.getProjectRole())
                        .projectName(a.getProject().getProjectName())
                        .endDate(a.getEndDate())
                        .daysLeft(ChronoUnit.DAYS.between(today, a.getEndDate()))
                        .build())
                .collect(Collectors.toList());
    }

    public List<ActiveProjectResponse> getActiveProjects() {
        List<Project> projects = projectRepository.findByStatus(ProjectStatus.ON_GOING);

        return projects.stream()
                .map(p -> ActiveProjectResponse.builder()
                        .projectId(p.getProjectId())
                        .projectName(p.getProjectName())
                        .clientName(p.getClientName())
                        .status(p.getStatus().name())
                        .memberCount(assignmentRepository.countByProject_ProjectId(p.getProjectId()))
                        .build())
                .collect(Collectors.toList());
    }
}
