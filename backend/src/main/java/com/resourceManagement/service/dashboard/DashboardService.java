package com.resourceManagement.service.dashboard;

import com.resourceManagement.dto.dashboard.ActiveProjectResponse;
import com.resourceManagement.dto.dashboard.AssignmentEndingSoonResponse;
import com.resourceManagement.dto.dashboard.DashboardStatsResponse;
import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.AssignmentStatus;
import com.resourceManagement.model.enums.ProjectStatus;
import com.resourceManagement.model.enums.ResourceStatus;
import com.resourceManagement.model.enums.UserType;
import com.resourceManagement.repository.ProjectRepository;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import com.resourceManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.resourceManagement.service.request.AssignmentRequestService;
import org.springframework.security.core.context.SecurityContextHolder;

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
    private final AssignmentRequestService requestService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public DashboardStatsResponse getStats() {
        User user = getCurrentUser();
        long totalResources = resourceRepository.count();
        long availableResources = resourceRepository.countByStatus(ResourceStatus.AVAILABLE);
        
        long activeProjects;
        if (user.getUserType() == UserType.ADMIN) {
            activeProjects = projectRepository.countByStatus(ProjectStatus.ON_GOING);
        } else {
            activeProjects = projectRepository.countByPm_UserIdAndStatus(user.getUserId(), ProjectStatus.ON_GOING);
        }
        
        long pendingRequests = requestService.getPendingRequests(user.getEmail()).size();

        return DashboardStatsResponse.builder()
                .totalResources(totalResources)
                .availableResources(availableResources)
                .activeProjects(activeProjects)
                .pendingRequests(pendingRequests)
                .build();
    }

    public List<AssignmentEndingSoonResponse> getAssignmentsEndingSoon(int days) {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);

        List<ResourceAssignment> assignments;
        if (user.getUserType() == UserType.ADMIN) {
            assignments = assignmentRepository
                    .findByStatusAndEndDateBetween(AssignmentStatus.ACTIVE, today, endDate);
        } else {
            assignments = assignmentRepository
                    .findByStatusAndProject_Pm_UserIdAndEndDateBetween(AssignmentStatus.ACTIVE, user.getUserId(), today, endDate);
        }

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
        User user = getCurrentUser();
        List<Project> projects;
        if (user.getUserType() == UserType.ADMIN) {
            projects = projectRepository.findByStatus(ProjectStatus.ON_GOING);
        } else {
            projects = projectRepository.findByPm_UserIdAndStatus(user.getUserId(), ProjectStatus.ON_GOING);
        }

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
