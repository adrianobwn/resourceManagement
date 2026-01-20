package com.resourceManagement.model.entity;

import com.resourceManagement.model.enums.EntityType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "history_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntityType entityType;

    @Column(nullable = false)
    private String activityType;

    @Column(nullable = false, length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by", nullable = false)
    private User performedBy;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
