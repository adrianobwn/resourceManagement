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
                int devmanCount = 0;
                int resourceCount = 0;

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

                // ===== 2. DEVMAN (23 users) =====
                String[][] devmanData = {
                                { "Ani Wijaya", "ani.wijaya@inteleq.com" },
                                { "Budi Santoso", "budi.santoso@inteleq.com" },
                                { "Dewi Sarika", "dewi.sarika@inteleq.com" },
                                { "Eko Prasetyo", "eko.prasetyo@inteleq.com" },
                                { "Fitri Handayani", "fitri.handayani@inteleq.com" },
                                { "Gunawan Wibowo", "gunawan.wibowo@inteleq.com" },
                                { "Hendra Kusuma", "hendra.kusuma@inteleq.com" },
                                { "Indah Permata", "indah.permata@inteleq.com" },
                                { "Joko Susanto", "joko.susanto@inteleq.com" },
                                { "Kartika Sari", "kartika.sari@inteleq.com" },
                                { "Lukman Hakim", "lukman.hakim@inteleq.com" },
                                { "Maya Anggraini", "maya.anggraini@inteleq.com" },
                                { "Nando Pratama", "nando.pratama@inteleq.com" },
                                // Batch 3
                                { "Oscar Wijaya", "oscar.wijaya@inteleq.com" },
                                { "Putra Bangsa", "putra.bangsa@inteleq.com" },
                                { "Qoriatul Aini", "qoriatul.aini@inteleq.com" },
                                { "Rahmat Hidayat", "rahmat.hidayat@inteleq.com" },
                                { "Siska Amalia", "siska.amalia@inteleq.com" },
                                { "Taufik Hidayat", "taufik.hidayat@inteleq.com" },
                                { "Utami Putri", "utami.putri@inteleq.com" },
                                { "Vicky Prasetyo", "vicky.prasetyo@inteleq.com" },
                                { "Winda Sari", "winda.sari@inteleq.com" },
                                { "Yudi Santoso", "yudi.santoso@inteleq.com" }
                };

                for (String[] data : devmanData) {
                        if (userRepository.findByEmail(data[1]).isEmpty()) {
                                User devman = User.builder()
                                                .name(data[0])
                                                .email(data[1])
                                                .password(passwordEncoder.encode("password123"))
                                                .userType(UserType.DEV_MANAGER)
                                                .accountStatus(AccountStatus.ACTIVE)
                                                .build();
                                userRepository.save(devman);
                                System.out.println("✓ DevMan created: " + data[1]);
                                devmanCount++;
                        }
                }

                // ===== 3. RESOURCES (30 resources) =====
                String[][] resourceData = {
                                { "Fajar Nugroho", "EMP001", "fajar.nugroho@inteleq.com" },
                                { "Kevin Hartanto", "EMP002", "kevin.hartanto@inteleq.com" },
                                { "Muhammad Rizky", "EMP003", "muhammad.rizky@inteleq.com" },
                                { "Samsul Bahri", "EMP004", "samsul.bahri@inteleq.com" },
                                { "Linda Marliana", "EMP005", "linda.marliana@inteleq.com" },
                                { "Vina Oktavia", "EMP006", "vina.oktavia@inteleq.com" },
                                { "Bambang Suryadi", "EMP007", "bambang.suryadi@inteleq.com" },
                                { "Galuh Pertiwi", "EMP008", "galuh.pertiwi@inteleq.com" },
                                { "Yoga Pratama", "EMP009", "yoga.pratama@inteleq.com" },
                                { "Hasan Basri", "EMP010", "hasan.basri@inteleq.com" },
                                { "Rina Wulandari", "EMP011", "rina.wulandari@inteleq.com" },
                                { "Arif Rahman", "EMP012", "arif.rahman@inteleq.com" },
                                { "Siti Nurhaliza", "EMP013", "siti.nurhaliza@inteleq.com" },
                                { "Dimas Aditya", "EMP014", "dimas.aditya@inteleq.com" },
                                { "Putri Amelia", "EMP015", "putri.amelia@inteleq.com" },
                                { "Rudi Hermawan", "EMP016", "rudi.hermawan@inteleq.com" },
                                { "Nurul Hidayah", "EMP017", "nurul.hidayah@inteleq.com" },
                                { "Agus Setiawan", "EMP018", "agus.setiawan@inteleq.com" },
                                { "Ratna Dewi", "EMP019", "ratna.dewi@inteleq.com" },
                                { "Wahyu Kurniawan", "EMP020", "wahyu.kurniawan@inteleq.com" },
                                // Batch 3
                                { "Zainal Abidin", "EMP021", "zainal.abidin@inteleq.com" },
                                { "Bella Safitri", "EMP022", "bella.safitri@inteleq.com" },
                                { "Candra Wijaya", "EMP023", "candra.wijaya@inteleq.com" },
                                { "Dina Mardiana", "EMP024", "dina.mardiana@inteleq.com" },
                                { "Edwin Saputra", "EMP025", "edwin.saputra@inteleq.com" },
                                { "Farah Diba", "EMP026", "farah.diba@inteleq.com" },
                                { "Gilang Ramadhan", "EMP027", "gilang.ramadhan@inteleq.com" },
                                { "Hana Pertiwi", "EMP028", "hana.pertiwi@inteleq.com" },
                                { "Irfan Hakim", "EMP029", "irfan.hakim@inteleq.com" },
                                { "Jessica Mila", "EMP030", "jessica.mila@inteleq.com" }
                };

                for (String[] data : resourceData) {
                        if (resourceRepository.findByEmail(data[2]).isEmpty()) {
                                Resource resource = Resource.builder()
                                                .resourceName(data[0])
                                                .employeeId(data[1])
                                                .email(data[2])
                                                .status(ResourceStatus.AVAILABLE)
                                                .build();
                                resourceRepository.save(resource);
                                System.out.println("✓ Resource created: " + data[0]);
                                resourceCount++;
                        }
                }

                int projectCount = 0;
                int assignmentCount = 0;

                // ===== 4. PROJECTS (15 Projects) =====
                // Only create if we have DevMans and no projects exist (for simplicity in this
                // seed script)
                if (projectRepository.count() == 0) {
                        String[][] projectData = {
                                        { "Mobile Banking Revamp", "Bank Central Asia", "ani.wijaya@inteleq.com",
                                                        "ONGOING" },
                                        { "E-Commerce Android App", "Tokopedia", "ani.wijaya@inteleq.com", "ONGOING" },
                                        { "HR Management System", "Pertamina", "budi.santoso@inteleq.com", "ONGOING" },
                                        { "Inventory System v2", "Indofood", "budi.santoso@inteleq.com", "HOLD" },
                                        { "Hospital Management", "RS Pondok Indah", "dewi.sarika@inteleq.com",
                                                        "ONGOING" },
                                        { "Smart Home IoT", "Telkomsel", "dewi.sarika@inteleq.com", "ONGOING" },
                                        { "Fintech Dashboard", "OVO", "eko.prasetyo@inteleq.com", "ONGOING" },
                                        { "Logistics Tracking", "JNE", "eko.prasetyo@inteleq.com", "CLOSED" },
                                        { "Marketplace API", "Shopee", "fitri.handayani@inteleq.com", "ONGOING" },
                                        { "Travel Booking Web", "Traveloka", "fitri.handayani@inteleq.com", "ONGOING" },
                                        { "E-Learning Platform", "Ruangguru", "gunawan.wibowo@inteleq.com", "ONGOING" },
                                        { "Telemedicine App", "Halodoc", "hendra.kusuma@inteleq.com", "ONGOING" },
                                        { "POS System", "Kopi Kenangan", "indah.permata@inteleq.com", "ONGOING" },
                                        { "Wallet App", "DANA", "joko.susanto@inteleq.com", "ONGOING" },
                                        { "Crypto Exchange", "Indodax", "kartika.sari@inteleq.com", "HOLD" }
                        };

                        for (String[] pData : projectData) {
                                User devMan = userRepository.findByEmail(pData[2]).orElse(null);
                                if (devMan != null) {
                                        Project project = Project.builder()
                                                        .projectName(pData[0])
                                                        .clientName(pData[1])
                                                        .devMan(devMan)
                                                        .status(ProjectStatus.valueOf(pData[3]))
                                                        .build();
                                        projectRepository.save(project);
                                        System.out.println("✓ Project created: " + pData[0]);
                                        projectCount++;
                                }
                        }
                }

                // ===== 5. ASSIGNMENTS =====
                // Assign first 15 resources to random ONGOING projects
                if (assignmentRepository.count() == 0 && projectRepository.count() > 0) {
                        java.util.List<Project> ongoingProjects = projectRepository.findAll().stream()
                                        .filter(p -> p.getStatus() == ProjectStatus.ONGOING)
                                        .toList();

                        java.util.List<Resource> availableResources = resourceRepository.findAll().stream()
                                        .filter(r -> r.getStatus() == ResourceStatus.AVAILABLE)
                                        .toList();

                        int assignedCount = Math.min(availableResources.size(), 15); // Assign up to 15 resources
                        String[] roles = { "Backend Developer", "Frontend Developer", "QA Engineer", "UI/UX Designer",
                                        "DevOps Engineer" };

                        for (int i = 0; i < assignedCount; i++) {
                                if (ongoingProjects.isEmpty())
                                        break;

                                Resource resource = availableResources.get(i);
                                Project project = ongoingProjects.get(i % ongoingProjects.size()); // Round robin
                                String role = roles[i % roles.length];

                                ResourceAssignment assignment = ResourceAssignment.builder()
                                                .resource(resource)
                                                .project(project)
                                                .projectRole(role)
                                                .startDate(LocalDate.now().minusDays(30)) // Started 30 days ago
                                                .endDate(LocalDate.now().plusDays(90)) // Ends in 90 days
                                                .status(AssignmentStatus.ACTIVE)
                                                .build();

                                assignmentRepository.save(assignment);

                                // Update resource status
                                resource.setStatus(ResourceStatus.ASSIGNED);
                                resourceRepository.save(resource);

                                System.out.println("✓ Assigned " + resource.getResourceName() + " to "
                                                + project.getProjectName());
                                assignmentCount++;
                        }
                }

                if (adminCount > 0 || devmanCount > 0 || resourceCount > 0 || projectCount > 0 || assignmentCount > 0) {
                        System.out.println("═══════════════════════════════════════════════════════════");
                        System.out.println("   DATA INITIALIZATION COMPLETE");
                        System.out.println("   - " + adminCount + " Admin");
                        System.out.println("   - " + devmanCount + " DevMan");
                        System.out.println("   - " + resourceCount + " Resources");
                        System.out.println("   - " + projectCount + " Projects");
                        System.out.println("   - " + assignmentCount + " Assignments");
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