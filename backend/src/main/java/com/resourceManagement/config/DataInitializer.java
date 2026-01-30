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
                        // ===== 1. ADMIN =====
                        User admin = User.builder()
                                        .name("Admin Utama")
                                        .email("admin@inteleq.com")
                                        .password(passwordEncoder.encode("password123"))
                                        .userType(UserType.Admin)
                                        .accountStatus(AccountStatus.ACTIVE)
                                        .build();
                        userRepository.save(admin);
                        System.out.println("✓ Admin user created: admin@inteleq.com");

                        // ===== 2. DEV MANAGERS (25) =====
                        createDevMan("Budi Santoso", "budi@inteleq.com");
                        createDevMan("Ani Wijaya", "ani@inteleq.com");
                        createDevMan("Chandra Irawan", "chandra@inteleq.com");
                        createDevMan("Dewi Sartika", "dewi@inteleq.com");
                        createDevMan("Eko Prasetyo", "eko.pm@inteleq.com");
                        createDevMan("Fitri Handayani", "fitri@inteleq.com");
                        createDevMan("Gunawan Wibowo", "gunawan@inteleq.com");
                        createDevMan("Hendra Kusuma", "hendra@inteleq.com");
                        createDevMan("Indah Permata", "indah@inteleq.com");
                        createDevMan("Joko Widodo", "joko@inteleq.com");
                        createDevMan("Krisna Murti", "krisna@inteleq.com");
                        createDevMan("Lestari Dewi", "lestari@inteleq.com");
                        createDevMan("Mulyono Adi", "mulyono@inteleq.com");
                        createDevMan("Nirmala Sari", "nirmala@inteleq.com");
                        createDevMan("Oktaviani Putri", "oktaviani@inteleq.com");
                        createDevMan("Purnomo Jati", "purnomo@inteleq.com");
                        createDevMan("Ratna Dewi", "ratna@inteleq.com");
                        createDevMan("Sudirman Ahmad", "sudirman@inteleq.com");
                        createDevMan("Taufik Hidayat", "taufik@inteleq.com");
                        createDevMan("Utami Wulandari", "utami@inteleq.com");
                        createDevMan("Vicky Prasetya", "vicky@inteleq.com");
                        createDevMan("Widya Ningrum", "widya@inteleq.com");
                        createDevMan("Yanto Subroto", "yanto@inteleq.com");
                        createDevMan("Zainal Abidin", "zainal@inteleq.com");
                        createDevMan("Ahmad Fauzi", "ahmad.fauzi@inteleq.com");
                        System.out.println("✓ 25 DevManagers created");

                        // ===== 3. RESOURCES (50+) =====
                        // Backend Developers
                        createResource("Andi Firmansyah", "andi@inteleq.com");
                        createResource("Bambang Suryadi", "bambang@inteleq.com");
                        createResource("Citra Dewanti", "citra@inteleq.com");
                        createResource("Dimas Prasetya", "dimas@inteleq.com");
                        createResource("Endang Susilowati", "endang@inteleq.com");
                        createResource("Fajar Nugroho", "fajar@inteleq.com");
                        createResource("Gilang Ramadhan", "gilang@inteleq.com");
                        createResource("Hasan Basri", "hasan@inteleq.com");
                        createResource("Ilham Saputra", "ilham@inteleq.com");
                        createResource("Jaya Kusuma", "jaya@inteleq.com");

                        // Frontend Developers
                        createResource("Farhan Akbar", "farhan@inteleq.com");
                        createResource("Galuh Pertiwi", "galuh@inteleq.com");
                        createResource("Haryanto Budiman", "haryanto@inteleq.com");
                        createResource("Irma Sulistyani", "irma@inteleq.com");
                        createResource("Johan Sebastian", "johan@inteleq.com");
                        createResource("Kartika Sari", "kartika@inteleq.com");
                        createResource("Laksmi Dewi", "laksmi@inteleq.com");
                        createResource("Mega Putri", "mega@inteleq.com");
                        createResource("Nadia Wulandari", "nadia@inteleq.com");
                        createResource("Olivia Tan", "olivia@inteleq.com");

                        // Mobile Developers
                        createResource("Kevin Hartanto", "kevin@inteleq.com");
                        createResource("Linda Mariana", "linda@inteleq.com");
                        createResource("Muhammad Rizky", "rizky@inteleq.com");
                        createResource("Nia Rahmawati", "nia@inteleq.com");
                        createResource("Oscar Permadi", "oscar@inteleq.com");
                        createResource("Putra Wijaya", "putra@inteleq.com");
                        createResource("Qasim Ahmad", "qasim@inteleq.com");
                        createResource("Rafi Hakim", "rafi@inteleq.com");
                        createResource("Surya Pratama", "surya@inteleq.com");
                        createResource("Tommy Gunawan", "tommy@inteleq.com");

                        // QA Engineers
                        createResource("Patricia Gunawan", "patricia@inteleq.com");
                        createResource("Qori Ardiansyah", "qori@inteleq.com");
                        createResource("Rina Sulistya", "rina@inteleq.com");
                        createResource("Samsul Bahri", "samsul@inteleq.com");
                        createResource("Tika Purnamasari", "tika@inteleq.com");
                        createResource("Ulfa Maharani", "ulfa@inteleq.com");
                        createResource("Vera Anggraini", "vera@inteleq.com");
                        createResource("Winda Sari", "winda@inteleq.com");
                        createResource("Xena Olivia", "xena@inteleq.com");
                        createResource("Yuni Astuti", "yuni@inteleq.com");

                        // DevOps & Cloud Engineers
                        createResource("Umar Faruq", "umar@inteleq.com");
                        createResource("Wahyu Nugroho", "wahyu@inteleq.com");
                        createResource("Zaki Abdullah", "zaki@inteleq.com");
                        createResource("Arman Maulana", "arman@inteleq.com");
                        createResource("Bayu Setiawan", "bayu@inteleq.com");

                        // Data & AI
                        createResource("Vina Oktavia", "vina@inteleq.com");
                        createResource("Xander Putra", "xander@inteleq.com");
                        createResource("Yoga Pratama", "yoga@inteleq.com");
                        createResource("Zahra Amelia", "zahra@inteleq.com");
                        createResource("Ayu Lestari", "ayu@inteleq.com");
                        createResource("Bima Sakti", "bima@inteleq.com");
                        System.out.println("✓ 55 Resources created");

                        // ===== 4. PROJECTS (15) =====
                        // Budi's Projects
                        createProject("E-Commerce Revamp", "budi@inteleq.com", "MegaShop Inc.", ProjectStatus.ONGOING);
                        createProject("Inventory Management System", "budi@inteleq.com", "PT Maju Jaya",
                                        ProjectStatus.ONGOING);
                        createProject("Customer Portal Redesign", "budi@inteleq.com", "Bank Mandiri",
                                        ProjectStatus.CLOSED);

                        // Ani's Projects
                        createProject("Mobile Banking App v2", "ani@inteleq.com", "Bank Nasional Indonesia",
                                        ProjectStatus.ONGOING);
                        createProject("Payment Gateway Integration", "ani@inteleq.com", "Tokopedia",
                                        ProjectStatus.HOLD);

                        // Chandra's Projects
                        createProject("Legacy System Migration", "chandra@inteleq.com", "PT Pertamina",
                                        ProjectStatus.ONGOING);
                        createProject("SAP Integration Platform", "chandra@inteleq.com", "Astra International",
                                        ProjectStatus.CLOSED);

                        // Dewi's Projects
                        createProject("AI Analytics Dashboard", "dewi@inteleq.com", "Gojek", ProjectStatus.ONGOING);
                        createProject("Machine Learning Pipeline", "dewi@inteleq.com", "Grab Indonesia",
                                        ProjectStatus.ONGOING);

                        // Eko's Projects
                        createProject("Supply Chain Tracker", "eko.pm@inteleq.com", "Unilever Indonesia",
                                        ProjectStatus.ONGOING);
                        createProject("Logistics Optimization", "eko.pm@inteleq.com", "JNE Express",
                                        ProjectStatus.HOLD);

                        // Fitri's Projects
                        createProject("Healthcare Management System", "fitri@inteleq.com", "RS Siloam",
                                        ProjectStatus.ONGOING);

                        // Gunawan's Projects
                        createProject("Real Estate Platform", "gunawan@inteleq.com", "Sinar Mas Land",
                                        ProjectStatus.ONGOING);

                        // Hendra's Projects
                        createProject("Insurance Claim Portal", "hendra@inteleq.com", "Prudential Indonesia",
                                        ProjectStatus.ONGOING);

                        // Indah's Projects
                        createProject("Education LMS Platform", "indah@inteleq.com", "Ruangguru",
                                        ProjectStatus.ONGOING);
                        System.out.println("✓ 15 Projects created");

                        // ===== 5. ASSIGNMENTS (50+) =====
                        LocalDate today = LocalDate.now();

                        // --- Project: E-Commerce Revamp (Budi) ---
                        createAssignment("andi@inteleq.com", "E-Commerce Revamp", "Backend Lead",
                                        today.minusMonths(4), today.plusMonths(2));
                        createAssignment("farhan@inteleq.com", "E-Commerce Revamp", "Frontend Developer",
                                        today.minusMonths(4), today.plusMonths(2));
                        createAssignment("patricia@inteleq.com", "E-Commerce Revamp", "QA Engineer",
                                        today.minusMonths(3), today.plusDays(1)); // Ending Tomorrow H-1
                        createAssignment("umar@inteleq.com", "E-Commerce Revamp", "DevOps Engineer",
                                        today.minusMonths(4), today.plusMonths(2));

                        // --- Project: Inventory Management System (Budi) ---
                        createAssignment("bambang@inteleq.com", "Inventory Management System", "Backend Developer",
                                        today.minusMonths(2), today.plusMonths(4));
                        createAssignment("galuh@inteleq.com", "Inventory Management System", "Frontend Developer",
                                        today.minusMonths(2), today.plusMonths(4));
                        createAssignment("qori@inteleq.com", "Inventory Management System", "QA Engineer",
                                        today.minusMonths(1), today.plusMonths(4));

                        // --- Project: Customer Portal Redesign (Budi, CLOSED) ---
                        createAssignment("citra@inteleq.com", "Customer Portal Redesign", "Backend Developer",
                                        today.minusMonths(8), today.minusMonths(2));
                        createAssignment("haryanto@inteleq.com", "Customer Portal Redesign", "Frontend Developer",
                                        today.minusMonths(8), today.minusMonths(2));
                        createAssignment("rina@inteleq.com", "Customer Portal Redesign", "QA Engineer",
                                        today.minusMonths(6), today.minusMonths(2));

                        // --- Project: Mobile Banking App v2 (Ani) ---
                        createAssignment("kevin@inteleq.com", "Mobile Banking App v2", "Mobile Lead",
                                        today.minusMonths(3), today.plusMonths(5));
                        createAssignment("linda@inteleq.com", "Mobile Banking App v2", "iOS Developer",
                                        today.minusMonths(3), today.plusMonths(5));
                        createAssignment("rizky@inteleq.com", "Mobile Banking App v2", "Android Developer",
                                        today.minusMonths(3), today.plusMonths(5));
                        createAssignment("samsul@inteleq.com", "Mobile Banking App v2", "QA Engineer",
                                        today.minusMonths(2), today.plusMonths(5));
                        createAssignment("dimas@inteleq.com", "Mobile Banking App v2", "Backend Developer",
                                        today.minusMonths(3), today.plusMonths(5));

                        // --- Project: Payment Gateway Integration (Ani, HOLD) ---
                        createAssignment("endang@inteleq.com", "Payment Gateway Integration", "Backend Developer",
                                        today.minusMonths(2), today.plusMonths(3));
                        createAssignment("irma@inteleq.com", "Payment Gateway Integration", "Frontend Developer",
                                        today.minusMonths(2), today.plusMonths(3));

                        // --- Project: Legacy System Migration (Chandra) ---
                        createAssignment("wahyu@inteleq.com", "Legacy System Migration", "DevOps Engineer",
                                        today.minusMonths(5), today.plusMonths(1));
                        createAssignment("xander@inteleq.com", "Legacy System Migration", "Backend Developer",
                                        today.minusMonths(5), today.plusMonths(1));
                        createAssignment("johan@inteleq.com", "Legacy System Migration", "Frontend Developer",
                                        today.minusMonths(4), today.plusDays(3)); // Ending Soon
                        createAssignment("tika@inteleq.com", "Legacy System Migration", "QA Engineer",
                                        today.minusMonths(4), today.plusMonths(1));

                        // --- Project: SAP Integration Platform (Chandra, CLOSED) ---
                        createAssignment("andi@inteleq.com", "SAP Integration Platform", "Backend Lead",
                                        today.minusMonths(12), today.minusMonths(6));
                        createAssignment("vina@inteleq.com", "SAP Integration Platform", "Data Engineer",
                                        today.minusMonths(12), today.minusMonths(6));

                        // --- Project: AI Analytics Dashboard (Dewi) ---
                        createAssignment("yoga@inteleq.com", "AI Analytics Dashboard", "Data Scientist",
                                        today.minusMonths(2), today.plusMonths(4));
                        createAssignment("vina@inteleq.com", "AI Analytics Dashboard", "Data Engineer",
                                        today.minusMonths(2), today.plusMonths(4));
                        createAssignment("galuh@inteleq.com", "AI Analytics Dashboard", "Frontend Developer",
                                        today.minusWeeks(3), today.plusMonths(4));
                        createAssignment("qori@inteleq.com", "AI Analytics Dashboard", "QA Engineer",
                                        today.minusWeeks(2), today.plusMonths(4));

                        // --- Project: Machine Learning Pipeline (Dewi) ---
                        createAssignment("wahyu@inteleq.com", "Machine Learning Pipeline", "MLOps Engineer",
                                        today.minusMonths(1), today.plusMonths(5));
                        createAssignment("xander@inteleq.com", "Machine Learning Pipeline", "Backend Developer",
                                        today.minusMonths(1), today.plusMonths(5));
                        createAssignment("yoga@inteleq.com", "Machine Learning Pipeline", "Data Scientist",
                                        today.minusMonths(1), today.plusMonths(5));

                        // --- Project: Supply Chain Tracker (Eko) ---
                        createAssignment("citra@inteleq.com", "Supply Chain Tracker", "Backend Developer",
                                        today.minusMonths(1), today.plusMonths(3));
                        createAssignment("haryanto@inteleq.com", "Supply Chain Tracker", "Frontend Developer",
                                        today.minusMonths(1), today.plusMonths(3));
                        createAssignment("oscar@inteleq.com", "Supply Chain Tracker", "Mobile Developer",
                                        today.minusWeeks(2), today.plusMonths(3));
                        createAssignment("rina@inteleq.com", "Supply Chain Tracker", "QA Engineer",
                                        today.minusWeeks(1), today.plusDays(2)); // Ending very soon H-2

                        // --- Project: Logistics Optimization (Eko, HOLD) ---
                        createAssignment("bambang@inteleq.com", "Logistics Optimization", "Backend Developer",
                                        today.minusMonths(2), today.plusMonths(2));
                        createAssignment("farhan@inteleq.com", "Logistics Optimization", "Frontend Developer",
                                        today.minusMonths(2), today.plusMonths(2));

                        // --- Project: Healthcare Management System (Fitri) ---
                        createAssignment("dimas@inteleq.com", "Healthcare Management System", "Backend Lead",
                                        today.minusMonths(2), today.plusMonths(6));
                        createAssignment("irma@inteleq.com", "Healthcare Management System", "Frontend Developer",
                                        today.minusMonths(2), today.plusMonths(6));
                        createAssignment("nia@inteleq.com", "Healthcare Management System", "Mobile Developer",
                                        today.minusMonths(1), today.plusMonths(6));
                        createAssignment("patricia@inteleq.com", "Healthcare Management System", "QA Engineer",
                                        today.minusMonths(1), today.plusMonths(6));
                        createAssignment("umar@inteleq.com", "Healthcare Management System", "DevOps Engineer",
                                        today.minusMonths(2), today.plusMonths(6));

                        // --- Project: Real Estate Platform (Gunawan) ---
                        createAssignment("endang@inteleq.com", "Real Estate Platform", "Backend Developer",
                                        today.minusMonths(3), today.plusMonths(3));
                        createAssignment("johan@inteleq.com", "Real Estate Platform", "Frontend Developer",
                                        today.minusMonths(3), today.plusMonths(3));
                        createAssignment("kevin@inteleq.com", "Real Estate Platform", "Mobile Developer",
                                        today.minusMonths(2), today.plusMonths(3));
                        createAssignment("samsul@inteleq.com", "Real Estate Platform", "QA Engineer",
                                        today.minusMonths(2), today.plusMonths(3));

                        // --- Project: Insurance Claim Portal (Hendra) ---
                        createAssignment("andi@inteleq.com", "Insurance Claim Portal", "Backend Lead",
                                        today.minusMonths(1), today.plusMonths(4));
                        createAssignment("linda@inteleq.com", "Insurance Claim Portal", "Mobile Developer",
                                        today.minusWeeks(3), today.plusMonths(4));
                        createAssignment("tika@inteleq.com", "Insurance Claim Portal", "QA Engineer",
                                        today.minusWeeks(2), today.plusMonths(4));

                        // --- Project: Education LMS Platform (Indah) ---
                        createAssignment("rizky@inteleq.com", "Education LMS Platform", "Mobile Developer",
                                        today.minusMonths(2), today.plusMonths(4));
                        createAssignment("oscar@inteleq.com", "Education LMS Platform", "Mobile Developer",
                                        today.minusMonths(2), today.plusMonths(4));
                        createAssignment("galuh@inteleq.com", "Education LMS Platform", "Frontend Developer",
                                        today.minusMonths(2), today.plusMonths(4));

                        System.out.println("✓ 50+ Resource Assignments created");
                        System.out.println("═══════════════════════════════════════════════════════════");
                        System.out.println("   DATA INITIALIZATION COMPLETE");
                        System.out.println("   - 1 Admin");
                        System.out.println("   - 25 DevManagers");
                        System.out.println("   - 55 Resources");
                        System.out.println("   - 15 Projects");
                        System.out.println("   - 50+ Assignments");
                        System.out.println("═══════════════════════════════════════════════════════════");
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