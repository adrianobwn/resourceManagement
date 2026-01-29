package com.resourceManagement.config;

import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.*;
import com.resourceManagement.repository.ProjectRepository;
import com.resourceManagement.repository.ResourceAssignmentRepository;
import com.resourceManagement.repository.ResourceRepository;
import com.resourceManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

        private final UserRepository userRepository;
        private final ResourceRepository resourceRepository;
        private final ProjectRepository projectRepository;
        private final ResourceAssignmentRepository assignmentRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        @Transactional
        public void run(String... args) {
                // Migrate old ON_GOING status to ONGOING
                migrateProjectStatus();

                if (userRepository.findByEmail("admin@inteleq.com").isEmpty()) {
                        // 1. Create Admin
                        User admin = User.builder()
                                        .name("Admin")
                                        .email("admin@inteleq.com")
                                        .password(passwordEncoder.encode("password123"))
                                        .userType(UserType.Admin)
                                        .accountStatus(AccountStatus.ACTIVE)
                                        .build();
                        userRepository.save(admin);
                        System.out.println("Admin user created: admin@inteleq.com");

                        // 2. Create DevMans
                        createDevMan("Budi Santoso", "budi@inteleq.com");
                        createDevMan("Ani Wijaya", "ani@inteleq.com");
                        createDevMan("Chandra Irawan", "chandra@inteleq.com");
                        createDevMan("Dewi Sartika", "dewi@inteleq.com");

                        // 3. Create Resources
                        createResource("Eko Kurniawan", "eko@inteleq.com");
                        createResource("Siti Aminah", "siti@inteleq.com");
                        createResource("Rina Sulistya", "rina@inteleq.com");
                        createResource("Agus Pratama", "agus@inteleq.com");
                        createResource("Doni Setiawan", "doni@inteleq.com");
                        createResource("Fajar Nugroho", "fajar@inteleq.com");
                        createResource("Gita Pertiwi", "gita@inteleq.com");
                        createResource("Hadi Saputra", "hadi@inteleq.com");

                        // 4. Create Projects
                        createProject("E-Commerce Revamp", "budi@inteleq.com", "MegaShop Inc.", ProjectStatus.ONGOING);
                        createProject("Mobile Banking App", "ani@inteleq.com", "Bank Nasional", ProjectStatus.ONGOING);
                        createProject("Legacy System Migration", "chandra@inteleq.com", "OldCorp",
                                        ProjectStatus.ONGOING);
                        createProject("Internal HR Portal", "budi@inteleq.com", "Internal Inteleq",
                                        ProjectStatus.CLOSED);
                        createProject("AI Analytics Dashboard", "dewi@inteleq.com", "DataWiz", ProjectStatus.ONGOING);

                        // 5. Create Assignments
                        // Eko to E-Commerce (Active)
                        createAssignment("eko@inteleq.com", "E-Commerce Revamp", "Backend Lead",
                                        LocalDate.now().minusMonths(2), LocalDate.now().plusMonths(4));

                        // Siti to Mobile Banking (Active)
                        createAssignment("siti@inteleq.com", "Mobile Banking App", "Frontend Dev",
                                        LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(5));

                        // Rina to E-Commerce (Ending Tomorrow! - H-1 Notification Test)
                        createAssignment("rina@inteleq.com", "E-Commerce Revamp", "QA Engineer",
                                        LocalDate.now().minusMonths(3), LocalDate.now().plusDays(1));

                        // Agus to AI Analytics (Active)
                        createAssignment("agus@inteleq.com", "AI Analytics Dashboard", "Data Scientist",
                                        LocalDate.now().minusWeeks(2), LocalDate.now().plusMonths(3));

                        // Doni to Legacy System (Released/Past)
                        createAssignment("doni@inteleq.com", "Legacy System Migration", "DevOps Eng",
                                        LocalDate.now().minusMonths(6), LocalDate.now().minusMonths(1));

                        // Fajar to Mobile Banking (Active)
                        createAssignment("fajar@inteleq.com", "Mobile Banking App", "Mobile Dev",
                                        LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(2));
                }
        }

        private void createDevMan(String name, String email) {
                User devMan = User.builder()
                                .name(name)
                                .email(email)
                                .password(passwordEncoder.encode("password123"))
                                .userType(UserType.DEV_MANAGER)
                                .accountStatus(AccountStatus.ACTIVE)
                                .build();
                userRepository.save(devMan);
        }

        private void createResource(String name, String email) {
                Resource resource = Resource.builder()
                                .resourceName(name)
                                .email(email)
                                .status(ResourceStatus.AVAILABLE)
                                .build();
                resourceRepository.save(resource);
        }

        private void createProject(String name, String devManEmail, String client, ProjectStatus status) {
                User devMan = userRepository.findByEmail(devManEmail).orElseThrow();
                Project project = Project.builder()
                                .projectName(name)
                                .devMan(devMan)
                                .clientName(client)
                                .status(status)
                                .build();
                projectRepository.save(project);
        }

        private void createAssignment(String resourceEmail, String projectName, String role, LocalDate start,
                        LocalDate end) {
                Resource resource = resourceRepository.findByEmail(resourceEmail).orElseThrow();
                Project project = projectRepository.findByProjectName(projectName).stream().findFirst().orElseThrow();

                AssignmentStatus status = AssignmentStatus.ACTIVE;
                if (end.isBefore(LocalDate.now())) {
                        status = AssignmentStatus.RELEASED;
                }

                ResourceAssignment assignment = ResourceAssignment.builder()
                                .resource(resource)
                                .project(project)
                                .projectRole(role)
                                .startDate(start)
                                .endDate(end)
                                .status(status)
                                .build();
                assignmentRepository.save(assignment);

                // Update resource status if currently assigned
                if (status == AssignmentStatus.ACTIVE) {
                        resource.setStatus(ResourceStatus.ASSIGNED);
                        resourceRepository.save(resource);
                }
        }

        private void migrateProjectStatus() {
                try {
                        // Update column definition first
                        try {
                                projectRepository.alterStatusColumn();
                                System.out.println("✓ Updated projects table status column definition");
                        } catch (Exception e) {
                                System.err.println("Warning during schema update: " + e.getMessage());
                        }

                        int updated = projectRepository.migrateOnGoingToOngoing();
                        if (updated > 0) {
                                System.out.println("✓ Migrated " + updated + " project(s) from ON_GOING to ONGOING");
                        }
                } catch (Exception e) {
                        System.err.println("Error during project status migration: " + e.getMessage());
                }
        }
}