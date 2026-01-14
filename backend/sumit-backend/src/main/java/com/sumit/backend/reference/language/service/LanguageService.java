package com.sumit.backend.reference.language.service;

import com.sumit.backend.reference.language.dto.LanguageDTO;
import com.sumit.backend.reference.language.entity.Language;
import com.sumit.backend.reference.language.repository.LanguageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LanguageService {
    @Autowired
    LanguageRepository languageRepository;

    public List<LanguageDTO> getAllLanguages(){
        List<Language> languages = languageRepository.findAll();

        List<LanguageDTO> languageDTOS = new java.util.ArrayList<>();
        for (Language language : languages) {
            LanguageDTO dto = new LanguageDTO();
            dto.setId(language.getId());
            dto.setName(language.getName());
            languageDTOS.add(dto);
        }

        return languageDTOS;
    }
}
