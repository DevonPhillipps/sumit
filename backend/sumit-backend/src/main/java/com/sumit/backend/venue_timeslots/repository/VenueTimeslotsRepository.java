package com.sumit.backend.venue_timeslots.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sumit.backend.venue_timeslots.entity.VenueTimeslots;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface VenueTimeslotsRepository extends JpaRepository<VenueTimeslots, Integer> {
    boolean existsByVenueIdAndTimeslotIdAndDayOfWeek(Integer venueId, Integer timeslotId, DayOfWeek dayOfWeek);
    List<VenueTimeslots> findAllByVenueIdAndDayOfWeek(Integer venueId, DayOfWeek dayOfWeek);
    List<VenueTimeslots> findAllByVenueId(Integer venueId);
}
