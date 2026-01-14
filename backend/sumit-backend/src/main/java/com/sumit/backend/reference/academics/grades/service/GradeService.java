package com.sumit.backend.reference.academics.grades.service;

import com.sumit.backend.reference.academics.grades.entity.Grade;
import com.sumit.backend.reference.academics.grades.repository.GradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GradeService {
    @Autowired
    GradeRepository gradeRepository;

    public Grade getGradeById(Integer id){
        return gradeRepository.findById(id).orElseThrow(() -> new RuntimeException("Grade not found"));
    }
}
