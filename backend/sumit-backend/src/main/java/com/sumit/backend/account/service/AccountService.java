package com.sumit.backend.account.service;

import com.sumit.backend.account.entity.User;
import com.sumit.backend.account.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AccountService {
    @Autowired
    UserRepository userRepository;

    public short getNumberAvailableFreeLessons(Integer userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return user.getFreeLessonsAvailable();
    }
}
