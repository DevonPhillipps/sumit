package com.sumit.backend.reference.language.controller;

import com.sumit.backend.reference.language.dto.LanguageDTO;
import com.sumit.backend.reference.language.service.LanguageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/languages")
public class LanguageController {
    @Autowired
    LanguageService languageService;

    @GetMapping("/get-all-languages")
    public ResponseEntity<List<LanguageDTO>> getAllLanguages(){
        return ResponseEntity.ok(languageService.getAllLanguages());
    }
}
