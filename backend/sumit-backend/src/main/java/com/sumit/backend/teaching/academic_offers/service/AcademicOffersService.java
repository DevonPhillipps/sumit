package com.sumit.backend.teaching.academic_offers.service;

import com.sumit.backend.location.dto.TownDTO;
import com.sumit.backend.location.service.TownService;
import com.sumit.backend.reference.academics.grades.dto.GradeDTO;
import com.sumit.backend.reference.academics.grades.entity.Grade;
import com.sumit.backend.reference.academics.grades.repository.GradeRepository;
import com.sumit.backend.reference.academics.grades.service.GradeService;
import com.sumit.backend.reference.academics.subjects.dto.SubjectWithoutGradesDTO;
import com.sumit.backend.reference.academics.subjects.service.SubjectsService;
import com.sumit.backend.reference.language.dto.LanguageDTO;
import com.sumit.backend.reference.language.service.LanguageService;
import com.sumit.backend.teaching.academic_offers.dto.GradeComboDTO;
import com.sumit.backend.teaching.academic_offers.dto.LanguagesSubjectsTownsDTO;
import com.sumit.backend.teaching.academic_offers.entity.Combo;
import com.sumit.backend.teaching.academic_offers.repository.ComboRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AcademicOffersService {
    @Autowired
    SubjectsService subjectsService;

    @Autowired
    LanguageService languageService;

    @Autowired
    TownService townService;

    @Autowired
    ComboRepository comboRepository;

    @Autowired
    GradeService gradeService;

    @Autowired
    GradeRepository gradeRepository;

    public LanguagesSubjectsTownsDTO getAllLanguagesSubjectsTowns(){
        List<LanguageDTO> languages = languageService.getAllLanguages();
        List<SubjectWithoutGradesDTO> subjects = subjectsService.getAllSubjects();
        List<TownDTO> towns = townService.getAllTowns();

        LanguagesSubjectsTownsDTO dto = new LanguagesSubjectsTownsDTO();
        dto.setLanguageDTOs(languages);
        dto.setSubjectDTOs(subjects);
        dto.setTownDTOs(towns);
        return dto;
    }

    public List<GradeComboDTO> getGradesViaComboIds(Integer languageId, Integer townId, Integer subjectId) {
        //todo fix the other repo queries to not use N+1 queries and rather use maps like this.
        List<Combo> combos = comboRepository.findByTownIdAndSubjectIdAndLanguageId(townId, subjectId, languageId);

        List<Integer> gradeIds = new ArrayList<>();
        for (Combo combo : combos) {
            gradeIds.add(combo.getGradeId());
        }

        List<Grade> grades = gradeRepository.findAllById(gradeIds);

        //this is apparantly indusry standard solution. it maps the grade id to grade object so that later in combos i can
        //get the gradeid from the combo object and then use that as the lookup key for the grade object in the hashmap. this is O(1) lookup time
        Map<Integer, Grade> gradeById = new HashMap<>();
        for (Grade grade : grades) {
            gradeById.put(grade.getId(), grade);
        }

        List<GradeComboDTO> gradeComboDTOS = new ArrayList<>();
        for (Combo combo : combos) {
            Grade grade = gradeById.get(combo.getGradeId());
            if (grade == null) continue;

            GradeComboDTO dto = new GradeComboDTO();
            dto.setComboId(combo.getId());
            dto.setGrade(grade.getGrade());
            gradeComboDTOS.add(dto);
        }

        return gradeComboDTOS;
    }

}
