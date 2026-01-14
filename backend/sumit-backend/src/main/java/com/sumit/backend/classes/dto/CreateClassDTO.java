package com.sumit.backend.classes.dto;

import java.time.LocalDate;

public class CreateClassDTO {
    private Integer comboId;
    private short classCapacity;
    private Integer venueTimeslotsId;
    private String price;
    private LocalDate startDate;

    public CreateClassDTO() {
    }

    public Integer getComboId() {
        return comboId;
    }

    public void setComboId(Integer comboId) {
        this.comboId = comboId;
    }

    public short getClassCapacity() {
        return classCapacity;
    }

    public void setClassCapacity(short classCapacity) {
        this.classCapacity = classCapacity;
    }

    public Integer getVenueTimeslotsId() {
        return venueTimeslotsId;
    }

    public void setVenueTimeslotsId(Integer venueTimeslotsId) {
        this.venueTimeslotsId = venueTimeslotsId;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
}
