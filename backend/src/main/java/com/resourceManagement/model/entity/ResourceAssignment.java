package com.resourceManagement.model.entity;

import com.resourceManagement.model.enums.AssignmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "resource_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_id")
    private Integer assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String projectRole;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status;
}
