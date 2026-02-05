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

                int adminCount = 0;
                // ===== 1. ADMIN =====
                if (userRepository.findByEmail("admin@inteleq.com").isEmpty()) {
                        User admin = User.builder()
                                        .name("Admin Utama")
                                        .email("admin@inteleq.com")
                                        .password(passwordEncoder.encode("password123"))
                                        .userType(UserType.Admin)
                                        .accountStatus(AccountStatus.ACTIVE)
                                        .build();
                        userRepository.save(admin);
                        System.out.println("✓ Admin user created: admin@inteleq.com");
                        adminCount++;
                }

                if (adminCount > 0) {
                        System.out.println("═══════════════════════════════════════════════════════════");
                        System.out.println("   DATA INITIALIZATION COMPLETE");
                        System.out.println("   - " + adminCount + " Admin");
                        System.out.println("═══════════════════════════════════════════════════════════");
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