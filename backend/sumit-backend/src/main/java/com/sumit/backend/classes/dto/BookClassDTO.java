package com.sumit.backend.classes.dto;

import com.sumit.backend.classes.entity.PaymentMethodSelectedEnum;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class BookClassDTO {
    @NotNull
    private Integer classId;

    @Min(0)
    @NotNull
    private Integer numberOfSessionsBooked;

    private boolean isWeeklyBooking;

    @NotNull
    @Min(0)
    private Integer numberFreeLessonsApplied;

    @NotNull
    private PaymentMethodSelectedEnum paymentMethodSelected;

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

    public Integer getNumberFreeLessonsApplied() {
        return numberFreeLessonsApplied;
    }

    public void setNumberFreeLessonsApplied(Integer numberFreeLessonsApplied) {
        this.numberFreeLessonsApplied = numberFreeLessonsApplied;
    }

    public PaymentMethodSelectedEnum getPaymentMethodSelected() {
        return paymentMethodSelected;
    }

    public void setPaymentMethodSelected(PaymentMethodSelectedEnum paymentMethodSelected) {
        this.paymentMethodSelected = paymentMethodSelected;
    }
}
