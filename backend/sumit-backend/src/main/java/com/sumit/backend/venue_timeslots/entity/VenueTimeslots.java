package com.sumit.backend.venue_timeslots.entity;

import jakarta.persistence.*;

import java.time.DayOfWeek;

@Entity
@Table(name="venue_timeslots", uniqueConstraints = @UniqueConstraint(columnNames = {"venue_id", "timeslot_id", "day_of_week"}))
public class VenueTimeslots {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="venue_id", nullable = false)
    private Integer venueId;

    @Column(name="timeslot_id", nullable = false)
    private Integer timeslotId;

    @Enumerated(EnumType.STRING)
    @Column(name="day_of_week", length=10, nullable = false)
    private DayOfWeek dayOfWeek;

    @Enumerated(EnumType.STRING)
    @Column(name="status", nullable = false, length=20)
    private VenueTimeslotsStatus status;

    public VenueTimeslots() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getVenueId() {
        return venueId;
    }

    public void setVenueId(Integer venueId) {
        this.venueId = venueId;
    }

    public Integer getTimeslotId() {
        return timeslotId;
    }

    public void setTimeslotId(Integer timeslotId) {
        this.timeslotId = timeslotId;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public VenueTimeslotsStatus getStatus() {
        return status;
    }

    public void setStatus(VenueTimeslotsStatus status) {
        this.status = status;
    }
}
