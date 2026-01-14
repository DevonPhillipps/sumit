package com.sumit.backend.classes.controller;

import com.sumit.backend.classes.dto.*;
import com.sumit.backend.classes.service.ClassesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.List;

@RestController
@RequestMapping("/api/classes")
public class ClassesController {
    @Autowired
    ClassesService classesService;

    @GetMapping("/current-date")
    public ResponseEntity<LocalDate> getCurrentDate() {
        return ResponseEntity.ok(LocalDate.now(ZoneId.of("Africa/Johannesburg")));
    }

    @GetMapping("/current-time")
    public ResponseEntity<OffsetDateTime> getCurrentTime() {
        return ResponseEntity.ok(OffsetDateTime.now(ZoneId.of("Africa/Johannesburg")));
    }


    @GetMapping("/get-all-pending-create-class-applications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PendingCreateGroupClassApplicationsDTO>> getAllPendingCreateClassApplications(){
        return ResponseEntity.ok(classesService.getAllPendingCreateClassApplications());
    }

    @PostMapping("/accept-create-class-application")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> acceptCreateClassApplication(@RequestBody AdminReviewClassDTO adminReviewClassDTO){
        classesService.acceptCreateClassApplication(adminReviewClassDTO);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("submit-create-class-application")
    @PreAuthorize("hasRole('TUTOR') || hasRole('ADMIN')")
    public ResponseEntity<Void> submitCreateClassApplication(@RequestBody CreateClassDTO createClassDTO, @AuthenticationPrincipal UserDetails userDetails){
        Integer userId = Integer.parseInt(userDetails.getUsername());
        classesService.submitCreateClassApplication(createClassDTO, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("student-view-my-classes")
    public ResponseEntity<List<MyClassesDTO>> getMyClasses(@AuthenticationPrincipal UserDetails userDetails){
        Integer userId = Integer.parseInt(userDetails.getUsername());
        return ResponseEntity.ok(classesService.getMyClasses(userId));
    }

    @GetMapping("/get-all-classes-by-language-town-subject-grade")
    public ResponseEntity<List<ClassDTO>> findClassesByAcademicComboIds(@RequestParam Integer comboId) {
        return ResponseEntity.ok(classesService.getAllClassesByComboId(comboId));
    }

    @GetMapping("book-group-class-page")
    public ResponseEntity<GetBookClassPageDTO> bookGroupClassPage(@RequestParam Integer classId) {
        return ResponseEntity.ok(classesService.bookGroupClassPage(classId));
    }

    @PostMapping("book-group-class")
    @PreAuthorize("hasRole('STUDENT') || hasRole('TUTOR')")
    public ResponseEntity<Void> bookGroupClass(@RequestBody BookClassDTO bookClassDTO, @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = Integer.parseInt(userDetails.getUsername());
        classesService.bookGroupClass(bookClassDTO, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("tutor-classes-overview")
    public ResponseEntity<List<TutorClassesOverviewDTO>> getTutorClasses(@AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = Integer.parseInt(userDetails.getUsername());
        return ResponseEntity.ok(classesService.getTutorClassesOverview(userId));
    }
}