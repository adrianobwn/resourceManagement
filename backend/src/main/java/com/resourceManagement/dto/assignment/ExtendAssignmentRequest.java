package com.resourceManagement.dto.assignment;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtendAssignmentRequest {
    @NotNull(message = "Assignment ID is required")
    private Integer assignmentId;

    @NotNull(message = "New end date is required")
    private LocalDate newEndDate;

    private String reason;
}
