package com.sumit.backend.classes.dto;

import java.time.DayOfWeek;
import java.time.LocalDate;

public class AdminReviewClassDTO {
    private Integer groupClassId;
    private LocalDate endDate;
    private LocalDate startDate;
    private DayOfWeek day;

    public Integer getGroupClassId() {
        return groupClassId;
    }

    public void setGroupClassId(Integer groupClassId) {
        this.groupClassId = groupClassId;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public DayOfWeek getDay() {
        return day;
    }

    public void setDay(DayOfWeek day) {
        this.day = day;
    }
}
