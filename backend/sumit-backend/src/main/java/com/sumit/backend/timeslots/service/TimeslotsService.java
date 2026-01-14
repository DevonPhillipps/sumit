package com.sumit.backend.timeslots.service;

import com.sumit.backend.timeslots.dto.TimeslotsDTO;
import com.sumit.backend.timeslots.entity.Timeslots;
import com.sumit.backend.timeslots.repository.TimeslotsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TimeslotsService {
    @Autowired
    TimeslotsRepository timeslotsRepository;

    public List<TimeslotsDTO> getAllTimeslots() {
        List<Timeslots> timeslots = timeslotsRepository.findAll();

        List<TimeslotsDTO> timeslotsDTO = new java.util.ArrayList<>();
        for (Timeslots timeslot : timeslots) {
            TimeslotsDTO dto = new TimeslotsDTO();
            dto.setId(timeslot.getId());
            dto.setStartTime(timeslot.getStartTime());
            dto.setEndTime(timeslot.getEndTime());
            dto.setTurnaroundMinutes(timeslot.getTurnaroundMinutes());
            timeslotsDTO.add(dto);
        }
        return timeslotsDTO;
    }

    public Timeslots getTimeslotById(Integer id) {
        return timeslotsRepository.findById(id).orElseThrow(() -> new RuntimeException("Timeslot not found"));
    }

    public List<Timeslots> findAllTimeslotsById(List<Integer> timeslotIds) {
        return timeslotsRepository.findAllById(timeslotIds);
    }

    public void deleteTimeslotById(Integer id) {
        timeslotsRepository.deleteById(id);
    }

    public Timeslots createTimeslots(TimeslotsDTO timeslotDTO) {
        Timeslots timeslot = new Timeslots();
        timeslot.setStartTime(timeslotDTO.getStartTime());
        timeslot.setEndTime(timeslotDTO.getEndTime());
        timeslot.setTurnaroundMinutes(timeslotDTO.getTurnaroundMinutes());
        return timeslotsRepository.save(timeslot);
    }
}
