package com.sumit.backend.security;

import com.sumit.backend.account.entity.User;
import com.sumit.backend.account.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // For LOGIN: Load by email (username)
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return createUserDetails(user);
    }

    // For JWT AUTHENTICATION: Load by userId
    public UserDetails loadUserByUserId(String userId) throws UsernameNotFoundException {
        try {
            Integer id = Integer.parseInt(userId);
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

            return createUserDetails(user);
        } catch (NumberFormatException e) {
            throw new UsernameNotFoundException("Invalid user id format: " + userId);
        }
    }

    // Helper method to create UserDetails
    private UserDetails createUserDetails(User user) {
        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(), // Username = userId (for token validation)
                user.getPasswordHash(), // Password (for login authentication)
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}