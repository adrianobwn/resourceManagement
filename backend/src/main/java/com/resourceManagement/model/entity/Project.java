package com.resourceManagement.model.entity;

import com.resourceManagement.model.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Integer projectId;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String clientName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pm_id", nullable = false)
    private User pm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status;
}
