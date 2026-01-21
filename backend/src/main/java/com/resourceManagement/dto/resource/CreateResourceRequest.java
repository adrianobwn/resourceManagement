package com.resourceManagement.dto.resource;

import com.resourceManagement.model.enums.ResourceStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateResourceRequest {
    
    @NotBlank(message = "Resource name is required")
    private String resourceName;
    
    @NotBlank(message = "Employee ID is required")
    private String employeeId;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotNull(message = "Status is required")
    private ResourceStatus status;
}
