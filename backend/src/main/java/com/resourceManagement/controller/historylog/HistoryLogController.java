package com.resourceManagement.controller.historylog;

import com.resourceManagement.model.entity.HistoryLog;
import com.resourceManagement.service.project.HistoryLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/history-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HistoryLogController {

    private final HistoryLogService historyLogService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllLogs() {
        List<HistoryLog> logs = historyLogService.getAllLogs();

        List<Map<String, Object>> response = logs.stream().map(log -> {
            Map<String, Object> logMap = new HashMap<>();
            logMap.put("logId", log.getLogId());
            logMap.put("entityType", log.getEntityType().name());
            logMap.put("activityType", log.getActivityType());
            logMap.put("projectName", log.getProjectName());
            logMap.put("resourceName", log.getResourceName());
            logMap.put("resourceRole", log.getResourceRole());
            logMap.put("assignmentStartDate", log.getAssignmentStartDate());
            logMap.put("assignmentEndDate", log.getAssignmentEndDate());
            logMap.put("description", log.getDescription());
            logMap.put("performedBy", log.getPerformedBy().getName());
            logMap.put("timestamp", log.getTimestamp());
            return logMap;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
