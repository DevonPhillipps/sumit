package com.sumit.backend.classes.dto;

import com.sumit.backend.timeslots.dto.TimeslotsDTO;

import java.time.DayOfWeek;
import java.util.List;

public class TutorClassesDTO {
    private Integer classId;
    private List<TutorRecurrenceClassesDTO> recurrenceClasses;
    private String venueName;
    private String subject;
    private Integer grade;
    private TimeslotsDTO timeslot;
    private DayOfWeek dayOfWeek;

    public TutorClassesDTO() {

    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public List<TutorRecurrenceClassesDTO> getRecurrenceClasses() {
        return recurrenceClasses;
    }

    public void setRecurrenceClasses(List<TutorRecurrenceClassesDTO> recurrenceClasses) {
        this.recurrenceClasses= recurrenceClasses;
    }

    public Integer getClassId() {
        return classId;
    }

    public void setClassId(Integer classId) {
        this.classId = classId;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public Integer getGrade() {
        return grade;
    }

    public void setGrade(Integer grade) {
        this.grade = grade;
    }

    public TimeslotsDTO getTimeslot() {
        return timeslot;
    }

    public void setTimeslot(TimeslotsDTO timeslot) {
        this.timeslot = timeslot;
    }
}
