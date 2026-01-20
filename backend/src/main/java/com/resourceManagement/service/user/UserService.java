package com.resourceManagement.service.user;

import com.resourceManagement.dto.user.CreatePmRequest;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.AccountStatus;
import com.resourceManagement.model.enums.UserType;
import com.resourceManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void createPm(CreatePmRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User pm = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .userType(UserType.PM)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        userRepository.save(pm);
    }
}
