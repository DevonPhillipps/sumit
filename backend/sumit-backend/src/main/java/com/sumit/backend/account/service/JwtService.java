package com.sumit.backend.account.service;

import com.sumit.backend.account.entity.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    //todo change secret key in production. make sure it will also work on the server not just locally!!!
    private final String SECRET = "your-256-bit-secret-change-this-in-production";
    private final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(SECRET.getBytes());

    // 24 hours token length in ms
    private final long EXPIRATION_TIME = 1000 * 60 * 60 * 24;

    /**
     * Create JWT token for a user
     */
    public String generateToken(Integer userId, String role) {
        return Jwts.builder()
                .claim("userId", userId)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extract user ID from token
     */
    public Integer extractUserId(String token) {
        return parseToken(token).get("userId", Integer.class);
    }

    /**
     * Extract user role from token
     */
    public String extractRole(String token) {
        return parseToken(token).get("role", String.class);
    }

    /**
     * Validate token (signature + expiration)
     */
    public boolean isValidToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Parse and validate token
     */
    private Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
