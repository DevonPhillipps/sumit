package com.sumit.backend.account.dto;

import com.sumit.backend.account.entity.Role;

public class JwtResponse {
    private String token;
    private Integer userId;
    //note spring boot sees type Role returns enum so it calls role.name() which returns the string eg student
    private Role role;

    // Constructor
    public JwtResponse(String token, Integer userId, Role role) {
        this.token = token;
        this.userId = userId;
        this.role = role;
    }

    public String getToken() { return token; }
    public Integer getUserId() { return userId; } // ← Change to Integer
    public Role getRole() { return role; } // ← Keep as Role enum
}