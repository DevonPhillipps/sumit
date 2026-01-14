package com.sumit.backend.reference.academics.subjects.controller;

import com.sumit.backend.reference.academics.subjects.dto.SubjectDTO;
import com.sumit.backend.reference.academics.subjects.dto.SubjectWithoutGradesDTO;
import com.sumit.backend.reference.academics.subjects.service.SubjectsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    @Autowired
    SubjectsService subjectsService;

    @GetMapping("/get-all-subjects")
    public ResponseEntity<List<SubjectWithoutGradesDTO>> getAllSubjects(){
        return ResponseEntity.ok(subjectsService.getAllSubjects());
    }
}
