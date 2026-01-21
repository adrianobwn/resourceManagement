package com.resourceManagement.controller.project;

import com.resourceManagement.dto.project.ProjectListResponse;
import com.resourceManagement.service.project.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectListResponse>> getAllProjects() {
        List<ProjectListResponse> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }
}
