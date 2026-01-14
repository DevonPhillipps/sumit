package com.sumit.backend.venue_timeslots.dto;

import java.time.DayOfWeek;
import java.util.List;

public class DayTimeslotsGetDTO {
    private DayOfWeek day;
    private List<VenuesTimeslotIfDayIsKnownDTO> timeslots;

    public DayOfWeek getDay() {
        return day;
    }

    public void setDay(DayOfWeek day) {
        this.day = day;
    }

    public List<VenuesTimeslotIfDayIsKnownDTO> getTimeslots() {
        return timeslots;
    }

    public void setTimeslots(List<VenuesTimeslotIfDayIsKnownDTO> timeslots) {
        this.timeslots = timeslots;
    }
}
