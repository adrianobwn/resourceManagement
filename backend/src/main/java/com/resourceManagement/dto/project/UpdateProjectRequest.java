package com.resourceManagement.dto.project;

import com.resourceManagement.model.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProjectRequest {
    @NotBlank(message = "Project name is required")
    private String projectName;

    @NotBlank(message = "Client name is required")
    private String clientName;

    @NotNull(message = "Status is required")
    private ProjectStatus status;
}
