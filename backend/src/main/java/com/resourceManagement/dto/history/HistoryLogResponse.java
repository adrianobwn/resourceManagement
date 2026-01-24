package com.resourceManagement.dto.history;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class HistoryLogResponse {
    private Integer logId;
    private String entityType;
    private String activityType;
    private String projectName;
    private String resourceName;
    private String resourceRole;
    private String description;
    private String performedBy;
    private LocalDateTime timestamp;
}
