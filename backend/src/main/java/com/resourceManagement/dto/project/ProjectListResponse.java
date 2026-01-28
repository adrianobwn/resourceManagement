package com.resourceManagement.dto.project;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectListResponse {
    private Integer projectId;
    private String projectName;
    private String clientName;
    private String devManName;
    private Integer devManId;
    private Integer memberCount;
    private String status;
}
