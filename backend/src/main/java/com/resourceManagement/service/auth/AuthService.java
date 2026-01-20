package com.resourceManagement.service.auth;

import com.resourceManagement.dto.auth.*;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.repository.UserRepository;
import com.resourceManagement.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse login(LoginRequest request) {
        System.out.println("Login attempt for email: " + request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Email tidak ditemukan"));

        System.out.println("User found: " + user.getEmail() + ", type: " + user.getUserType());

        if (!passwordEncoder.matches(
                request.getPassword(), user.getPassword())) {
            System.out.println("Password mismatch for user: " + user.getEmail());
            throw new RuntimeException("Password salah");
        }

        String token = jwtUtil.generateToken(user);

        return new LoginResponse(token, user.getName(), user.getEmail(), user.getUserType().name());
    }
}
