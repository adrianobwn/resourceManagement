package com.resourceManagement.dto.notification;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Integer notificationId;
    private String type;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
