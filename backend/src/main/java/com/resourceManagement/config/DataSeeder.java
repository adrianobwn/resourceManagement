package com.resourceManagement.config;

import com.resourceManagement.model.entity.*;
import com.resourceManagement.model.enums.*;
import com.resourceManagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

        private final UserRepository userRepository;
        private final ResourceRepository resourceRepository;
        private final ProjectRepository projectRepository;
        private final ResourceAssignmentRepository assignmentRepository;
        private final AssignmentRequestRepository requestRepository;
        private final PasswordEncoder passwordEncoder;

        @Bean
        public CommandLineRunner seedData() {
                return args -> {
                        // Check if we have enough data (e.g. at least 10 items), if so skip massive
                        // seeding
                        // But if user asks again, it might mean they want more or fresh.
                        // Let's rely on checking if "Manager 1" exists as a heuristic for dummy data
                        // presence.
                        if (userRepository.count() >= 15 && resourceRepository.count() >= 10) {
                                System.out.println("Data looks sufficient. Skipping massive seeding.");
                                return;
                        }

                        System.out.println("Seeding dummy data (10 of each)...");

                        // 1. Seed Users (Ensure 10 Users)
                        // We need Admin + Managers
                        createUserIfNotExist("Admin User", "admin@company.com", "password", UserType.ADMIN);

                        // Create 10 Managers/Users
                        List<User> managers = new ArrayList<>();
                        for (int i = 1; i <= 10; i++) {
                                User m = createUserIfNotExist("Manager " + i, "manager" + i + "@company.com",
                                                "password", UserType.DEV_MANAGER);
                                if (m != null)
                                        managers.add(m);
                        }
                        // Add some specific named ones if requested before, but loop covers general
                        // need.

                        // 2. Seed Resources (10 Resources)
                        List<Resource> resources = new ArrayList<>();
                        for (int i = 1; i <= 10; i++) {
                                // Default to AVAILABLE, will be updated if assigned to active project
                                Resource r = createResourceIfNotExist("Employee " + i, "EMP0" + i,
                                                "emp" + i + "@company.com", ResourceStatus.AVAILABLE);
                                if (r != null)
                                        resources.add(r);
                        }

                        // 3. Seed Projects (10 Projects)
                        List<Project> projects = new ArrayList<>();
                        if (!managers.isEmpty()) {
                                for (int i = 1; i <= 10; i++) {
                                        User pm = managers.get(i % managers.size());
                                        // Cycle through statuses: ON_GOING, HOLD, CLOSED, COMPLETED
                                        ProjectStatus status;
                                        int mod = i % 4;
                                        if (mod == 0)
                                                status = ProjectStatus.ON_GOING;
                                        else if (mod == 1)
                                                status = ProjectStatus.HOLD;
                                        else if (mod == 2)
                                                status = ProjectStatus.CLOSED;
                                        else
                                                status = ProjectStatus.COMPLETED;

                                        projects.add(createProject("Project " + i, "Client " + i, pm, status));
                                }
                        }

                        // 4. Seed Assignments (10 Assignments)
                        // Map resources to projects
                        if (!resources.isEmpty() && !projects.isEmpty()) {
                                for (int i = 0; i < 10; i++) {
                                        Resource r = resources.get(i % resources.size());
                                        Project p = projects.get(i % projects.size());

                                        // Set assignment status based on project status
                                        AssignmentStatus assignmentStatus = AssignmentStatus.ACTIVE;
                                        if (p.getStatus() == ProjectStatus.CLOSED
                                                        || p.getStatus() == ProjectStatus.COMPLETED) {
                                                assignmentStatus = AssignmentStatus.RELEASED;
                                        }

                                        // Create assignment
                                        createAssignment(r, p, "Role " + i, LocalDate.now().minusMonths(i + 2),
                                                        LocalDate.now().plusMonths(i + 1), assignmentStatus);

                                        // Update resource status ONLY if assignment is active
                                        if (assignmentStatus == AssignmentStatus.ACTIVE) {
                                                r.setStatus(ResourceStatus.ASSIGNED);
                                                resourceRepository.save(r);
                                        }
                                }
                        }

                        // 5. Seed Requests (10 Requests)
                        if (!resources.isEmpty() && !projects.isEmpty() && !managers.isEmpty()) {
                                User requester = managers.get(0);
                                for (int i = 1; i <= 10; i++) {
                                        RequestType type = (i % 3 == 0) ? RequestType.EXTEND
                                                        : (i % 3 == 1) ? RequestType.RELEASE : RequestType.PROJECT;

                                        if (type == RequestType.PROJECT) {
                                                createProjectRequest(requester, "New Project Proposal " + i,
                                                                "Client " + i, "Description " + i, null);
                                        } else {
                                                Project p = projects.get(i % projects.size());
                                                Resource r = resources.get(i % resources.size());
                                                if (type == RequestType.EXTEND) {
                                                        createExtendRequest(requester, p, r,
                                                                        LocalDate.now().plusDays(i),
                                                                        LocalDate.now().plusMonths(i), "Reason " + i);
                                                } else {
                                                        createReleaseRequest(requester, p, r,
                                                                        LocalDate.now().plusMonths(i),
                                                                        LocalDate.now().plusWeeks(i),
                                                                        "Release Reason " + i);
                                                }
                                        }
                                }
                        }

                        System.out.println("Data seeding completed successfully!");
                };
        }

        private User createUserIfNotExist(String name, String email, String rawPassword, UserType type) {
                if (userRepository.findByEmail(email).isPresent()) {
                        return userRepository.findByEmail(email).get();
                }
                User user = User.builder()
                                .name(name)
                                .email(email)
                                .password(passwordEncoder.encode(rawPassword))
                                .userType(type)
                                .accountStatus(AccountStatus.ACTIVE)
                                .build();
                return userRepository.save(user);
        }

        private Resource createResourceIfNotExist(String name, String empId, String email, ResourceStatus status) {
                // Simple check if email exists to avoid unique constraint violation
                try {
                        // Optimistic save, in real app maybe check email first
                        Resource resource = Resource.builder()
                                        .resourceName(name)
                                        .employeeId(empId)
                                        .email(email)
                                        .status(status)
                                        .build();
                        return resourceRepository.save(resource);
                } catch (Exception e) {
                        return null; // Assume exists
                }
        }

        private Project createProject(String name, String client, User pm, ProjectStatus status) {
                Project project = Project.builder()
                                .projectName(name)
                                .clientName(client)
                                .pm(pm)
                                .status(status)
                                .build();
                return projectRepository.save(project);
        }

        private void createAssignment(Resource resource, Project project, String role, LocalDate start, LocalDate end,
                        AssignmentStatus status) {
                ResourceAssignment assignment = ResourceAssignment.builder()
                                .resource(resource)
                                .project(project)
                                .projectRole(role)
                                .startDate(start)
                                .endDate(end)
                                .status(status)
                                .build();
                assignmentRepository.save(assignment);
        }

        private void createExtendRequest(User requester, Project project, Resource resource, LocalDate currentEnd,
                        LocalDate newEnd, String reason) {
                AssignmentRequest request = AssignmentRequest.builder()
                                .requester(requester)
                                .project(project)
                                .resource(resource)
                                .requestType(RequestType.EXTEND)
                                .status(RequestStatus.PENDING)
                                .currentEndDate(currentEnd)
                                .newEndDate(newEnd)
                                .reason(reason)
                                .build();
                requestRepository.save(request);
        }

        private void createReleaseRequest(User requester, Project project, Resource resource, LocalDate originalEnd,
                        LocalDate newEnd, String reason) {
                AssignmentRequest request = AssignmentRequest.builder()
                                .requester(requester)
                                .project(project)
                                .resource(resource)
                                .requestType(RequestType.RELEASE)
                                .status(RequestStatus.PENDING)
                                .currentEndDate(originalEnd)
                                .newEndDate(newEnd)
                                .reason(reason)
                                .build();
                requestRepository.save(request);
        }

        private void createProjectRequest(User requester, String projectName, String clientName, String description,
                        List<ProjectRequestResource> resources) {
                AssignmentRequest request = AssignmentRequest.builder()
                                .requester(requester)
                                .requestType(RequestType.PROJECT)
                                .status(RequestStatus.PENDING)
                                .projectName(projectName)
                                .clientName(clientName)
                                .description(description)
                                .build();

                if (resources != null) {
                        resources.forEach(r -> r.setAssignmentRequest(request));
                        request.setResourcePlan(resources);
                }

                requestRepository.save(request);
        }
}
