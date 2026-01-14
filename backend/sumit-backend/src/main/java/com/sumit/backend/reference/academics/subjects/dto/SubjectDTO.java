package com.sumit.backend.reference.academics.subjects.dto;

import com.sumit.backend.reference.academics.grades.dto.GradeDTO;

import java.util.List;

public class SubjectDTO {
    private Integer id;
    private String name;
    private List<Integer> grades;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Integer> getGrades() {
        return grades;
    }

    public void setGrades(List<Integer> grades) {
        this.grades = grades;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }
}
