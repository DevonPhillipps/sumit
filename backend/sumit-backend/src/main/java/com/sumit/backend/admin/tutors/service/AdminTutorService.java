package com.sumit.backend.admin.tutors.service;

import com.sumit.backend.account.entity.Role;
import com.sumit.backend.account.entity.Status;
import com.sumit.backend.account.entity.Tutor;
import com.sumit.backend.account.entity.User;
import com.sumit.backend.account.repository.TutorRepository;
import com.sumit.backend.account.repository.UserRepository;
import com.sumit.backend.admin.tutors.dto.RejectApplicantDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AdminTutorService {
    @Autowired
    TutorRepository tutorRepository;

    @Autowired
    UserRepository userRepository;

    @Transactional
    public void acceptTutorApplicant(Integer id) {
        Tutor tutor = tutorRepository.findById(id).orElseThrow(() -> new RuntimeException("Tutor not found: " + id));
        if (tutor.getStatus() != Status.pending) {
            throw new RuntimeException("Tutor not pending anymore");
        }
        tutor.setStatus(Status.accepted);
        Integer userId = tutor.getUserId();
        tutor.setReviewed(true);
        tutor.setReviewedAt(LocalDateTime.now());
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setRole(Role.tutor);
        tutorRepository.save(tutor);
        userRepository.save(user);
    }

    @Transactional
    public void rejectTutorApplicant(Integer id, RejectApplicantDTO rejectApplicantDTO) {
        Tutor tutor = tutorRepository.findById(id).orElseThrow(() -> new RuntimeException("Tutor not found: " + id));
        if (tutor.getStatus() != Status.pending) {
            throw new RuntimeException("Tutor not pending anymore");
        }
        tutor.setStatus(Status.rejected);
        tutor.setRejectedReason(rejectApplicantDTO.getReason());
        tutor.setReviewed(true);
        tutor.setReviewedAt(LocalDateTime.now());
        tutorRepository.save(tutor);
    }
}
