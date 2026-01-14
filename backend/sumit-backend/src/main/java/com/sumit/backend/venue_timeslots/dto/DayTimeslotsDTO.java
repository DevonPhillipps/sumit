package com.sumit.backend.venue_timeslots.dto;

import java.time.DayOfWeek;
import java.util.List;

public class DayTimeslotsDTO {
    private DayOfWeek day;
    private List<Integer> timeslotIds;

    public DayOfWeek getDay() {
        return day;
    }

    public void setDay(DayOfWeek day) {
        this.day = day;
    }

    public List<Integer> getTimeslotIds() {
        return timeslotIds;
    }

    public void setTimeslotIds(List<Integer> timeslotIds) {
        this.timeslotIds = timeslotIds;
    }
}
