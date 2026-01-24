package com.resourceManagement.dto.request;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AssignmentRequestResponse {
    private Integer id;
    private String type; // EXTEND, RELEASE
    private String status;
    private String requester;
    private String resource;
    private String project;
    private String role;
    
    // Dates
    private LocalDate currentEndDate;
    private LocalDate startDate;
    private LocalDate newEndDate;
    // For Release, newEndDate is releaseDate.
    
    // Calculation fields for frontend?
    // Frontend calculates "Extension Months" or "Early Release Months".
    // I provide raw dates.
    
    // For Project Request? (Not implementing yet).
    private String projectName; // For NEW PROJECT request.
    private String clientName;
    private String description;
    
    private String reason;
    private LocalDateTime submittedDate;
    
    private java.util.List<ResourcePlanItem> resourcePlan;

    @Data
    @Builder
    public static class ResourcePlanItem {
        private String name;
        private String role;
        private LocalDate startDate;
        private LocalDate endDate;
    }
}
