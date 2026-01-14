package com.sumit.backend.classes.dto;

public class BookClassDTO {
    private Integer classId;
    private Integer numberOfSessionsBooked;
    private boolean isWeeklyBooking;
    private short numberFreeLessonsApplied;

    public Integer getClassId() {
        return classId;
    }

    public void setClassId(Integer classId) {
        this.classId = classId;
    }

    public Integer getNumberOfSessionsBooked() {
        return numberOfSessionsBooked;
    }

    public void setNumberOfSessionsBooked(Integer numberOfSessionsBooked) {
        this.numberOfSessionsBooked = numberOfSessionsBooked;
    }

    public boolean getWeeklyBooking() {
        return isWeeklyBooking;
    }

    public void setWeeklyBooking(boolean weeklyBooking) {
        isWeeklyBooking = weeklyBooking;
    }

    public short getNumberFreeLessonsApplied() {
        return numberFreeLessonsApplied;
    }

    public void setNumberFreeLessonsApplied(short numberFreeLessonsApplied) {
        this.numberFreeLessonsApplied = numberFreeLessonsApplied;
    }
}
