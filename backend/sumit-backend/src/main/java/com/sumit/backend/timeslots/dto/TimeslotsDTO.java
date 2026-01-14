package com.sumit.backend.timeslots.dto;

import java.sql.Time;

public class TimeslotsDTO {
    private Integer id;
    private Time startTime;
    private Time endTime;
    private Integer turnaroundMinutes;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Time getStartTime() {
        return startTime;
    }

    public void setStartTime(Time startTime) {
        this.startTime = startTime;
    }

    public Time getEndTime() {
        return endTime;
    }

    public void setEndTime(Time endTime) {
        this.endTime = endTime;
    }

    public Integer getTurnaroundMinutes() {
        return turnaroundMinutes;
    }

    public void setTurnaroundMinutes(Integer turnaroundMinutes) {
        this.turnaroundMinutes = turnaroundMinutes;
    }
}
