package com.sumit.backend.teaching.academic_offers.entity;

import jakarta.persistence.*;

@Entity
@Table(name="subject_grade_town_language_combos")
public class Combo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="subject_id", nullable=false)
    private Integer subjectId;

    @Column(name="grade_id", nullable=false)
    private Integer gradeId;

    @Column(name="town_id", nullable=false)
    private Integer townId;

    @Column(name="language_id", nullable=false)
    private Integer languageId;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Integer subjectId) {
        this.subjectId = subjectId;
    }

    public Integer getGradeId() {
        return gradeId;
    }

    public void setGradeId(Integer gradeId) {
        this.gradeId = gradeId;
    }

    public Integer getTownId() {
        return townId;
    }

    public void setTownId(Integer townId) {
        this.townId = townId;
    }

    public Integer getLanguageId() {
        return languageId;
    }

    public void setLanguageId(Integer languageId) {
        this.languageId = languageId;
    }
}