package com.resourceManagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ResourceManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResourceManagementApplication.class, args);
    }
}
