package com.resourceManagement.repository;

import com.resourceManagement.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByRecipient_UserIdOrderByCreatedAtDesc(Integer recipientId);

    List<Notification> findByRecipient_UserIdAndIsReadFalse(Integer recipientId);

    void deleteByRecipient_UserId(Integer recipientId);
}
