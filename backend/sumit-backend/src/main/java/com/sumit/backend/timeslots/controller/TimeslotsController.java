package com.sumit.backend.timeslots.controller;

import com.sumit.backend.timeslots.dto.TimeslotsDTO;
import com.sumit.backend.timeslots.entity.Timeslots;
import com.sumit.backend.timeslots.service.TimeslotsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timeslots")
public class TimeslotsController {
    @Autowired
    TimeslotsService timeslotsService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create-timeslot")
    public ResponseEntity<TimeslotsDTO> createTimeslots(@RequestBody TimeslotsDTO timeslotsDTO){
        Timeslots timeslot = timeslotsService.createTimeslots(timeslotsDTO);
        timeslotsDTO.setId(timeslot.getId());
        return ResponseEntity.ok(timeslotsDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/get-timeslots")
    public ResponseEntity<List<TimeslotsDTO>> getAllTimeslots(){
        List<TimeslotsDTO> timeslots = timeslotsService.getAllTimeslots();
        return ResponseEntity.ok(timeslots);
    }
}
