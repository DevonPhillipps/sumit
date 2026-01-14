package com.sumit.backend.venue_timeslots.dto;

import java.util.List;

public class VenueTimeslotsDTO {

    private Integer venueId;
    private List<DayTimeslotsDTO> dayTimeslots;

    public Integer getVenueId() {
        return venueId;
    }

    public void setVenueId(Integer venueId) {
        this.venueId = venueId;
    }

    public List<DayTimeslotsDTO> getDayTimeslots() {
        return dayTimeslots;
    }

    public void setDayTimeslots(List<DayTimeslotsDTO> dayTimeslots) {
        this.dayTimeslots = dayTimeslots;
    }
}
