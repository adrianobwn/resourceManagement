package com.resourceManagement.service.project;


import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.ProjectRequest;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.EntityType;
import com.resourceManagement.model.enums.NotificationType;
import com.resourceManagement.model.enums.ProjectStatus;
import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.repository.ProjectRepository;
import com.resourceManagement.repository.ProjectRequestRepository;
import com.resourceManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectRequestService {

    private final ProjectRequestRepository requestRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final HistoryLogService historyLogService;

    public ProjectRequest createProjectRequest(ProjectRequest request, User requestedBy) {
        request.setRequestedBy(requestedBy);
        request.setStatus(RequestStatus.PENDING);
        request.setRequestedAt(LocalDateTime.now());
        ProjectRequest savedRequest = requestRepository.save(request);

        // Notify Admin
        List<User> admins = userRepository.findAll().stream()
                .filter(user -> user.getUserType().name().equals("Admin"))
                .toList();
        for (User admin : admins) {
            notificationService.createNotification(admin, NotificationType.PROJECT_REQUEST,
                    "New project request submitted by " + requestedBy.getName() + ": " + request.getProjectName());
        }

        // Log activity
        historyLogService.logActivity(EntityType.REQUEST, "CREATE", "Project request created: " + request.getProjectName(), requestedBy);

        return savedRequest;
    }

    public List<ProjectRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    public List<ProjectRequest> getRequestsByUser(Integer userId) {
        return requestRepository.findByRequestedBy_UserId(userId);
    }

    @Transactional
    public ProjectRequest approveProjectRequest(Integer requestId) {
        ProjectRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Project request not found"));

        request.setStatus(RequestStatus.APPROVED);
        requestRepository.save(request);

        // Create new Project
        Project project = Project.builder()
                .projectName(request.getProjectName())
                .clientName(request.getClientName())
                .devMan(request.getRequestedBy())
                .status(ProjectStatus.ONGOING)
                .build();

        projectRepository.save(project);

        // Notify PM
        notificationService.createNotification(request.getRequestedBy(), NotificationType.APPROVAL_RESULT,
                "Your project request '" + request.getProjectName() + "' has been APPROVED");

        // Log activity
        historyLogService.logActivity(EntityType.REQUEST, "APPROVE", "Project request approved: " + request.getProjectName(), request.getRequestedBy());

        return request;
    }

    @Transactional
    public ProjectRequest rejectProjectRequest(Integer requestId) {
        ProjectRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Project request not found"));

        request.setStatus(RequestStatus.REJECTED);
        requestRepository.save(request);

        // Notify PM
        notificationService.createNotification(request.getRequestedBy(), NotificationType.APPROVAL_RESULT,
                "Your project request '" + request.getProjectName() + "' has been REJECTED");

        // Log activity
        historyLogService.logActivity(EntityType.REQUEST, "REJECT", "Project request rejected: " + request.getProjectName(), request.getRequestedBy());

        return request;
    }
}
