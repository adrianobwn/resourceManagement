package com.resourceManagement.model.entity;

import com.resourceManagement.model.enums.ResourceLevel;
import com.resourceManagement.model.enums.ResourceStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resource_id")
    private Integer resourceId;

    @Column(nullable = false)
    private String resourceName;

    @Column(nullable = true)
    private String employeeId;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ResourceLevel level = ResourceLevel.ABT;

    // Nullable in the schema so the 30 rows that predate this column still load;
    // the API requires one on every create and update.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporting_manager_id")
    private Resource reportingManager;
}
