package com.sumit.backend.venue_timeslots.dto;

import java.sql.Time;

//my best name yet lol
public class VenuesTimeslotIfDayIsKnownDTO {
    private Integer venueTimeslotId;
    private Time startTime;
    private Time endTime;
    private Integer turnaroundMinutes;

    public Integer getVenueTimeslotId() {
        return venueTimeslotId;
    }

    public void setVenueTimeslotId(Integer venueTimeslotId) {
        this.venueTimeslotId = venueTimeslotId;
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
