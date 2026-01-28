package com.resourceManagement.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class SchemaFixer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("Applying schema fix for history_logs.entity_type...");
            // Force entity_type to be VARCHAR(50) to avoid ENUM truncation issues
            // This handles cases where Hibernate updates fail to alter existing ENUM
            // columns
            jdbcTemplate.execute("ALTER TABLE history_logs MODIFY COLUMN entity_type VARCHAR(50)");
            System.out.println("Schema fix applied successfully.");
        } catch (Exception e) {
            System.err.println("Schema fix failed (might already be correct or table missing): " + e.getMessage());
            // Don't throw exception to avoid stopping the app, just log it.
        }
    }
}
