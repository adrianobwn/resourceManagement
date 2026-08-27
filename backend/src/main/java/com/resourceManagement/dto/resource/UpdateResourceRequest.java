package com.resourceManagement.dto.resource;

import com.resourceManagement.model.enums.ResourceLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateResourceRequest {
    @NotBlank(message = "Resource name is required")
    private String resourceName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotNull(message = "Level is required")
    private ResourceLevel level;

    /** Optional: clearing it is allowed. */
    private Integer reportingManagerId;
}
