package com.resourceManagement.service.project;

import com.resourceManagement.model.entity.HistoryLog;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.EntityType;
import com.resourceManagement.repository.HistoryLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoryLogService {

    private final HistoryLogRepository historyLogRepository;
    private final com.resourceManagement.repository.UserRepository userRepository;

    public void logActivity(EntityType entityType, String activityType, String description, User performedBy) {
        logActivity(entityType, activityType, description, performedBy, null);
    }

    public void logActivity(EntityType entityType, String activityType, String description, User performedBy, com.resourceManagement.model.entity.Project project) {
        logActivity(entityType, activityType, description, performedBy, project, null, null);
    }

    public void logActivity(EntityType entityType, String activityType, String description, User performedBy, 
                           com.resourceManagement.model.entity.Project project, 
                           com.resourceManagement.model.entity.Resource resource,
                           String role) {
        HistoryLog log = HistoryLog.builder()
                .entityType(entityType)
                .activityType(activityType)
                .description(description)
                .performedBy(performedBy)
                .project(project)
                .resource(resource)
                .resourceRole(role)
                .timestamp(LocalDateTime.now())
                .build();
        historyLogRepository.save(log);
    }

    public List<com.resourceManagement.dto.history.HistoryLogResponse> getAllLogs(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<HistoryLog> logs;
        if (user.getUserType() == com.resourceManagement.model.enums.UserType.ADMIN) {
            logs = historyLogRepository.findAllByOrderByTimestampDesc();
        } else {
            logs = historyLogRepository.findByPerformedBy_UserIdOrProject_DevMan_UserIdOrderByTimestampDesc(user.getUserId(), user.getUserId());
        }

        return logs.stream().map(this::mapToResponse).collect(java.util.stream.Collectors.toList());
    }

    private com.resourceManagement.dto.history.HistoryLogResponse mapToResponse(HistoryLog log) {
        return com.resourceManagement.dto.history.HistoryLogResponse.builder()
                .logId(log.getLogId())
                .entityType(log.getEntityType().name())
                .activityType(log.getActivityType())
                .projectName(log.getProject() != null ? log.getProject().getProjectName() : null)
                .resourceName(log.getResource() != null ? log.getResource().getResourceName() : null)
                .resourceRole(log.getResourceRole())
                .description(log.getDescription())
                .performedBy(log.getPerformedBy().getName())
                .timestamp(log.getTimestamp())
                .build();
    }

    public List<HistoryLog> getLogsByEntityType(String entityType) {
        return historyLogRepository.findByEntityTypeOrderByTimestampDesc(entityType);
    }
}