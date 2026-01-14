package com.sumit.backend.location.service;

import com.sumit.backend.location.dto.TownDTO;
import com.sumit.backend.location.entity.Town;
import com.sumit.backend.location.repository.TownRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TownService {
    @Autowired
    TownRepository townRepository;

    public List<TownDTO> getAllTowns(){
        List<TownDTO> townDTO = new java.util.ArrayList<>();

        List<Town> towns = townRepository.findAll();
        for (Town town : towns) {
            TownDTO dto = new TownDTO();
            dto.setId(town.getId());
            dto.setName(town.getName());
            townDTO.add(dto);
        }
        return townDTO;
    }

    public String getTownById(Integer id){
        Town town = townRepository.findById(id).get();
        return town.getName();
    }
}
