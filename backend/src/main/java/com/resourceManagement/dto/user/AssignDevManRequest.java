package com.resourceManagement.dto.user;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignDevManRequest {

    @NotNull(message = "Resource is required")
    private Integer resourceId;

    @NotNull(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
