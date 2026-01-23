package com.resourceManagement.controller.dashboard;

import com.resourceManagement.dto.dashboard.ActiveProjectResponse;
import com.resourceManagement.dto.dashboard.AssignmentEndingSoonResponse;
import com.resourceManagement.dto.dashboard.DashboardStatsResponse;
import com.resourceManagement.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        DashboardStatsResponse stats = dashboardService.getStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/assignments-ending-soon")
    public ResponseEntity<List<AssignmentEndingSoonResponse>> getAssignmentsEndingSoon(
            @RequestParam(defaultValue = "7") int days) {
        List<AssignmentEndingSoonResponse> assignments = dashboardService.getAssignmentsEndingSoon(days);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/active-projects")
    public ResponseEntity<List<ActiveProjectResponse>> getActiveProjects() {
        List<ActiveProjectResponse> projects = dashboardService.getActiveProjects();
        return ResponseEntity.ok(projects);
    }
}
