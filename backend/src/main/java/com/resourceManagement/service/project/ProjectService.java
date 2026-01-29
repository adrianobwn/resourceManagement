package com.resourceManagement.service.project;

import com.resourceManagement.dto.project.CreateProjectRequest;
import com.resourceManagement.dto.project.ProjectListResponse;
import com.resourceManagement.model.entity.AssignmentRequest;
import com.resourceManagement.model.entity.HistoryLog;
import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.EntityType;
import com.resourceManagement.model.enums.ProjectStatus;
import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.model.enums.RequestType;
import com.resourceManagement.model.enums.UserType;
import com.resourceManagement.repository.AssignmentRequestRepository;
import com.resourceManagement.repository.HistoryLogRepository;
import com.resourceManagement.repository.ProjectRepository;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

        private final ProjectRepository projectRepository;
        private final UserRepository userRepository;
        private final ResourceAssignmentRepository resourceAssignmentRepository;
        private final AssignmentRequestRepository requestRepository;
        private final HistoryLogRepository historyLogRepository;
        private final HistoryLogService historyLogService;

        private void recordDirectAction(User performedBy, RequestType type, AssignmentRequest details) {
                details.setRequestType(type);
                details.setStatus(RequestStatus.APPROVED);
                details.setRequester(performedBy);
                requestRepository.save(details);

                // Log to History
                String desc = String.format("Admin directly performed %s: %s", type,
                                details.getReason() != null ? details.getReason() : "");
                historyLogService.logActivity(EntityType.ASSIGNMENT, type.name(), desc, performedBy,
                                details.getProject(),
                                details.getResource(), details.getRole());
        }

        public List<ProjectListResponse> getAllProjects() {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                String email = auth.getName();
                User currentUser = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                List<Project> projects;
                if (currentUser.getUserType() == UserType.DEV_MANAGER) {
                        projects = projectRepository.findByDevMan_UserId(currentUser.getUserId());
                } else {
                        projects = projectRepository.findAll();
                }

                return projects.stream()
                                .map(this::mapToProjectListResponse)
                                .collect(Collectors.toList());
        }

        public ProjectListResponse createProject(CreateProjectRequest request) {
                User devMan = userRepository.findById(request.getDevManId())
                                .orElseThrow(() -> new RuntimeException(
                                                "DevMan not found with id: " + request.getDevManId()));

                Project project = Project.builder()
                                .projectName(request.getProjectName())
                                .clientName(request.getClientName())
                                .devMan(devMan)
                                .status(ProjectStatus.ONGOING)
                                .build();

                Project savedProject = projectRepository.save(project);

                // Record Activity
                AssignmentRequest details = AssignmentRequest.builder()
                                .project(savedProject)
                                .projectName(savedProject.getProjectName())
                                .clientName(savedProject.getClientName())
                                .description("Project created directly by Admin")
                                .build();

                // Find current admin user
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User admin = userRepository.findByEmail(email).orElseThrow();

                recordDirectAction(admin, RequestType.PROJECT, details);

                return mapToProjectListResponse(savedProject);
        }

        private ProjectListResponse mapToProjectListResponse(Project project) {
                long memberCount = resourceAssignmentRepository.countByProject_ProjectIdAndStatus(
                                project.getProjectId(),
                                com.resourceManagement.model.enums.AssignmentStatus.ACTIVE);

                return ProjectListResponse.builder()
                                .projectId(project.getProjectId())
                                .projectName(project.getProjectName())
                                .clientName(project.getClientName())
                                .devManName(project.getDevMan().getName())
                                .devManId(project.getDevMan().getUserId())
                                .memberCount((int) memberCount)
                                .status(project.getStatus().name())
                                .build();
        }

        public List<com.resourceManagement.dto.project.ProjectResourceDto> getProjectResources(Integer projectId) {
                List<com.resourceManagement.model.entity.ResourceAssignment> assignments = resourceAssignmentRepository
                                .findByProject_ProjectId(projectId);

                return assignments.stream()
                                .map(assignment -> com.resourceManagement.dto.project.ProjectResourceDto.builder()
                                                .resourceName(assignment.getResource().getResourceName())
                                                .role(assignment.getProjectRole())
                                                .startDate(assignment.getStartDate())
                                                .endDate(assignment.getEndDate())
                                                .status(assignment.getStatus().name())
                                                .assignmentId(assignment.getAssignmentId())
                                                .build())
                                .collect(Collectors.toList());
        }

        public ProjectListResponse updateProjectStatus(Integer projectId, ProjectStatus status) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new RuntimeException("Project not found"));

                project.setStatus(status);
                Project saved = projectRepository.save(project);

                // Log activity
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User admin = userRepository.findByEmail(email).orElseThrow();
                historyLogService.logActivity(
                                EntityType.PROJECT,
                                "UPDATE_STATUS",
                                "Project status updated to " + status,
                                admin,
                                saved,
                                null,
                                null);

                return mapToProjectListResponse(saved);
        }

        @org.springframework.transaction.annotation.Transactional
        public void deleteProject(Integer projectId) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

                if (project.getStatus() != ProjectStatus.CLOSED) {
                        throw new RuntimeException("Cannot delete project. Only CLOSED projects can be deleted.");
                }

                // Preserve history: Detach assignment requests from the project instead of
                // deleting them works
                List<AssignmentRequest> requests = requestRepository.findByProject_ProjectId(projectId);
                for (AssignmentRequest req : requests) {
                        req.setProject(null);
                        if (req.getProjectName() == null) {
                                req.setProjectName(project.getProjectName());
                        }
                        requestRepository.save(req);
                }

                // Log deletion
                String currentPrincipalName = SecurityContextHolder.getContext().getAuthentication().getName();
                User performedBy = userRepository.findByEmail(currentPrincipalName)
                                .orElseThrow(() -> new RuntimeException("Current user not found"));

                historyLogService.logActivity(
                                EntityType.PROJECT,
                                "DELETE",
                                "Deleted Project: " + project.getProjectName(),
                                performedBy);

                // Preserve history: Detach history logs (track record) from the project
                List<HistoryLog> logs = historyLogRepository.findByProject_ProjectId(projectId);
                for (HistoryLog log : logs) {
                        log.setProject(null);
                        historyLogRepository.save(log);
                }

                // Delete all assignments associated with this project
                resourceAssignmentRepository.deleteByProject_ProjectId(projectId);

                // Delete the project
                projectRepository.delete(project);
        }
}
