package com.sumit.backend.account.controller;

import com.sumit.backend.account.dto.*;
import com.sumit.backend.account.entity.Role;
import com.sumit.backend.account.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthService authService;

    @GetMapping("/role")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Role> getCurrentUserRole(@AuthenticationPrincipal UserDetails userDetails) {
        String authority = userDetails.getAuthorities().iterator().next().getAuthority();
        String roleName = authority.substring(5);
        Role role = Role.valueOf(roleName);
        return ResponseEntity.ok(role);
    }


    @PostMapping("/signup")
    public ResponseEntity<JwtResponse> signup(@RequestBody SignUpDTO signUpDTO) {
        JwtResponse response = authService.signUp(signUpDTO);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody LoginDTO loginDTO) {
        JwtResponse response = authService.login(loginDTO);
        return ResponseEntity.ok(response);
    }
}
