package com.resourceManagement.service.user;

import com.resourceManagement.dto.user.CreatePmRequest;
import com.resourceManagement.dto.user.PmListResponse;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.AccountStatus;
import com.resourceManagement.model.enums.UserType;
import com.resourceManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import com.resourceManagement.model.enums.EntityType;

import java.util.List;
import java.util.stream.Collectors;
import com.resourceManagement.service.project.HistoryLogService;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.resourceManagement.repository.ProjectRepository projectRepository;
    private final com.resourceManagement.repository.AssignmentRequestRepository assignmentRequestRepository;
    private final com.resourceManagement.repository.HistoryLogRepository historyLogRepository;
    private final HistoryLogService historyLogService;
    private final com.resourceManagement.repository.ResourceRepository resourceRepository;
    private final com.resourceManagement.repository.ResourceAssignmentRepository assignmentRepository;
    private final com.resourceManagement.service.assignment.ResourceAssignmentService assignmentService;
    private final com.resourceManagement.service.project.NotificationService notificationService;
    private final com.resourceManagement.repository.ProjectRequestResourceRepository projectRequestResourceRepository;

    /**
     * Promotes a Resource into a DevMan account. The person stops being a Resource:
     * their row is removed and any active assignment is released first, so nobody
     * stays on a project they no longer belong to.
     */
    @org.springframework.transaction.annotation.Transactional
    public void assignDevMan(com.resourceManagement.dto.user.AssignDevManRequest request) {
        com.resourceManagement.model.entity.Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        if (userRepository.existsByEmail(resource.getEmail())) {
            throw new RuntimeException("This resource already has an account");
        }

        User performedBy = currentUser();

        // Release every active assignment before the resource disappears.
        List<com.resourceManagement.model.entity.ResourceAssignment> active = assignmentRepository
                .findByResource_ResourceId(resource.getResourceId())
                .stream()
                .filter(a -> a.getStatus() == com.resourceManagement.model.enums.AssignmentStatus.ACTIVE)
                .collect(Collectors.toList());

        for (com.resourceManagement.model.entity.ResourceAssignment assignment : active) {
            com.resourceManagement.model.entity.Project project = assignment.getProject();
            assignmentService.processRelease(assignment, performedBy);

            String message = String.format("%s was released from %s after being assigned as DevMan",
                    resource.getResourceName(), project.getProjectName());

            notificationService.notifyAllAdmins(
                    com.resourceManagement.model.enums.NotificationType.APPROVAL_RESULT, message);

            // The project's own DevMan needs to know their member is gone.
            if (project.getDevMan() != null) {
                notificationService.createNotification(project.getDevMan(),
                        com.resourceManagement.model.enums.NotificationType.APPROVAL_RESULT, message);
            }
        }

        User devMan = User.builder()
                .name(resource.getResourceName())
                .email(resource.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .userType(UserType.DEV_MANAGER)
                .accountStatus(AccountStatus.ACTIVE)
                .build();
        userRepository.saveAndFlush(devMan);

        // Anyone mentored by this person loses their RM; admin must pick a new one.
        resourceRepository.findAll().stream()
                .filter(r -> r.getReportingManager() != null
                        && r.getReportingManager().getResourceId().equals(resource.getResourceId()))
                .forEach(r -> {
                    r.setReportingManager(null);
                    resourceRepository.saveAndFlush(r);
                });

        // Everything pointing at this resource has to go first, otherwise Hibernate
        // flushes a reference to a row that is on its way out.
        historyLogRepository.deleteByResource_ResourceId(resource.getResourceId());
        projectRequestResourceRepository.deleteByResource_ResourceId(resource.getResourceId());
        assignmentRequestRepository.deleteByResource_ResourceId(resource.getResourceId());
        assignmentRepository.deleteByResource_ResourceId(resource.getResourceId());

        resource.setReportingManager(null);
        resourceRepository.saveAndFlush(resource);
        resourceRepository.delete(resource);
        resourceRepository.flush();

        historyLogService.logActivity(
                EntityType.USER,
                "ASSIGN",
                String.format("Assigned %s (%s) as DevMan; removed from Resources%s",
                        resource.getResourceName(),
                        resource.getEmail(),
                        active.isEmpty() ? "" : " and released from " + active.size() + " active project(s)"),
                performedBy);
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    public void createPm(CreatePmRequest request) {
        System.out.println("Attempting to create DevMan: " + request.getName() + " (" + request.getEmail() + ")");

        if (userRepository.existsByEmail(request.getEmail())) {
            System.err.println("DevMan creation failed: Email already exists: " + request.getEmail());
            throw new RuntimeException("Email already exists");
        }

        User pm = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .userType(UserType.DEV_MANAGER)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        try {
            User savedPm = userRepository.saveAndFlush(pm);
            System.out.println("DevMan successfully saved to DB.");

            // Log activity
            String currentPrincipalName = SecurityContextHolder.getContext().getAuthentication().getName();
            User performedBy = userRepository.findByEmail(currentPrincipalName)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));

            historyLogService.logActivity(
                    EntityType.USER,
                    "CREATE",
                    "Created DevMan Account: " + pm.getName(),
                    performedBy);

        } catch (Exception e) {
            System.err.println("Error saving DevMan to DB: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("DB Persistence Error: " + e.getMessage());
        }
    }

    public List<PmListResponse> getAllPms() {
        List<User> pms = userRepository.findByUserTypeOrderByNameAsc(UserType.DEV_MANAGER);
        return pms.stream()
                .map(pm -> PmListResponse.builder()
                        .userId(pm.getUserId())
                        .name(pm.getName())
                        .email(pm.getEmail())
                        .projectCount((int) projectRepository.countByDevMan_UserId(pm.getUserId()))
                        .build())
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (projectRepository.existsByDevMan_UserId(userId)) {
            throw new RuntimeException(
                    "Cannot delete DevMan associated with existing projects. Please reassign or delete the projects first.");
        }

        // Delete user's requests (as requester)
        assignmentRequestRepository.deleteByRequester_UserId(userId);

        // Delete history logs performed by this user
        historyLogRepository.deleteByPerformedBy_UserId(userId);

        // Log deletion
        String currentPrincipalName = SecurityContextHolder.getContext().getAuthentication().getName();
        User performedBy = userRepository.findByEmail(currentPrincipalName)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        historyLogService.logActivity(
                EntityType.USER,
                "DELETE",
                "Deleted DevMan: " + user.getName(),
                performedBy);

        userRepository.delete(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateUser(Integer userId, com.resourceManagement.dto.user.UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        String oldName = user.getName();
        String oldEmail = user.getEmail();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        userRepository.save(user);

        // Log activity
        String currentPrincipalName = SecurityContextHolder.getContext().getAuthentication().getName();
        User performedBy = userRepository.findByEmail(currentPrincipalName)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        String changeLog = String.format("Updated DevMan: %s -> %s, %s -> %s",
                oldName, request.getName(),
                oldEmail, request.getEmail());

        historyLogService.logActivity(
                EntityType.USER,
                "UPDATE",
                changeLog,
                performedBy);
    }
}
