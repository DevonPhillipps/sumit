package com.sumit.backend.venue_timeslots.service;

import com.sumit.backend.timeslots.entity.Timeslots;
import com.sumit.backend.timeslots.service.TimeslotsService;
import com.sumit.backend.venue_timeslots.dto.DayTimeslotsGetDTO;
import com.sumit.backend.venue_timeslots.dto.DayTimeslotsDTO;
import com.sumit.backend.venue_timeslots.dto.VenueTimeslotsDTO;
import com.sumit.backend.venue_timeslots.dto.VenuesTimeslotIfDayIsKnownDTO;
import com.sumit.backend.venue_timeslots.entity.VenueTimeslots;
import com.sumit.backend.venue_timeslots.entity.VenueTimeslotsStatus;
import com.sumit.backend.venue_timeslots.repository.VenueTimeslotsRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class VenueTimeslotService {
    @Autowired
    VenueTimeslotsRepository venueTimeslotsRepository;

    @Autowired
    TimeslotsService timeslotsService;

    @Transactional
    public void createVenueTimeslots(VenueTimeslotsDTO venueTimeslotsDTO){
        if (venueTimeslotsDTO.getDayTimeslots() == null) {
            return;
        }
        for (DayTimeslotsDTO dayTimeslotsDTO : venueTimeslotsDTO.getDayTimeslots()) {
            for (Integer timeslotId : dayTimeslotsDTO.getTimeslotIds()) {
                if(venueTimeslotsRepository.existsByVenueIdAndTimeslotIdAndDayOfWeek(venueTimeslotsDTO.getVenueId(), timeslotId, dayTimeslotsDTO.getDay())){
                    continue;
                }
                VenueTimeslots venueTimeslots = new VenueTimeslots();
                venueTimeslots.setDayOfWeek(dayTimeslotsDTO.getDay());
                venueTimeslots.setVenueId(venueTimeslotsDTO.getVenueId());
                venueTimeslots.setTimeslotId(timeslotId);
                venueTimeslots.setStatus(VenueTimeslotsStatus.AVAILABLE);
                venueTimeslotsRepository.save(venueTimeslots);
            }
        }
    }

    public List<VenuesTimeslotIfDayIsKnownDTO>
    getAvailableTimeslotsByVenueIdAndDay(Integer venueId, DayOfWeek day) {

        List<VenueTimeslots> rows =
                venueTimeslotsRepository.findAllByVenueIdAndDayOfWeek(venueId, day);

        List<VenuesTimeslotIfDayIsKnownDTO> out = new ArrayList<>();

        for (VenueTimeslots row : rows) {
            if (row.getStatus() != VenueTimeslotsStatus.AVAILABLE) {
                continue;
            }

            // fetch base timeslot info
            Timeslots base = timeslotsService.getTimeslotById(row.getTimeslotId());

            VenuesTimeslotIfDayIsKnownDTO dto = new VenuesTimeslotIfDayIsKnownDTO();
            dto.setVenueTimeslotId(row.getId());     // <-- KEY FIX
            dto.setStartTime(base.getStartTime());
            dto.setEndTime(base.getEndTime());
            dto.setTurnaroundMinutes(base.getTurnaroundMinutes());

            out.add(dto);
        }

        return out;
    }

    public List<DayTimeslotsGetDTO> getAvailableTimeslotsAndDaysByVenueId(Integer venueId) {

        List<VenueTimeslots> venueTimeslots = venueTimeslotsRepository.findAllByVenueId(venueId);

        Map<DayOfWeek, List<VenuesTimeslotIfDayIsKnownDTO>> dayMap = new EnumMap<>(DayOfWeek.class);

        for (DayOfWeek day : DayOfWeek.values()) {
            dayMap.put(day, new ArrayList<>());
        }

        for (VenueTimeslots vt : venueTimeslots) {
            if (vt.getStatus() != VenueTimeslotsStatus.AVAILABLE) {
                continue;
            }

            DayOfWeek day = vt.getDayOfWeek();

            Timeslots t = timeslotsService.getTimeslotById(vt.getTimeslotId());

            VenuesTimeslotIfDayIsKnownDTO dto = new VenuesTimeslotIfDayIsKnownDTO();
            dto.setVenueTimeslotId(vt.getId());              // <-- join-table id (what frontend submits)
            dto.setStartTime(t.getStartTime());
            dto.setEndTime(t.getEndTime());
            dto.setTurnaroundMinutes(t.getTurnaroundMinutes());

            dayMap.get(day).add(dto);
        }

        List<DayTimeslotsGetDTO> result = new ArrayList<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            DayTimeslotsGetDTO dayDto = new DayTimeslotsGetDTO();
            dayDto.setDay(day);
            dayDto.setTimeslots(dayMap.get(day));
            result.add(dayDto);
        }

        return result;
    }

}
