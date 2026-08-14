package com.resourceManagement.controller.notification;

import com.resourceManagement.dto.notification.NotificationResponse;
import com.resourceManagement.model.entity.Notification;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.repository.UserRepository;
import com.resourceManagement.service.project.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications() {
        List<NotificationResponse> responses = notificationService
                .getNotificationsForUser(currentUser().getUserId())
                .stream()
                .map(n -> NotificationResponse.builder()
                        .notificationId(n.getNotificationId())
                        .type(n.getType().name())
                        .message(n.getMessage())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Drives the sidebar badges. "count" is every unread notification
     * (Notifications menu); "activities" counts only approve/reject outcomes,
     * which is what the Activities page shows.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount() {
        List<Notification> unread = notificationService.getUnreadNotificationsForUser(currentUser().getUserId());
        long activities = unread.stream().filter(n -> n.getType().isActivity()).count();
        return ResponseEntity.ok(Map.of(
                "count", unread.size() - (int) activities,
                "activities", (int) activities));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Integer id) {
        notificationService.markAsRead(id, currentUser().getUserId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead(currentUser().getUserId());
        return ResponseEntity.noContent().build();
    }

    /** Opening the Activities page clears only the approve/reject badge. */
    @PatchMapping("/read-activities")
    public ResponseEntity<Void> markActivitiesAsRead() {
        notificationService.markActivitiesAsRead(currentUser().getUserId());
        return ResponseEntity.noContent().build();
    }
}
