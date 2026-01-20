package com.resourceManagement.service.project;

import com.resourceManagement.model.entity.Notification;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.NotificationType;
import com.resourceManagement.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void createNotification(User recipient, NotificationType type, String message) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForUser(Integer userId) {
        return notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotificationsForUser(Integer userId) {
        return notificationRepository.findByRecipient_UserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElseThrow();
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
}