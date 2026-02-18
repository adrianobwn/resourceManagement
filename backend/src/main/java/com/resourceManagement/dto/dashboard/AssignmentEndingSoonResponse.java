package com.resourceManagement.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentEndingSoonResponse {
    private Integer assignmentId;
    private Integer projectId;
    private String resourceName;
    private String projectRole;
    private String projectName;
    private LocalDate endDate;
    private long daysLeft;
}
