package com.resourceManagement.resourceManagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication(exclude = {
		SecurityAutoConfiguration.class
})
public class ResourceManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(ResourceManagementApplication.class, args);
	}

}