package com.sumit.backend.location.dto;

public class TownDTO {
    //using this for incase i add features later on like postal code, inner areas in the town etc
    private String name;
    private Integer id;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }
}
