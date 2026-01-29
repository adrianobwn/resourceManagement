package com.resourceManagement.dto.resource;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
}
