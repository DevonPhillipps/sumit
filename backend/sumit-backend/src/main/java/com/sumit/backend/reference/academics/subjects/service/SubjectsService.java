package com.sumit.backend.reference.academics.subjects.service;

import com.sumit.backend.reference.academics.subjects.dto.SubjectDTO;
import com.sumit.backend.reference.academics.subjects.dto.SubjectWithoutGradesDTO;
import com.sumit.backend.reference.academics.subjects.entity.Subject;
import com.sumit.backend.reference.academics.subjects.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectsService {
    @Autowired
    SubjectRepository subjectRepository;

    public List<SubjectWithoutGradesDTO> getAllSubjects(){
        List<Subject> subjects = subjectRepository.findAll();

        List<SubjectWithoutGradesDTO> subjectDTOS = new java.util.ArrayList<>();
        for (Subject subject : subjects) {
            SubjectWithoutGradesDTO dto = new SubjectWithoutGradesDTO();
            dto.setId(subject.getId());
            dto.setName(subject.getName());
            subjectDTOS.add(dto);
        }
        return subjectDTOS;
    }
}
