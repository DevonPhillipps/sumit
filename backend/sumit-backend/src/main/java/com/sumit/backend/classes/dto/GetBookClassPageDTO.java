package com.sumit.backend.classes.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class GetBookClassPageDTO {
    private Integer groupClassId;
    private BigDecimal price;
    private List<LocalDate> classDates;
    private String classAbout;

    public Integer getGroupClassId() {
        return groupClassId;
    }

    public void setGroupClassId(Integer groupClassId) {
        this.groupClassId = groupClassId;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getClassAbout() {
        return classAbout;
    }

    public void setClassAbout(String classAbout) {
        this.classAbout = classAbout;
    }

    public List<LocalDate> getClassDates() {
        return classDates;
    }

    public void setClassDates(List<LocalDate> classDates) {
        this.classDates = classDates;
    }
}
