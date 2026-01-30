package com.sumit.backend.classes.dto;

import java.util.List;

public class ValidateClassDTO {
    private Integer groupClassRecurrenceId;
    List<ValidateStudentPaymentDTO> studentPaymentDTOs;

    public Integer getGroupClassRecurrenceId() {
        return groupClassRecurrenceId;
    }

    public void setGroupClassRecurrenceId(Integer groupClassRecurrenceId) {
        this.groupClassRecurrenceId = groupClassRecurrenceId;
    }

    public List<ValidateStudentPaymentDTO> getStudentPaymentDTOs() {
        return studentPaymentDTOs;
    }

    public void setStudentPaymentDTOs(List<ValidateStudentPaymentDTO> studentPaymentDTOs) {
        this.studentPaymentDTOs = studentPaymentDTOs;
    }
}
