package com.resourceManagement.model.entity;

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

    @Column(nullable = false, unique = true)
    private String employeeId;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status;
}
