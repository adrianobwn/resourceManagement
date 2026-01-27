package com.resourceManagement.dto.project;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResourceDto {
    private String resourceName;
    private String projectRole;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer assignmentId;
}
