package com.resourceManagement.dto.resource;

import com.resourceManagement.model.enums.ResourceStatus;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceResponse {
    private Integer resourceId;
    private String resourceName;
    private String employeeId;
    private String email;
    private ResourceStatus status;
    private Integer projectCount;
    private List<AssignmentInfo> currentAssignments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentInfo {
        private Integer assignmentId;
        private Integer projectId;
        private String projectName;
        private String projectRole;
        private String startDate;
        private String endDate;
        private String assignmentStatus;
        private String projectStatus;
    }
}
