package com.sumit.backend.venue_timeslots.controller;

import com.sumit.backend.venue_timeslots.dto.DayTimeslotsGetDTO;
import com.sumit.backend.venue_timeslots.dto.VenueTimeslotsDTO;
import com.sumit.backend.venue_timeslots.dto.VenuesTimeslotIfDayIsKnownDTO;
import com.sumit.backend.venue_timeslots.service.VenueTimeslotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;

@RestController
@RequestMapping("/api/venue-timeslots")
public class VenueTimeslotController {
    @Autowired
    VenueTimeslotService venueTimeslotService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<Void> createVenueTimeslots(@RequestBody VenueTimeslotsDTO venueTimeslotsDTO){
        venueTimeslotService.createVenueTimeslots(venueTimeslotsDTO);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('TUTOR') || hasRole('ADMIN')")
    @GetMapping("/get-available-timeslots-by-venue-id-and-day")
    public ResponseEntity<List<VenuesTimeslotIfDayIsKnownDTO>> getAvailableTimeslotsByVenueIdAndDay(@RequestParam Integer venueId, @RequestParam DayOfWeek day){
        return ResponseEntity.ok(venueTimeslotService.getAvailableTimeslotsByVenueIdAndDay(venueId, day));
    }

    @PreAuthorize("hasRole('TUTOR') || hasRole('ADMIN')")
    @GetMapping("/get-available-timeslots-by-venue-id")
    public ResponseEntity<List<DayTimeslotsGetDTO>> getAvailableTimeslotsByVenueId(@RequestParam Integer venueId) {
        return ResponseEntity.ok(venueTimeslotService.getAvailableTimeslotsAndDaysByVenueId(venueId));
    }


}
