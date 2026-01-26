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
        private final HistoryLogRepository historyLogRepository;

        @Bean
        public CommandLineRunner seedData() {
                return args -> {
                        // Clear existing data to ensure clean state with new realistic data
                        requestRepository.deleteAll();
                        assignmentRepository.deleteAll();
                        historyLogRepository.deleteAll();
                        projectRepository.deleteAll();
                        resourceRepository.deleteAll();
                        userRepository.deleteAll();

                        System.out.println("Seeding realistic data...");

                        // 1. Seed Users (Admin + Managers)
                        User admin = createUser("Admin", "admin@inteleq.com", "password", UserType.ADMIN);

                        List<User> managers = new ArrayList<>();
                        managers.add(createUser("Budi Santoso", "budi.santoso@inteleq.com", "password",
                                        UserType.DEV_MANAGER));
                        managers.add(createUser("Siti Aminah", "siti.aminah@inteleq.com", "password",
                                        UserType.DEV_MANAGER));
                        managers.add(createUser("Rudi Hermawan", "rudi.hermawan@inteleq.com", "password",
                                        UserType.DEV_MANAGER));

                        // 2. Seed Resources (Employees)
                        List<Resource> resources = new ArrayList<>();
                        resources.add(createResource("Andi Wijaya", "EMP001", "andi.wijaya@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("Java", "Spring Boot", "MySQL")));
                        resources.add(createResource("Rina Kartika", "EMP002", "rina.kartika@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("React", "Tailwind", "JavaScript")));
                        resources.add(createResource("Dewi Lestari", "EMP003", "dewi.lestari@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("QA", "Selenium", "JIRA")));
                        resources.add(createResource("Eko Prasetyo", "EMP004", "eko.prasetyo@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("Python", "Django", "PostgreSQL")));
                        resources.add(createResource("Fajar Nugroho", "EMP005", "fajar.nugroho@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("Java", "Microservices", "Docker")));
                        resources.add(createResource("Gita Permata", "EMP006", "gita.permata@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("UI/UX", "Figma", "CSS")));
                        resources.add(createResource("Hendra Gunawan", "EMP007", "hendra.gunawan@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("DevOps", "AWS", "Kubernetes")));
                        resources.add(createResource("Indah Sari", "EMP008", "indah.sari@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("Business Analyst", "Scrum", "Agile")));
                        resources.add(createResource("Joko Susilo", "EMP009", "joko.susilo@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("Node.js", "Express", "MongoDB")));
                        resources.add(createResource("Kartini Putri", "EMP010", "kartini.putri@inteleq.com",
                                        ResourceStatus.AVAILABLE, Arrays.asList("Mobile", "Flutter", "Dart")));

                        // 3. Seed Projects
                        List<Project> projects = new ArrayList<>();
                        projects.add(createProject("Mobile Banking App", "Bank Central Asia", managers.get(0),
                                        ProjectStatus.ON_GOING));
                        projects.add(createProject("HR Management System", "Telkom Indonesia", managers.get(1),
                                        ProjectStatus.ON_GOING));
                        projects.add(createProject("E-Commerce Platform", "Tokopedia", managers.get(2),
                                        ProjectStatus.HOLD));
                        projects.add(createProject("Supply Chain Analytics", "Indofood", managers.get(0),
                                        ProjectStatus.CLOSED));
                        projects.add(createProject("Telemedicine App", "Halodoc", managers.get(1),
                                        ProjectStatus.ON_GOING));
                        projects.add(createProject("Government Portal", "Kominfo", managers.get(2),
                                        ProjectStatus.CLOSED));

                        // 4. Seed Assignments & Update Resource Status
                        // Mobile Banking App (3 resources)
                        createAssignment(resources.get(0), projects.get(0), "Backend Lead",
                                        LocalDate.now().minusMonths(3), LocalDate.now().plusMonths(6),
                                        AssignmentStatus.ACTIVE);
                        createAssignment(resources.get(1), projects.get(0), "Frontend Developer",
                                        LocalDate.now().minusMonths(3), LocalDate.now().plusMonths(6),
                                        AssignmentStatus.ACTIVE);
                        createAssignment(resources.get(2), projects.get(0), "QA Engineer",
                                        LocalDate.now().minusMonths(2), LocalDate.now().plusMonths(4),
                                        AssignmentStatus.ACTIVE);

                        // HR System (2 resources)
                        createAssignment(resources.get(4), projects.get(1), "Backend Developer",
                                        LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(5),
                                        AssignmentStatus.ACTIVE);
                        createAssignment(resources.get(5), projects.get(1), "UI Designer",
                                        LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(2),
                                        AssignmentStatus.ACTIVE);

                        // Telemedicine App (1 resource)
                        createAssignment(resources.get(9), projects.get(4), "Mobile Developer",
                                        LocalDate.now().minusWeeks(2), LocalDate.now().plusMonths(10),
                                        AssignmentStatus.ACTIVE);

                        // Past assignments (Closed Project)
                        createAssignment(resources.get(3), projects.get(3), "Python Developer",
                                        LocalDate.now().minusMonths(8), LocalDate.now().minusMonths(1),
                                        AssignmentStatus.RELEASED);
                        createAssignment(resources.get(6), projects.get(5), "DevOps Engineer",
                                        LocalDate.now().minusMonths(12), LocalDate.now().minusMonths(2),
                                        AssignmentStatus.RELEASED);

                        // 5. Seed Requests
                        // Extend Request for Rina Kartika on Mobile Banking
                        createExtendRequest(managers.get(0), projects.get(0), resources.get(1),
                                        LocalDate.now().plusMonths(6), LocalDate.now().plusMonths(9),
                                        "Feature development phase extended due to new requirements.");

                        // Release Request for Dewi Lestari on Mobile Banking (Early release)
                        createReleaseRequest(managers.get(0), projects.get(0), resources.get(2),
                                        LocalDate.now().plusMonths(4), LocalDate.now().plusWeeks(2),
                                        "QA phase completed earlier than expected.");

                        // New Project Request
                        createProjectRequest(managers.get(2), "IoT Dashboard", "PLN",
                                        "Development of IoT dashboard for smart meter monitoring.", null);

                        System.out.println("Realistic data seeding completed successfully!");
                };
        }

        private User createUser(String name, String email, String rawPassword, UserType type) {
                User user = User.builder()
                                .name(name)
                                .email(email)
                                .password(passwordEncoder.encode(rawPassword))
                                .userType(type)
                                .accountStatus(AccountStatus.ACTIVE)
                                .build();
                return userRepository.save(user);
        }

        private Resource createResource(String name, String empId, String email, ResourceStatus status,
                        List<String> skills) {
                Resource resource = Resource.builder()
                                .resourceName(name)
                                .employeeId(empId)
                                .email(email)
                                .status(status)
                                .skills(skills)
                                .build();
                return resourceRepository.save(resource);
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

                // Update resource status if active assignment
                if (status == AssignmentStatus.ACTIVE) {
                        resource.setStatus(ResourceStatus.ASSIGNED);
                        resourceRepository.save(resource);
                }
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
