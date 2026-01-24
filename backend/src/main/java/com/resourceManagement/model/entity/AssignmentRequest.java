package com.resourceManagement.model.entity;

import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.model.enums.RequestType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;

@Entity
@Table(name = "assignment_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer requestId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = true)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = true)
    private Resource resource;
    
    // For Project Proposal
    private String projectName;
    private String clientName;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "assignmentRequest", cascade = CascadeType.ALL)
    private Collection<ProjectRequestResource> resourcePlan;
    
    // Original Assignment ID (for Extend/Release)
    private Integer assignmentId;

    // For Assign
    private String role;
    private LocalDate startDate;
    private LocalDate endDate;

    // For Extend/Release
    private LocalDate newEndDate;
    private LocalDate currentEndDate;
    
    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
