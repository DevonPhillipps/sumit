package com.sumit.backend.location.service;

import com.sumit.backend.location.entity.Town;
import com.sumit.backend.location.repository.StreetRepository;
import com.sumit.backend.location.repository.TownRepository;
import com.sumit.backend.location.dto.CreateLocationDTO;
import com.sumit.backend.location.dto.VenueDTO;
import com.sumit.backend.location.entity.Street;
import com.sumit.backend.location.entity.Venue;
import com.sumit.backend.location.repository.VenueRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class VenueService {
    @Autowired
    VenueRepository venueRepository;

    @Autowired
    StreetService streetService;

    @Autowired
    StreetRepository streetRepository;

    @Autowired
    TownRepository townRepository;

    @Transactional
    public VenueDTO createVenue(CreateLocationDTO createLocationDTO) {
        Street street = streetService.createStreet(createLocationDTO.getTownId(), createLocationDTO.getStreetAddress(), createLocationDTO.getGoogleMapsLink(), createLocationDTO.getLatitude(), createLocationDTO.getLongitude());

        Venue venue = new Venue();
        venue.setName(createLocationDTO.getVenueName());
        venue.setMaxCapacity(createLocationDTO.getMaxCapacity());
        venue.setStreetId(street.getId());
        Venue savedVenue = venueRepository.save(venue);

        VenueDTO venueDTO = new VenueDTO();
        venueDTO.setId(savedVenue.getId());
        venueDTO.setName(savedVenue.getName());
        return venueDTO;
    }

    @Transactional
    public List<VenueDTO> getAllVenues() {
        List<VenueDTO> venueDTOS = new ArrayList<>();

        List<Venue> venues = venueRepository.findAll();

        List<Integer> streetIds = new ArrayList<>();
        for (Venue venue : venues) {
            streetIds.add(venue.getStreetId());
        }

        List<Street> streets = streetRepository.findAllById(streetIds);

        List<Integer> townIds = new ArrayList<>();
        for (Street street : streets) {
            townIds.add(street.getTownId());
        }

        List<Town> towns = townRepository.findAllById(townIds);

        for (Venue venue : venues) {
            VenueDTO dto = new VenueDTO();
            dto.setId(venue.getId());
            dto.setName(venue.getName());
            dto.setMaxCapacity(venue.getMaxCapacity());

            Street foundStreet = null;
            for (Street street : streets) {
                if (street.getId().equals(venue.getStreetId())) {
                    foundStreet = street;
                    break;
                }
            }

            if (foundStreet != null) {
                dto.setStreetAddress(foundStreet.getStreetAddress());
                dto.setUrl(foundStreet.getUrl());

                for (Town town : towns) {
                    if (town.getId().equals(foundStreet.getTownId())) {
                        dto.setTown(town.getName());
                        break;
                    }
                }
            }

            venueDTOS.add(dto);
        }

        return venueDTOS;
    }

    public List<VenueDTO> getAllVenuesByTownId(Integer townId) {
        List<Street> streets = streetRepository.findByTownId(townId);
        List<VenueDTO> venueDTOS = new ArrayList<>();
        for (Street street : streets) {
            Integer streetId = street.getId();
            List<Venue> venues = venueRepository.findByStreetId(streetId);
            for (Venue venue : venues) {
                VenueDTO dto = new VenueDTO();
                dto.setId(venue.getId());
                dto.setName(venue.getName());
                dto.setStreetAddress(street.getStreetAddress());
                dto.setMaxCapacity(venue.getMaxCapacity());
                dto.setUrl(street.getUrl());
                venueDTOS.add(dto);
            }
        }
        return venueDTOS;
    }


}
