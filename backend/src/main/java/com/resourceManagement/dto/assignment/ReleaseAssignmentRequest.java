package com.resourceManagement.dto.assignment;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReleaseAssignmentRequest {
    @NotNull(message = "Assignment ID is required")
    private Integer assignmentId;

    @NotNull(message = "Release date is required")
    private LocalDate releaseDate;

    private String reason;
}
