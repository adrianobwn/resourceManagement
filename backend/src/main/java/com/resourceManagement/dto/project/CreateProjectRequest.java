package com.resourceManagement.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    private String projectName;

    @NotBlank(message = "Client name is required")
    private String clientName;

    @NotNull(message = "DevMan ID is required")
    private Integer pmId;
}
