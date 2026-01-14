package com.sumit.backend.account.service;

import com.sumit.backend.account.dto.JwtResponse;
import com.sumit.backend.account.dto.LoginDTO;
import com.sumit.backend.account.dto.SignUpDTO;
import com.sumit.backend.account.entity.User;
import com.sumit.backend.account.entity.Role;
import com.sumit.backend.account.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Transactional
    public JwtResponse signUp(SignUpDTO signUpDTO) {
        if (userRepository.existsByEmail(signUpDTO.getEmail())) {
            throw new RuntimeException("Email already registered!");
        }

        if (userRepository.existsByPhoneNumber(signUpDTO.getPhoneNumber())) {
            throw new RuntimeException("Phone number already registered!");
        }

        User newUser = new User();
        newUser.setEmail(signUpDTO.getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(signUpDTO.getPassword()));
        newUser.setPhoneNumber(signUpDTO.getPhoneNumber());
        newUser.setFirstName(signUpDTO.getFirstName());
        newUser.setSurname(signUpDTO.getSurname());
        newUser.setFreeLessonsAvailable((short) 1);

        // Use DTO role or default to student
        Role role = (signUpDTO.getRole() != null) ? signUpDTO.getRole() : Role.STUDENT;
        newUser.setRole(role);

        userRepository.save(newUser);

        // Token subject = userId, role in claims
        String token = jwtService.generateToken(newUser.getId(), newUser.getRole());

        return new JwtResponse(token, newUser.getId(), newUser.getRole());
    }

    public JwtResponse login(LoginDTO loginDTO) {
        // 1) Let Spring Security authenticate (email + password)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginDTO.getEmail(),
                        loginDTO.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 2) Load the user from DB (using Optional correctly)
        User user = userRepository.findByEmail(loginDTO.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // 3) Generate JWT using userId + role
        String token = jwtService.generateToken(user.getId(), user.getRole());

        return new JwtResponse(token, user.getId(), user.getRole());
    }

}
