package com.sumit.backend.classes.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="group_classes")
public class GroupClasses {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="tutor_id", nullable = false)
    private Integer tutorId;

    @Column(name="combo_id", nullable = false)
    private Integer comboId;

    @Column(name="class_capacity", nullable = false)
    private Short classCapacity;

    @Column(name="venue_timeslots_id", nullable = false)
    private Integer venueTimeslotsId;

    @Enumerated(EnumType.STRING)
    @Column(name="status", nullable = false)
    GroupClassStatus status;

    @Column(name="start_date", nullable = false)
    private LocalDate startDate;

    @Column(name="price", nullable = false)
    private BigDecimal price;

    public GroupClasses() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getTutorId() {
        return tutorId;
    }

    public void setTutorId(Integer tutorId) {
        this.tutorId = tutorId;
    }

    public Integer getComboId() {
        return comboId;
    }

    public void setComboId(Integer comboId) {
        this.comboId = comboId;
    }

    public Short getClassCapacity() {
        return classCapacity;
    }

    public void setClassCapacity(Short classCapacity) {
        this.classCapacity = classCapacity;
    }

    public Integer getVenueTimeslotsId() {
        return venueTimeslotsId;
    }

    public void setVenueTimeslotsId(Integer venueTimeslotsId) {
        this.venueTimeslotsId = venueTimeslotsId;
    }

    public GroupClassStatus getStatus() {
        return status;
    }

    public void setStatus(GroupClassStatus status) {
        this.status = status;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
}