package com.resourceManagement.controller.project;

import com.resourceManagement.model.entity.HistoryLog;
import com.resourceManagement.service.project.HistoryLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.resourceManagement.dto.history.HistoryLogResponse;

@RestController
@RequestMapping("/api/history-logs")
@RequiredArgsConstructor
public class HistoryLogController {

    private final HistoryLogService historyLogService;

    @GetMapping
    public ResponseEntity<List<HistoryLogResponse>> getAllHistoryLogs() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        List<HistoryLogResponse> logs = historyLogService.getAllLogs(email);
        return ResponseEntity.ok(logs);
    }
}
