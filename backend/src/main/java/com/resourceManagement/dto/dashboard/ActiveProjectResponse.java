package com.resourceManagement.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveProjectResponse {
    private Integer projectId;
    private String projectName;
    private String clientName;
    private String status;
    private long memberCount;
}
