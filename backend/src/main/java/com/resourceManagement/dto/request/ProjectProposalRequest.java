package com.resourceManagement.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class ProjectProposalRequest {
    private String projectName;
    private String clientName;
    private String description;
    private List<ResourcePlanItem> resourcePlan;

    @Data
    public static class ResourcePlanItem {
        private Integer resourceId;
        private String role;
        private LocalDate startDate;
        private LocalDate endDate;
    }
}
