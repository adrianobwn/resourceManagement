package com.resourceManagement.security;

import com.resourceManagement.model.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_KEY =
            "resource-management-secret-key-1234567890";

    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("role", user.getUserType().name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 1 hari
                .signWith(
                        Keys.hmacShaKeyFor(SECRET_KEY.getBytes()),
                        SignatureAlgorithm.HS256
                )
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractRole(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        String role = claims.get("role", String.class);
        
        // Backward compatibility: Convert old PM role to DEV_MANAGER
        if ("PM".equals(role)) {
            return "DEV_MANAGER";
        }
        
        return role;
    }
}
