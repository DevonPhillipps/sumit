package com.sumit.backend.location.dto;

import java.util.List;

public class CreateLocationDTO {
    private Integer townId;
    private String streetAddress;
    private double latitude;
    private double longitude;
    private String googleMapsLink;
    private String venueName;
    private Integer maxCapacity;


    public CreateLocationDTO() {
    }

    public Integer getTownId() {
        return townId;
    }

    public void setTown(Integer townId) {
        this.townId = townId;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getGoogleMapsLink() {
        return googleMapsLink;
    }

    public void setGoogleMapsLink(String googleMapsLink) {
        this.googleMapsLink = googleMapsLink;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }
}
