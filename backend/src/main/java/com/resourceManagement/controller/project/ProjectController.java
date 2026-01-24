package com.resourceManagement.controller.project;

import com.resourceManagement.dto.project.CreateProjectRequest;
import com.resourceManagement.dto.project.ProjectListResponse;
import com.resourceManagement.service.project.ProjectService;
import jakarta.validation.Valid;
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

    @PostMapping
    public ResponseEntity<ProjectListResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        ProjectListResponse project = projectService.createProject(request);
        return ResponseEntity.ok(project);
    }

    @GetMapping("/{projectId}/resources")
    public ResponseEntity<List<com.resourceManagement.dto.project.ProjectResourceDto>> getProjectResources(
            @PathVariable Integer projectId) {
        return ResponseEntity.ok(projectService.getProjectResources(projectId));
    }

    @PutMapping("/{projectId}/status")
    public ResponseEntity<Void> updateProjectStatus(@PathVariable Integer projectId, @RequestParam String status) {
        projectService.updateProjectStatus(projectId, status);
        return ResponseEntity.ok().build();
    }
}
