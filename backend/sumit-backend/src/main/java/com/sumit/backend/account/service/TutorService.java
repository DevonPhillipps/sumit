package com.sumit.backend.account.service;

import com.sumit.backend.account.dto.BecomeATutorDTO;
import com.sumit.backend.account.dto.TownDTO;
import com.sumit.backend.account.dto.TutorApplicationResponse;
import com.sumit.backend.account.entity.Language;
import com.sumit.backend.account.entity.Status;
import com.sumit.backend.account.entity.Town;
import com.sumit.backend.account.entity.Tutor;
import com.sumit.backend.account.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TutorService {
    @Autowired
    TutorRepository tutorRepository;

    @Autowired
    GradeRepository gradeRepository;

    @Autowired
    ProvinceRepository provinceRepository;

    @Autowired
    TownRepository townRepository;

    @Autowired
    UserRepository userRepository;
    @Autowired
    private LanguageRepository languageRepository;

    @Transactional
    public TutorApplicationResponse BecomeATutor(BecomeATutorDTO becomeATutorDTO, Integer userId) {
        Tutor tutor = new Tutor();
        TownDTO townDto = becomeATutorDTO.getTown();
        String town = townDto.getTown();
        Optional<Town> townId = townRepository.findByNameIgnoreCase(town);
        String languageStr = becomeATutorDTO.getPreferredLanguage().getLanguage();
        Optional<Language> language = languageRepository.findByName(languageStr);
        Integer languageId = language.get().getId();


        short age = becomeATutorDTO.getAge();
        if (age < 18 || age > 65) {
            TutorApplicationResponse response = new TutorApplicationResponse("Too young", null, "Rejected");
            return response;
        }

        if (town == null) {
            return new TutorApplicationResponse("No town", null, "Rejected");
        }
        if (!townRepository.existsByNameIgnoreCase(town)) {
            return new TutorApplicationResponse("Invalid town", null, "Rejected");
        }

        if (townId.isEmpty()) {
            return new TutorApplicationResponse("Invalid town", null, "Rejected");
        }

        if (language.isEmpty()) {
            return new TutorApplicationResponse("Invalid language", null, "Rejected");
        }


        if (tutorRepository.existsByUserId(userId)) {
            Tutor existingTutor = tutorRepository.findByUserId(userId).get();
            if (existingTutor.getStatus() == Status.pending) {
                return new TutorApplicationResponse("Already applied", null, "Rejected");
            } else if (existingTutor.getStatus() == Status.accepted) {
                return new TutorApplicationResponse("Already approved", null, "Rejected");
            } else if (existingTutor.getStatus() == Status.rejected) {
                return new TutorApplicationResponse("Already rejected", null, existingTutor.getStatus().toString());
            } else {
                existingTutor.setAge(age);
                existingTutor.setStatus(Status.pending);
                existingTutor.setTeachingExperience(becomeATutorDTO.getTeachingExperience());
                existingTutor.setTownId(townId.get().getId());
                existingTutor.setPreferredLanguageId(languageId);
                tutorRepository.save(existingTutor);
                TutorApplicationResponse response = new TutorApplicationResponse("Application sent", existingTutor.getId(), "Pending");
                return response;
            }
        }

        tutor.setAge(age);
        tutor.setStatus(Status.pending);
        tutor.setUserId(userId);
        tutor.setTeachingExperience(becomeATutorDTO.getTeachingExperience());
        tutor.setTownId(townId.get().getId());
        tutor.setPreferredLanguageId(languageId);
        tutorRepository.save(tutor);

        TutorApplicationResponse response = new TutorApplicationResponse("Application sent", tutor.getId(), "Pending");
        return response;
    }
}
