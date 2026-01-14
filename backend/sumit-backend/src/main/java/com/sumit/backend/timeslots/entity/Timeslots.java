package com.sumit.backend.timeslots.entity;

import jakarta.persistence.*;

import java.sql.Time;

@Entity
@Table(name="timeslots")
public class Timeslots {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "start_time", nullable = false)
    private Time startTime;

    @Column(name = "end_time", nullable = false)
    private Time endTime;

    @Column(name = "turnaround_minutes", nullable = false)
    private Integer turnaroundMinutes;

    public Timeslots() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Time getEndTime() {
        return endTime;
    }

    public void setEndTime(Time endTime) {
        this.endTime = endTime;
    }

    public Time getStartTime() {
        return startTime;
    }

    public void setStartTime(Time startTime) {
        this.startTime = startTime;
    }

    public Integer getTurnaroundMinutes() {
        return turnaroundMinutes;
    }

    public void setTurnaroundMinutes(Integer turnaroundMinutes) {
        this.turnaroundMinutes = turnaroundMinutes;
    }
}
