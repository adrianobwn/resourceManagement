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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
                        .build())
                .collect(Collectors.toList());
    }

    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Optionally check if user has any active projects before deletion
        // For now, we'll just delete the user
        userRepository.delete(user);
    }
}
