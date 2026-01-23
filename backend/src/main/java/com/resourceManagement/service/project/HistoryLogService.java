package com.resourceManagement.service.project;

import com.resourceManagement.model.entity.HistoryLog;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.EntityType;
import com.resourceManagement.repository.HistoryLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoryLogService {

    private final HistoryLogRepository historyLogRepository;

    public void logActivity(EntityType entityType, String activityType, String description, User performedBy) {
        HistoryLog log = HistoryLog.builder()
                .entityType(entityType)
                .activityType(activityType)
                .description(description)
                .performedBy(performedBy)
                .timestamp(LocalDateTime.now())
                .build();
        historyLogRepository.save(log);
    }

    public void logActivity(EntityType entityType, String activityType, String projectName,
            String resourceName, String resourceRole,
            LocalDate startDate, LocalDate endDate,
            String description, User performedBy) {
        HistoryLog log = HistoryLog.builder()
                .entityType(entityType)
                .activityType(activityType)
                .projectName(projectName)
                .resourceName(resourceName)
                .resourceRole(resourceRole)
                .assignmentStartDate(startDate)
                .assignmentEndDate(endDate)
                .description(description)
                .performedBy(performedBy)
                .timestamp(LocalDateTime.now())
                .build();
        historyLogRepository.save(log);
    }

    public List<HistoryLog> getAllLogs() {
        return historyLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<HistoryLog> getLogsByUser(Integer userId) {
        return historyLogRepository.findByPerformedBy_UserIdOrderByTimestampDesc(userId);
    }

    public List<HistoryLog> getLogsByEntityType(EntityType entityType) {
        return historyLogRepository.findByEntityTypeOrderByTimestampDesc(entityType);
    }
}