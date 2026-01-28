package com.resourceManagement.model.entity;

import com.resourceManagement.model.converter.UserTypeConverter;
import com.resourceManagement.model.enums.AccountStatus;
import com.resourceManagement.model.enums.UserType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Convert(converter = UserTypeConverter.class)
    @Column(nullable = false)
    private UserType userType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus accountStatus;
}
