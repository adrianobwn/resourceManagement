package com.resourceManagement.resourceManagement.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users") // Nama tabel yang akan muncul di MySQL
@Data
public class user {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nama;
    private String email;
}