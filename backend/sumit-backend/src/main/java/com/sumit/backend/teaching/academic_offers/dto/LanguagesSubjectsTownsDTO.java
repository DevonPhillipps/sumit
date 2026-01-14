package com.sumit.backend.teaching.academic_offers.dto;

import com.sumit.backend.location.dto.TownDTO;
import com.sumit.backend.reference.academics.subjects.dto.SubjectWithoutGradesDTO;
import com.sumit.backend.reference.language.dto.LanguageDTO;

import java.util.List;

public class LanguagesSubjectsTownsDTO {
    private List<SubjectWithoutGradesDTO> subjectDTOs;
    private List<LanguageDTO> languageDTOs;
    private List<TownDTO> townDTOs;

    public List<SubjectWithoutGradesDTO> getSubjectDTOs() {
        return subjectDTOs;
    }

    public void setSubjectDTOs(List<SubjectWithoutGradesDTO> subjectDTOs) {
        this.subjectDTOs = subjectDTOs;
    }

    public List<LanguageDTO> getLanguageDTOs() {
        return languageDTOs;
    }

    public void setLanguageDTOs(List<LanguageDTO> languageDTOs) {
        this.languageDTOs = languageDTOs;
    }

    public List<TownDTO> getTownDTOs() {
        return townDTOs;
    }

    public void setTownDTOs(List<TownDTO> townDTOs) {
        this.townDTOs = townDTOs;
    }
}
