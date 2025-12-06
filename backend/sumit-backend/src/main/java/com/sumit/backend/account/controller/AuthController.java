package com.sumit.backend.account.controller;

import com.sumit.backend.account.dto.JwtResponse;
import com.sumit.backend.account.dto.LoginDTO;
import com.sumit.backend.account.dto.SignUpDTO;
import com.sumit.backend.account.entity.User;
import com.sumit.backend.account.service.AuthService;
import io.jsonwebtoken.Jwt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthService authService;

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
