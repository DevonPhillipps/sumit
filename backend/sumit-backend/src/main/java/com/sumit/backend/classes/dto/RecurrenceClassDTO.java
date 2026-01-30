package com.sumit.backend.classes.dto;

import com.sumit.backend.classes.entity.GroupClassRecurrenceStatus;

import java.time.LocalDate;

public class RecurrenceClassDTO {
    private Integer recurrenceClassId;
    private LocalDate classDate;
    private GroupClassRecurrenceStatus recurrenceStatus;

    public Integer getRecurrenceClassId() {
        return recurrenceClassId;
    }

    public LocalDate getClassDate() {
        return classDate;
    }

    public void setRecurrenceClassId(Integer recurrenceClassId) {
        this.recurrenceClassId = recurrenceClassId;
    }

    public void setClassDate(LocalDate classDate) {
        this.classDate = classDate;
    }

    public GroupClassRecurrenceStatus getRecurrenceStatus() {
        return recurrenceStatus;
    }

    public void setRecurrenceStatus(GroupClassRecurrenceStatus recurrenceStatus) {
        this.recurrenceStatus = recurrenceStatus;
    }
}
