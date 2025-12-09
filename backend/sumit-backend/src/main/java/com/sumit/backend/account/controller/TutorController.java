package com.sumit.backend.account.controller;

import com.sumit.backend.account.dto.BecomeATutorDTO;
import com.sumit.backend.account.dto.TutorApplicationResponse;
import com.sumit.backend.account.service.TutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tutor")
public class TutorController {
    @Autowired
    TutorService tutorService;

    @PostMapping("/become-a-tutor")
    @PreAuthorize("hasRole('student')")
    public ResponseEntity<TutorApplicationResponse> becomeATutor(@RequestBody BecomeATutorDTO becomeATutorDTO, @AuthenticationPrincipal UserDetails userDetails){
        Integer userId = Integer.parseInt(userDetails.getUsername());
        TutorApplicationResponse response = tutorService.BecomeATutor(becomeATutorDTO, userId);
        return ResponseEntity.ok(response);
    }
}