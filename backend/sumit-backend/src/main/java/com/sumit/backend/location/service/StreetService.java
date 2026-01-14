package com.sumit.backend.location.service;

import com.sumit.backend.location.entity.Street;
import com.sumit.backend.location.repository.StreetRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StreetService {
    @Autowired
    StreetRepository streetRepository;

    @Autowired
    TownService townService;

    @Transactional
    public Street createStreet(Integer townId, String streetAddress, String url, double latitude, double longitude) {
        Street street = new Street();
        street.setTownId(townId);
        street.setStreetAddress(streetAddress);
        street.setLatitude(latitude);
        street.setLongitude(longitude);
        street.setUrl(url);
        streetRepository.save(street);
        return street;
    }
}
