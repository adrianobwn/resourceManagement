package com.resourceManagement.resourceManagement.repository;

import com.resourceManagement.resourceManagement.model.user;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface userRepository extends JpaRepository<user, Long> {
    // Kosongkan saja, JpaRepository sudah menyediakan fungsi save, find, dll.
}