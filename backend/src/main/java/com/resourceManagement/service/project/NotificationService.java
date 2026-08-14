package com.resourceManagement.service.project;

import com.resourceManagement.model.entity.Notification;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.NotificationType;
import com.resourceManagement.model.enums.UserType;
import com.resourceManagement.repository.NotificationRepository;
import com.resourceManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /** Requests are addressed to whoever is on duty, so every Admin is notified. */
    public void notifyAllAdmins(NotificationType type, String message) {
        userRepository.findByUserType(UserType.Admin)
                .forEach(admin -> createNotification(admin, type, message));
    }

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

    /** recipientId is checked so a user cannot mark someone else's notification. */
    public void markAsRead(Integer notificationId, Integer recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getRecipient().getUserId().equals(recipientId)) {
            throw new RuntimeException("Notification does not belong to the current user");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /** Clears the Activities badge: approve/reject outcomes only. */
    public void markActivitiesAsRead(Integer recipientId) {
        markRead(recipientId, n -> n.getType().isActivity());
    }

    /** Clears the Notifications badge, leaving the Activities one alone. */
    public void markAllAsRead(Integer recipientId) {
        markRead(recipientId, n -> !n.getType().isActivity());
    }

    private void markRead(Integer recipientId, java.util.function.Predicate<Notification> matches) {
        List<Notification> unread = notificationRepository.findByRecipient_UserIdAndIsReadFalse(recipientId)
                .stream()
                .filter(matches)
                .toList();
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}