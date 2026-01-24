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
    public void run(String... args) {

        if (userRepository.count() == 0) {

            // 1. Seed Admin
            User admin = User.builder()
                    .name("Admin Inteleq")
                    .email("admin@inteleq.com")
                    .password(passwordEncoder.encode("password123"))
                    .userType(UserType.ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();
            admin = userRepository.save(admin);

            // 2. Seed PM
            User pm = User.builder()
                    .name("Project Manager")
                    .email("pm@inteleq.com")
                    .password(passwordEncoder.encode("password123"))
                    .userType(UserType.PM)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();
            pm = userRepository.save(pm);

            // 3. Seed Resources (AVAILABLE)
            Resource res1 = Resource.builder()
                    .resourceName("John Doe")
                    .employeeId("EMP001")
                    .email("john.doe@inteleq.com")
                    .status(ResourceStatus.AVAILABLE)
                    .build();

            Resource res2 = Resource.builder()
                    .resourceName("Jane Smith")
                    .employeeId("EMP002")
                    .email("jane.smith@inteleq.com")
                    .status(ResourceStatus.AVAILABLE)
                    .build();

            res1 = resourceRepository.save(res1);
            res2 = resourceRepository.save(res2);

            // 4. Seed Project (Dihapus .description-nya agar tidak error)
            Project project = Project.builder()
                    .projectName("Resource Management System")
                    .clientName("Inteleq Internal")
                    .pm(pm)
                    .status(ProjectStatus.ON_GOING)
                    .build();
            project = projectRepository.save(project);

            // 5. Seed Assignment
            // Sekaligus mengubah status John Doe menjadi ASSIGNED
            ResourceAssignment assignment = ResourceAssignment.builder()
                    .resource(res1)
                    .project(project)
                    .projectRole("Technical Lead")
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusMonths(6))
                    .status(AssignmentStatus.ACTIVE)
                    .build();
            
            assignmentRepository.save(assignment);
            
            // Update status resource setelah di-assign
            res1.setStatus(ResourceStatus.ASSIGNED);
            resourceRepository.save(res1);
        }
    }
}