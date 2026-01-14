package com.sumit.backend.admin.tutors.controller;

import com.sumit.backend.account.service.TutorService;
import com.sumit.backend.admin.tutors.dto.AdminTutorViewDTO;
import com.sumit.backend.admin.tutors.dto.RejectApplicantDTO;
import com.sumit.backend.admin.tutors.service.AdminTutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tutors")
public class AdminTutorController {

    @Autowired
    TutorService tutorService;

    @Autowired
    AdminTutorService adminTutorService;

    @GetMapping("/view-pending-tutor-applicants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminTutorViewDTO>> viewTutorApplicants(){
        return ResponseEntity.ok(tutorService.getAllPendingTutors());
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> acceptTutorApplicant(@PathVariable Integer id) {
        adminTutorService.acceptTutorApplicant(id);
        return ResponseEntity.noContent().build(); //empty response
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rejectTutorApplicant(@PathVariable Integer id, @RequestBody RejectApplicantDTO rejectApplicantDTO) {
        adminTutorService.rejectTutorApplicant(id, rejectApplicantDTO);
        return ResponseEntity.noContent().build();
    }

}
