package com.sumit.backend.account.dto;

public class TutorApplicationResponse {
    private String message;
    private Integer tutorId;
    private String status;

    public TutorApplicationResponse(String message, Integer tutorId, String status) {
        this.message = message;
        this.tutorId = tutorId;
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public Integer getTutorId() {
        return tutorId;
    }

    public String getStatus() {
        return status;
    }
}
