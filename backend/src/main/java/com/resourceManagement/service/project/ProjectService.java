package com.resourceManagement.service.project;

import com.resourceManagement.dto.project.ProjectListResponse;
import com.resourceManagement.model.entity.Project;
import com.resourceManagement.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    public List<ProjectListResponse> getAllProjects() {
        List<Project> projects = projectRepository.findAll();
        return projects.stream()
                .map(this::mapToProjectListResponse)
                .collect(Collectors.toList());
    }

    private ProjectListResponse mapToProjectListResponse(Project project) {
        return ProjectListResponse.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .clientName(project.getClientName())
                .status(project.getStatus().name())
                .build();
    }
}
