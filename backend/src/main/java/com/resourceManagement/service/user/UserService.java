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
    private final com.resourceManagement.repository.NotificationRepository notificationRepository;
    private final HistoryLogService historyLogService;

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
            userRepository.saveAndFlush(pm);
            System.out.println("DevMan successfully saved to DB.");
        } catch (Exception e) {
            System.err.println("Error saving DevMan to DB: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("DB Persistence Error: " + e.getMessage());
        }
    }

    public List<PmListResponse> getAllPms() {
        List<User> pms = userRepository.findByUserType(UserType.DEV_MANAGER);
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

        // Delete user's notifications
        notificationRepository.deleteByRecipient_UserId(userId);

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
