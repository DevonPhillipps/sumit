package com.sumit.backend.classes.dto;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;

public class PendingCreateGroupClassApplicationsDTO {
    private String venueName;
    private Integer groupClassId;
    private Integer venueTimeslotId;
    private String tutorFirstName;
    private String tutorLastName;
    private String subject;
    private String startTime;
    private String endTime;
    private DayOfWeek dayOfWeek;
    private Integer classCapacity;
    private Integer venueCapacity;
    private Integer grade;
    private LocalDate startDate;
    private Integer tutorId;
    private BigDecimal price;
    private String language;
    private String classAbout;
    private String town;

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public Integer getGroupClassId() {
        return groupClassId;
    }

    public void setGroupClassId(Integer groupClassId) {
        this.groupClassId = groupClassId;
    }

    public Integer getVenueTimeslotId() {
        return venueTimeslotId;
    }

    public void setVenueTimeslotId(Integer venueTimeslotId) {
        this.venueTimeslotId = venueTimeslotId;
    }

    public String getTutorFirstName() {
        return tutorFirstName;
    }

    public void setTutorFirstName(String tutorFirstName) {
        this.tutorFirstName = tutorFirstName;
    }

    public String getTutorLastName() {
        return tutorLastName;
    }

    public void setTutorLastName(String tutorLastName) {
        this.tutorLastName = tutorLastName;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public Integer getClassCapacity() {
        return classCapacity;
    }

    public void setClassCapacity(Integer classCapacity) {
        this.classCapacity = classCapacity;
    }

    public Integer getVenueCapacity() {
        return venueCapacity;
    }

    public void setVenueCapacity(Integer venueCapacity) {
        this.venueCapacity = venueCapacity;
    }

    public Integer getGrade() {
        return grade;
    }

    public void setGrade(Integer grade) {
        this.grade = grade;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public Integer getTutorId() {
        return tutorId;
    }

    public void setTutorId(Integer tutorId) {
        this.tutorId = tutorId;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getClassAbout() {
        return classAbout;
    }

    public void setClassAbout(String classAbout) {
        this.classAbout = classAbout;
    }

    public String getTown() {
        return town;
    }

    public void setTown(String town) {
        this.town = town;
    }
}
