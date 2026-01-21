package com.resourceManagement.dto.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignResourceRequest {
    
    @NotNull(message = "Resource ID is required")
    private Integer resourceId;
    
    @NotNull(message = "Project ID is required")
    private Integer projectId;
    
    @NotBlank(message = "Project role is required")
    private String projectRole;
    
    @NotBlank(message = "Start date is required")
    private String startDate;
    
    @NotBlank(message = "End date is required")
    private String endDate;
}
