package com.sumit.backend.location.controller;

import com.sumit.backend.location.dto.TownDTO;
import com.sumit.backend.location.dto.CreateLocationDTO;
import com.sumit.backend.location.dto.VenueDTO;
import com.sumit.backend.location.service.StreetService;
import com.sumit.backend.location.service.TownService;
import com.sumit.backend.location.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/location")
public class LocationController {
    @Autowired
    StreetService streetService;

    @Autowired
    VenueService venueService;

    @Autowired
    TownService townService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create-venue")
    public ResponseEntity<VenueDTO> createVenue(@RequestBody CreateLocationDTO createLocationDTO) {
        VenueDTO venueDTO = venueService.createVenue(createLocationDTO);
        return ResponseEntity.ok(venueDTO);
    }

    @GetMapping("/get-towns")
    public ResponseEntity<List<TownDTO>> getTowns() {
        List<TownDTO> townDTOS = townService.getAllTowns();
        return ResponseEntity.ok(townDTOS);
    }

    @GetMapping("/get-venues")
    public ResponseEntity<List<VenueDTO>> getVenues() {
        List<VenueDTO> venueDTOs = venueService.getAllVenues();
        return ResponseEntity.ok(venueDTOs);
    }

    @GetMapping("/get-venues-by-town")
    public ResponseEntity<List<VenueDTO>> getVenuesByTownId(@RequestParam Integer townId) {
        return ResponseEntity.ok(venueService.getAllVenuesByTownId(townId));
    }
}
