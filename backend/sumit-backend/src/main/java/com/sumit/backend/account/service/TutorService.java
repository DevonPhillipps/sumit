package com.sumit.backend.account.service;

import com.sumit.backend.account.dto.BecomeATutorDTO;
import com.sumit.backend.account.dto.SubjectDTO;
import com.sumit.backend.account.dto.TownDTO;
import com.sumit.backend.account.dto.TutorApplicationResponse;
import com.sumit.backend.account.entity.*;
import com.sumit.backend.account.repository.*;
import com.sumit.backend.admin.tutors.dto.AdminTutorViewDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
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
    SubjectRepository subjectRepository;

    @Autowired
    ComboRepository comboRepository;

    @Autowired
    TutorSubjectOffersRepository tutorSubjectOffersRepository;

    @Autowired
    private LanguageRepository languageRepository;

    @Transactional
    public TutorApplicationResponse BecomeATutor(BecomeATutorDTO becomeATutorDTO, Integer userId) {
        Tutor tutor = new Tutor();
        TownDTO townDto = becomeATutorDTO.getTown();
        String town = townDto.getTown();
        Optional<Town> townId = townRepository.findByNameIgnoreCase(town);
        String languageStr = becomeATutorDTO.getPreferredLanguage().getLanguage();
        Optional<Language> language = languageRepository.findByNameIgnoreCase(languageStr);
        Integer languageId = language.get().getId();

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Role role = user.getRole();
        if (role != Role.student) {
            throw new RuntimeException("User is not a student");
        }

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

        //set the tutor_subject_offers table
        for (SubjectDTO subject : becomeATutorDTO.getSubjects()) {
            for (Integer grade : subject.getGrades()) {
                if (!gradeRepository.existsByGrade(grade)) {
                    return new TutorApplicationResponse("Invalid grade", null, "Rejected");
                }
                if (!subjectRepository.existsByNameIgnoreCase(subject.getSubject())) {
                    return new TutorApplicationResponse("Invalid subject", null, "Rejected");
                }

                Integer gradeId = gradeRepository.findByGrade(grade).get().getId();
                Integer subjectId = subjectRepository.findByNameIgnoreCase(subject.getSubject()).get().getId();

                Combo combo = comboRepository.findByGradeIdAndSubjectIdAndLanguageIdAndTownId(gradeId, subjectId, languageId, townId.get().getId())
                        .orElse(null);

                if (combo == null) {
                    return new TutorApplicationResponse("Invalid selection (combo not seeded)", null, "Rejected");
                }

                TutorSubjectOffers offer = new TutorSubjectOffers();
                offer.setTutorId(tutor.getId());
                offer.setComboId(combo.getId());
                tutorSubjectOffersRepository.save(offer);
            }
        }


        TutorApplicationResponse response = new TutorApplicationResponse("Application sent", tutor.getId(), "Pending");
        return response;
    }

    public List<AdminTutorViewDTO> getAllPendingTutors() {
        List<Tutor> pendingTutors = tutorRepository.findByStatus(Status.pending);
        List<AdminTutorViewDTO> adminTutorViewDTOList = new ArrayList<>();


        for (Tutor tutor : pendingTutors) {

            AdminTutorViewDTO dto = new AdminTutorViewDTO();
            User user = userRepository.findById(tutor.getUserId()).orElse(null);
            dto.setFirstName(user.getFirstName());
            dto.setSurname(user.getSurname());
            dto.setId(tutor.getId());
            dto.setAge(tutor.getAge());
            dto.setCreatedAt(tutor.getCreatedAt());
            dto.setReviewed(tutor.getReviewed());
            dto.setRejectedReason(tutor.getRejectedReason());
            dto.setTown(townRepository.findById(tutor.getTownId()).orElse(null).getName());
            dto.setPreferredLanguage(languageRepository.findById(tutor.getPreferredLanguageId()).orElse(null).getName());
            dto.setTeachingExperience(tutor.getTeachingExperience());
            dto.setStatus(tutor.getStatus());
            dto.setUserId(tutor.getUserId());

            List<TutorSubjectOffers> offers = tutorSubjectOffersRepository.findByTutorId(tutor.getId());

            java.util.Map<String, SubjectDTO> subjectMap = new java.util.HashMap<>();

            for (TutorSubjectOffers offer : offers) {
                Combo combo = comboRepository.findById(offer.getComboId()).orElse(null);
                if (combo == null) continue;

                Subject subjectEntity = subjectRepository.findById(combo.getSubjectId()).orElse(null);
                Grade gradeEntity = gradeRepository.findById(combo.getGradeId()).orElse(null);
                if (subjectEntity == null || gradeEntity == null) continue;

                String subjectName = subjectEntity.getName();
                Integer gradeVal = gradeEntity.getGrade();

                SubjectDTO subjectDTO = subjectMap.get(subjectName);
                if (subjectDTO == null) {
                    subjectDTO = new SubjectDTO();
                    subjectDTO.setSubject(subjectName);
                    subjectDTO.setMark(null); // not stored anywhere in DB
                    subjectDTO.setGrades(new ArrayList<>());
                    subjectMap.put(subjectName, subjectDTO);
                }

                if (!subjectDTO.getGrades().contains(gradeVal)) {
                    subjectDTO.getGrades().add(gradeVal);
                }
            }

            // sort subjects and grades for nice output
            List<SubjectDTO> subjects = new ArrayList<>(subjectMap.values());
            for (SubjectDTO s : subjects) {
                s.getGrades().sort(Integer::compareTo);
            }
            subjects.sort((a, b) -> a.getSubject().compareToIgnoreCase(b.getSubject()));

            dto.setSubjects(subjects);

            adminTutorViewDTOList.add(dto);
        }

        return adminTutorViewDTOList;
    }

}
