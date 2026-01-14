package com.sumit.backend.teaching.academic_offers.controller;

import com.sumit.backend.reference.academics.grades.dto.GradeDTO;
import com.sumit.backend.teaching.academic_offers.dto.GradeComboDTO;
import com.sumit.backend.teaching.academic_offers.dto.LanguagesSubjectsTownsDTO;
import com.sumit.backend.teaching.academic_offers.service.AcademicOffersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teaching/academic-offers")
public class AcademicOffersController {
    @Autowired
    AcademicOffersService academicOffersService;

    @GetMapping("/get-languages-and-subjects-and-towns")
    public ResponseEntity<LanguagesSubjectsTownsDTO> getLanguagesSubjectsTowns() {
        return ResponseEntity.ok(academicOffersService.getAllLanguagesSubjectsTowns());
    }

    @GetMapping("/get-grades-via-combo")
    public ResponseEntity<List<GradeComboDTO>> getGradesViaCombo(@RequestParam Integer languageId, Integer townId, Integer subjectId){
        return ResponseEntity.ok(academicOffersService.getGradesViaComboIds(languageId, townId, subjectId));
    }
}
