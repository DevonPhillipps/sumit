package com.sumit.backend.account.dto;

import java.util.List;

public class BecomeATutorDTO {
    private Short age;
    private TownDTO town;
    private LanguageDTO preferredLanguage;
    private String teachingExperience;
    private List<SubjectDTO> subjects;

    public Short getAge() {
        return age;
    }

    public void setAge(Short age) {
        this.age = age;
    }

    public TownDTO getTown() {
        return town;
    }

    public void setTown(TownDTO town) {
        this.town = town;
    }

    public LanguageDTO getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(LanguageDTO preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public String getTeachingExperience() {
        return teachingExperience;
    }

    public void setTeachingExperience(String teachingExperience) {
        this.teachingExperience = teachingExperience;
    }

    public List<SubjectDTO> getSubjects() {
        return subjects;
    }

    public void setSubjects(List<SubjectDTO> subjects) {
        this.subjects = subjects;
    }
}
