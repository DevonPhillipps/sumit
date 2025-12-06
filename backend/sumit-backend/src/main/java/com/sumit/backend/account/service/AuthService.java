package com.sumit.backend.account.service;

import com.sumit.backend.account.dto.JwtResponse;
import com.sumit.backend.account.dto.LoginDTO;
import com.sumit.backend.account.dto.SignUpDTO;
import com.sumit.backend.account.entity.User;
import com.sumit.backend.account.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    UserRepository userRepository;

    @Autowired
    JwtService jwtService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    //todo verify email and phone nr so that hackers dont know if email is already registered and no one can steal other peopels emails
    public JwtResponse signUp(SignUpDTO signUpDTO) {
        if (userRepository.existsByEmail(signUpDTO.getEmail())) {
            throw new RuntimeException("Email already registered!");
        }

        if (userRepository.existsByPhoneNumber(signUpDTO.getPhoneNumber())) {
            throw new RuntimeException("Phone number already registered!");
        }

        User newUser = new User();
        newUser.setEmail(signUpDTO.getEmail());
        //todo use spring security beans for password hash
        newUser.setPasswordHash(passwordEncoder.encode(signUpDTO.getPassword()));
        newUser.setPhoneNumber(signUpDTO.getPhoneNumber());
        newUser.setFirstName(signUpDTO.getFirstName());
        newUser.setSurname(signUpDTO.getSurname());
        newUser.setRole(signUpDTO.getRole());

        userRepository.save(newUser);

        String token = jwtService.generateToken(newUser.getId(), newUser.getRole().name());

        return new JwtResponse(token, newUser.getId(), newUser.getRole()
        );
    }

    public JwtResponse login(LoginDTO loginDTO) {
        User user = userRepository.findByEmail(loginDTO.getEmail());
        if (user != null) {
            //remember if we encode the password and use .equals the hashes for the same password wont match hence use .match
            //todo use spring security beans for password hash
            if (passwordEncoder.matches(loginDTO.getPassword(), user.getPasswordHash())) {
                String token = jwtService.generateToken(user.getId(), user.getRole().name());
                return new JwtResponse(token, user.getId(), user.getRole());
            } else {
                throw new RuntimeException("Invalid credentials");
            }
        } else {
            throw new RuntimeException("Invalid credentials");
        }
    }
}
