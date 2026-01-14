package com.sumit.backend.classes.service;

import com.sumit.backend.account.entity.Tutor;
import com.sumit.backend.account.entity.User;
import com.sumit.backend.account.repository.TutorRepository;
import com.sumit.backend.account.repository.UserRepository;
import com.sumit.backend.account.service.TutorService;
import com.sumit.backend.classes.dto.*;
import com.sumit.backend.classes.entity.*;
import com.sumit.backend.classes.repository.GroupClassStudentsRepository;
import com.sumit.backend.classes.repository.GroupClassesRepository;
import com.sumit.backend.location.entity.Street;
import com.sumit.backend.location.entity.Town;
import com.sumit.backend.location.entity.Venue;
import com.sumit.backend.location.repository.StreetRepository;
import com.sumit.backend.location.repository.TownRepository;
import com.sumit.backend.location.repository.VenueRepository;
import com.sumit.backend.reference.academics.grades.entity.Grade;
import com.sumit.backend.reference.academics.grades.repository.GradeRepository;
import com.sumit.backend.reference.academics.subjects.entity.Subject;
import com.sumit.backend.reference.academics.subjects.repository.SubjectRepository;
import com.sumit.backend.reference.language.entity.Language;
import com.sumit.backend.reference.language.repository.LanguageRepository;
import com.sumit.backend.teaching.academic_offers.entity.Combo;
import com.sumit.backend.teaching.academic_offers.repository.ComboRepository;
import com.sumit.backend.timeslots.entity.Timeslots;
import com.sumit.backend.timeslots.repository.TimeslotsRepository;
import com.sumit.backend.timeslots.service.TimeslotsService;
import com.sumit.backend.venue_timeslots.entity.VenueTimeslots;
import com.sumit.backend.venue_timeslots.entity.VenueTimeslotsStatus;
import com.sumit.backend.venue_timeslots.repository.VenueTimeslotsRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class ClassesService {
    @Autowired
    GroupClassesRepository groupClassesRepository;

    @Autowired
    TutorService tutorService;

    @Autowired
    VenueTimeslotsRepository venueTimeslotsRepository;

    @Autowired
    VenueRepository venueRepository;

    @Autowired
    TimeslotsService timeslotsService;

    @Autowired
    GroupClassStudentsRepository groupClassStudentsRepository;

    @Autowired
    StreetRepository streetRepository;

    @Autowired
    TutorRepository tutorRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ComboRepository comboRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    GradeRepository gradeRepository;

    @Autowired
    TimeslotsRepository timeslotsRepository;

    @Autowired
    GroupClassRecurrenceService groupClassRecurringService;

    @Autowired
    TownRepository townRepository;

    @Autowired
    SubjectRepository subjectsRepository;

    @Autowired
    LanguageRepository languageRepository;

    @Transactional
    public void submitCreateClassApplication(CreateClassDTO createClassDTO, Integer userId){
        GroupClasses groupClasses = new GroupClasses();
        groupClasses.setTutorId(tutorService.getTutorIdByUserId(userId));

        groupClasses.setComboId(createClassDTO.getComboId());

        groupClasses.setClassCapacity(createClassDTO.getClassCapacity());

        groupClasses.setStatus(GroupClassStatus.PENDING);

        groupClasses.setVenueTimeslotsId(createClassDTO.getVenueTimeslotsId());

        groupClasses.setStartDate(createClassDTO.getStartDate());

        BigDecimal price;

        try {
            price = new BigDecimal(createClassDTO.getPrice()).setScale(2, RoundingMode.UNNECESSARY);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid price value");
        }

        if (price.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price must be >= 0");
        }

        groupClasses.setPrice(price);

        groupClassesRepository.save(groupClasses);

        VenueTimeslots venueTimeslot = venueTimeslotsRepository.findById(createClassDTO.getVenueTimeslotsId()).orElseThrow();
        venueTimeslot.setStatus(VenueTimeslotsStatus.PENDING);
        venueTimeslotsRepository.save(venueTimeslot);
    }

    @Transactional
    public void acceptCreateClassApplication(AdminReviewClassDTO adminReviewClassDTO) {
        Integer groupClassId = adminReviewClassDTO.getGroupClassId();
        GroupClasses groupClasses = groupClassesRepository.findById(groupClassId).orElseThrow();
        groupClasses.setStatus(GroupClassStatus.SCHEDULED);
        groupClassesRepository.save(groupClasses);

        groupClassRecurringService.setAllGroupClassRecurrences(groupClassId, adminReviewClassDTO.getDay(), adminReviewClassDTO.getStartDate(), adminReviewClassDTO.getEndDate());
    }

    @Transactional
    public List<PendingCreateGroupClassApplicationsDTO> getAllPendingCreateClassApplications() {

        List<GroupClasses> groupClasses = groupClassesRepository.findAllByStatus(GroupClassStatus.PENDING);

        List<PendingCreateGroupClassApplicationsDTO> out = new ArrayList<>();
        if (groupClasses.isEmpty()) return out;

        // --- Collect IDs (use sets to avoid duplicate DB lookups) ---
        Set<Integer> venueTimeslotIdsSet = new HashSet<>();
        Set<Integer> tutorIdsSet = new HashSet<>();
        Set<Integer> comboIdsSet = new HashSet<>();

        for (GroupClasses gc : groupClasses) {
            if (gc.getVenueTimeslotsId() != null) venueTimeslotIdsSet.add(gc.getVenueTimeslotsId());
            if (gc.getTutorId() != null) tutorIdsSet.add(gc.getTutorId());
            if (gc.getComboId() != null) comboIdsSet.add(gc.getComboId());
        }

        List<Integer> venueTimeslotIds = new ArrayList<>(venueTimeslotIdsSet);
        List<Integer> tutorIds = new ArrayList<>(tutorIdsSet);
        List<Integer> comboIds = new ArrayList<>(comboIdsSet);

        // --- VenueTimeslots ---
        List<VenueTimeslots> venueTimeslots = venueTimeslotsRepository.findAllById(venueTimeslotIds);
        Map<Integer, VenueTimeslots> vtMap = new HashMap<>();
        Set<Integer> venueIdsSet = new HashSet<>();
        Set<Integer> timeslotIdsSet = new HashSet<>();
        for (VenueTimeslots vt : venueTimeslots) {
            vtMap.put(vt.getId(), vt);
            if (vt.getVenueId() != null) venueIdsSet.add(vt.getVenueId());
            if (vt.getTimeslotId() != null) timeslotIdsSet.add(vt.getTimeslotId());
        }

        // --- Venues ---
        List<Integer> venueIds = new ArrayList<>(venueIdsSet);
        List<Venue> venues = venueRepository.findAllById(venueIds);
        Map<Integer, Venue> venueMap = new HashMap<>();
        Set<Integer> streetIdsSet = new HashSet<>();
        for (Venue v : venues) {
            venueMap.put(v.getId(), v);
            if (v.getStreetId() != null) streetIdsSet.add(v.getStreetId());
        }

        // --- Streets ---
        List<Integer> streetIds = new ArrayList<>(streetIdsSet);
        List<Street> streets = streetRepository.findAllById(streetIds);
        Map<Integer, Street> streetMap = new HashMap<>();
        Set<Integer> townIdsSet = new HashSet<>();
        for (Street s : streets) {
            streetMap.put(s.getId(), s);
            if (s.getTownId() != null) townIdsSet.add(s.getTownId());
        }

        // --- Towns ---
        List<Integer> townIds = new ArrayList<>(townIdsSet);
        List<Town> towns = townRepository.findAllById(townIds);
        Map<Integer, Town> townMap = new HashMap<>();
        for (Town t : towns) {
            townMap.put(t.getId(), t);
        }

        // --- Timeslots ---
        List<Integer> timeslotIds = new ArrayList<>(timeslotIdsSet);
        List<Timeslots> timeslots = timeslotsService.findAllTimeslotsById(timeslotIds);
        Map<Integer, Timeslots> timeslotMap = new HashMap<>();
        for (Timeslots ts : timeslots) {
            timeslotMap.put(ts.getId(), ts);
        }

        // --- Tutors + Users (names) ---
        List<Tutor> tutors = tutorRepository.findAllById(tutorIds);
        Map<Integer, Tutor> tutorMap = new HashMap<>();
        Set<Integer> userIdsSet = new HashSet<>();
        for (Tutor t : tutors) {
            tutorMap.put(t.getId(), t);
            if (t.getUserId() != null) userIdsSet.add(t.getUserId());
        }

        List<Integer> userIds = new ArrayList<>(userIdsSet);
        List<User> users = userRepository.findAllById(userIds);
        Map<Integer, User> userMap = new HashMap<>();
        for (User u : users) {
            userMap.put(u.getId(), u);
        }

        // --- Combos + Subject/Grade/Language ---
        List<Combo> combos =
                comboRepository.findAllById(comboIds);

        Map<Integer, Combo> comboMap = new HashMap<>();
        Set<Integer> subjectIdsSet = new HashSet<>();
        Set<Integer> gradeIdsSet = new HashSet<>();
        Set<Integer> languageIdsSet = new HashSet<>();

        for (Combo c : combos) {
            comboMap.put(c.getId(), c);
            if (c.getSubjectId() != null) subjectIdsSet.add(c.getSubjectId());
            if (c.getGradeId() != null) gradeIdsSet.add(c.getGradeId());
            if (c.getLanguageId() != null) languageIdsSet.add(c.getLanguageId());
        }

        List<Subject> subjects = subjectsRepository.findAllById(new ArrayList<>(subjectIdsSet));
        Map<Integer, Subject> subjectMap = new HashMap<>();
        for (Subject s : subjects) subjectMap.put(s.getId(), s);

        List<Grade> grades = gradeRepository.findAllById(new ArrayList<>(gradeIdsSet));
        Map<Integer, Grade> gradeMap = new HashMap<>();
        for (Grade g : grades) gradeMap.put(g.getId(), g);

        List<Language> languages = languageRepository.findAllById(new ArrayList<>(languageIdsSet));
        Map<Integer, Language> languageMap = new HashMap<>();
        for (Language l : languages) languageMap.put(l.getId(), l);

        // --- Build DTOs ---
        for (GroupClasses gc : groupClasses) {

            VenueTimeslots vt = vtMap.get(gc.getVenueTimeslotsId());
            if (vt == null) continue;

            Venue venue = venueMap.get(vt.getVenueId());
            Timeslots ts = timeslotMap.get(vt.getTimeslotId());
            if (venue == null || ts == null) continue;

            Street street = streetMap.get(venue.getStreetId());
            Town town = (street == null) ? null : townMap.get(street.getTownId());

            Tutor tutor = tutorMap.get(gc.getTutorId());
            User tutorUser = (tutor == null) ? null : userMap.get(tutor.getUserId());

            Combo combo = comboMap.get(gc.getComboId());
            Subject subj = (combo == null) ? null : subjectMap.get(combo.getSubjectId());
            Grade gr = (combo == null) ? null : gradeMap.get(combo.getGradeId());
            Language lang = (combo == null) ? null : languageMap.get(combo.getLanguageId());

            PendingCreateGroupClassApplicationsDTO dto = new PendingCreateGroupClassApplicationsDTO();

            dto.setGroupClassId(gc.getId());
            dto.setVenueTimeslotId(gc.getVenueTimeslotsId());

            dto.setVenueName(venue.getName());
            dto.setVenueCapacity(venue.getMaxCapacity());

            dto.setTutorId(gc.getTutorId());
            if (tutorUser != null) {
                dto.setTutorFirstName(tutorUser.getFirstName());
                dto.setTutorLastName(tutorUser.getSurname());
            } else {
                dto.setTutorFirstName(null);
                dto.setTutorLastName(null);
            }

            dto.setSubject(subj == null ? null : subj.getName());
            dto.setGrade(gr == null ? null : gr.getGrade());
            dto.setLanguage(lang == null ? null : lang.getName());

            dto.setStartTime(ts.getStartTime() == null ? null : ts.getStartTime().toString());
            dto.setEndTime(ts.getEndTime() == null ? null : ts.getEndTime().toString());
            dto.setDayOfWeek(vt.getDayOfWeek());

            dto.setClassCapacity((int) gc.getClassCapacity());
            dto.setStartDate(gc.getStartDate());

            dto.setPrice(gc.getPrice());

            dto.setTown(town == null ? null : town.getName());

            out.add(dto);
        }

        return out;
    }


    public List<ClassDTO> getAllClassesByComboId(Integer comboId) {
        List<GroupClasses> groupClasses = groupClassesRepository.findAllByComboIdAndStatus(comboId, GroupClassStatus.SCHEDULED);
        List<ClassDTO> out = new ArrayList<>();
        if (groupClasses.isEmpty()) return out;

        List<Integer> venueTimeslotIds = new ArrayList<>();
        List<Integer> tutorIds = new ArrayList<>();
        for (GroupClasses gc : groupClasses) {
            venueTimeslotIds.add(gc.getVenueTimeslotsId());
            tutorIds.add(gc.getTutorId());
        }

        List<VenueTimeslots> venueTimeslots = venueTimeslotsRepository.findAllById(venueTimeslotIds);
        Map<Integer, VenueTimeslots> vtMap = new HashMap<>();
        List<Integer> venueIds = new ArrayList<>();
        List<Integer> timeslotIds = new ArrayList<>();
        for (VenueTimeslots vt : venueTimeslots) {
            vtMap.put(vt.getId(), vt);
            venueIds.add(vt.getVenueId());
            timeslotIds.add(vt.getTimeslotId());
        }

        List<Venue> venues = venueRepository.findAllById(venueIds);
        Map<Integer, Venue> venueMap = new HashMap<>();
        List<Integer> streetIds = new ArrayList<>();
        for (Venue v : venues) {
            venueMap.put(v.getId(), v);
            streetIds.add(v.getStreetId());
        }

        List<Street> streets = streetRepository.findAllById(streetIds);
        Map<Integer, Street> streetMap = new HashMap<>();
        for (Street s : streets) {
            streetMap.put(s.getId(), s);
        }

        List<Timeslots> timeslots = timeslotsService.findAllTimeslotsById(timeslotIds);
        Map<Integer, Timeslots> timeslotMap = new HashMap<>();
        for (Timeslots t : timeslots) {
            timeslotMap.put(t.getId(), t);
        }

        List<Tutor> tutors = tutorRepository.findAllById(tutorIds);
        Map<Integer, Tutor> tutorMap = new HashMap<>();
        List<Integer> userIds = new ArrayList<>();
        for (Tutor t : tutors) {
            tutorMap.put(t.getId(), t);
            userIds.add(t.getUserId());
        }

        List<User> users = userRepository.findAllById(userIds);
        Map<Integer, User> userMap = new HashMap<>();
        for (User u : users) {
            userMap.put(u.getId(), u);
        }

        for (GroupClasses gc : groupClasses) {
            VenueTimeslots vt = vtMap.get(gc.getVenueTimeslotsId());
            if (vt == null) continue;

            Venue venue = venueMap.get(vt.getVenueId());
            Timeslots ts = timeslotMap.get(vt.getTimeslotId());
            if (venue == null || ts == null) continue;

            Street street = streetMap.get(venue.getStreetId());

            Tutor tutor = tutorMap.get(gc.getTutorId());
            User tutorUser = tutor == null ? null : userMap.get(tutor.getUserId());

            ClassDTO dto = new ClassDTO();
            dto.setGroupClassId(gc.getId());

            dto.setMaxCapacity(gc.getClassCapacity());
            dto.setCurrentCapacity(groupClassStudentsRepository.countByGroupClassIdAndStatus(gc.getId(), GroupClassStudentStatus.ACTIVE));

            dto.setVenueName(venue.getName());
            dto.setStreetAddress(street == null ? null : street.getStreetAddress());
            dto.setMapsUrl(street == null ? null : street.getUrl());

            dto.setTutorId(gc.getTutorId());
            if (tutorUser != null) {
                String first = tutorUser.getFirstName() == null ? "" : tutorUser.getFirstName().trim();
                String last = tutorUser.getSurname() == null ? "" : tutorUser.getSurname().trim();
                String full = (first + " " + last).trim();
                dto.setTutorName(full.isEmpty() ? null : full);
            } else {
                dto.setTutorName(null);
            }

            dto.setStartTime(ts.getStartTime());
            dto.setEndTime(ts.getEndTime());
            dto.setDayOfWeek(vt.getDayOfWeek());

            out.add(dto);
        }

        return out;
    }

    public GetBookClassPageDTO bookGroupClassPage(Integer classId) {
        GroupClasses groupClasses = groupClassesRepository.findById(classId).orElseThrow();

        GetBookClassPageDTO dto = new GetBookClassPageDTO();
        dto.setGroupClassId(classId); //redundant since forntend has it BUT just for incase they do some glitch where theyre on the wrong page somehow with the wrong class id
        dto.setPrice(groupClasses.getPrice());
        dto.setClassAbout("Add this to the db later");
        return dto;
    }

    @Transactional
    public List<TutorClassesOverviewDTO> getTutorClassesOverview(Integer userId){
        Integer tutorId = tutorService.getTutorIdByUserId(userId);

        List<GroupClasses> groupClasses = groupClassesRepository.findAllByTutorId(tutorId);
        if (groupClasses.isEmpty()) {
            return new ArrayList<>();
        }

        // remember hashset removes duplicates
        Set<Integer> comboIds = new HashSet<>();
        for (GroupClasses gc : groupClasses) {
            if (gc.getComboId() != null) {
                comboIds.add(gc.getComboId());
            }
        }

        Set<Integer> venueTimeslotsIds = new HashSet<>();
        for (GroupClasses gc : groupClasses) {
            venueTimeslotsIds.add(gc.getVenueTimeslotsId());
        }
        List<VenueTimeslots> venueTimeslots = venueTimeslotsRepository.findAllById(venueTimeslotsIds);

        Map<Integer, VenueTimeslots> venueTimeslotsById = new HashMap<>();
        for (VenueTimeslots vt : venueTimeslots) {
            venueTimeslotsById.put(vt.getId(), vt);
        }

        Set<Integer> venueIds = new HashSet<>();
        Set<Integer> timeslotIds = new HashSet<>();
        for (VenueTimeslots v : venueTimeslotsById.values()) {
            venueIds.add(v.getVenueId());
            timeslotIds.add(v.getTimeslotId());
        }

        Map<Integer, Venue> venueById = new HashMap<>();
        for (Venue v : venueRepository.findAllById(venueIds)) {
            venueById.put(v.getId(), v);
        }

        Map<Integer, Timeslots> timeslotById = new HashMap<>();
        for (Timeslots t : timeslotsRepository.findAllById(timeslotIds)) {
            timeslotById.put(t.getId(), t);
        }

        // 2) Fetch all combos in ONE query
        List<Combo> combos = comboRepository.findAllById(comboIds);
        Map<Integer, Combo> comboById = new HashMap<>();
        for (Combo c : combos) {
            if (comboById.containsKey(c.getId())) {
                continue;
            }
            comboById.put(c.getId(), c);
        }

        // 3) Collect subject + grade ids from combos (dedupe)
        Set<Integer> subjectIds = new HashSet<>();
        Set<Integer> gradeIds = new HashSet<>();
        for (Combo c : combos) {
            subjectIds.add(c.getSubjectId());
            gradeIds.add(c.getGradeId());
        }

        Map<Integer, Subject> subjectById = new HashMap<>();
        for (Subject s : subjectRepository.findAllById(subjectIds)) {
            if (subjectById.containsKey(s.getId())) {
                continue;
            }
            subjectById.put(s.getId(), s);
        }

        Map<Integer, Grade> gradeById = new HashMap<>();
        for (Grade g : gradeRepository.findAllById(gradeIds)) {
            if (gradeById.containsKey(g.getId())) {
                continue;
            }
            gradeById.put(g.getId(), g);
        }

        List<TutorClassesOverviewDTO> out = new ArrayList<>(groupClasses.size());
        for (GroupClasses gc : groupClasses) {
            TutorClassesOverviewDTO dto = new TutorClassesOverviewDTO();
            dto.setClassId(gc.getId());

            Combo combo = comboById.get(gc.getComboId());
            if (combo != null) {
                Subject subject = subjectById.get(combo.getSubjectId());
                Grade grade = gradeById.get(combo.getGradeId());

                dto.setSubject(subject != null ? subject.getName() : null);
                dto.setGrade(grade != null ? grade.getGrade() : null);
            } else {
                dto.setSubject(null);
                dto.setGrade(null);
            }

            VenueTimeslots vt = venueTimeslotsById.get(gc.getVenueTimeslotsId());
            if (vt != null) {
                Timeslots ts = timeslotById.get(vt.getTimeslotId());
                Venue venue = venueById.get(vt.getVenueId());

                dto.setVenueName(venue.getName());
                dto.setStartTime(ts.getStartTime());
                dto.setEndTime(ts.getEndTime());
                dto.setDay(vt.getDayOfWeek());
            }

            dto.setMaxCapacity(gc.getClassCapacity());
            dto.setNumberOfEnrolledStudents(groupClassStudentsRepository.countByGroupClassIdAndStatus(gc.getId(), GroupClassStudentStatus.ACTIVE));

            out.add(dto);
        }

        return out;
    }

    @Transactional
    public void bookGroupClass(BookClassDTO bookClassDTO, Integer userId){
        GroupClasses groupClasses = groupClassesRepository.findByIdForUpdate(bookClassDTO.getClassId()).orElseThrow();
        if (groupClasses.getStatus() != GroupClassStatus.SCHEDULED) {
            throw new RuntimeException("Class is not scheduled");
        }
        if (groupClassStudentsRepository.countByGroupClassIdAndStatus(bookClassDTO.getClassId(), GroupClassStudentStatus.ACTIVE) >= groupClasses.getClassCapacity()) {
            throw new RuntimeException("Class is full");
        }
        if (groupClassStudentsRepository.existsByStudentUserIdAndGroupClassId(userId, bookClassDTO.getClassId())) {
            throw new RuntimeException("Student already enrolled in class");
        }
        GroupClassStudents student = new GroupClassStudents();
        student.setStatus(GroupClassStudentStatus.ACTIVE);
        student.setStudentUserId(userId);
        student.setGroupClassId(bookClassDTO.getClassId());
        student.setBookedRecurring(bookClassDTO.getWeeklyBooking());

        if (bookClassDTO.getWeeklyBooking()) {
            student.setClassesRemaining(0);
        } else {
            student.setClassesRemaining(bookClassDTO.getNumberOfSessionsBooked());
            if (bookClassDTO.getNumberOfSessionsBooked() < bookClassDTO.getNumberFreeLessonsApplied()) {
                throw new RuntimeException("Too many free lessons applied");
            }
        }

        student.setCancelledAt(null);
        student.setNumberFreeLessonsApplied(bookClassDTO.getNumberFreeLessonsApplied());

        User user = userRepository.findByIdForUpdate(userId).orElseThrow();
        int finalFreeLessonsAvailable = (user.getFreeLessonsAvailable() - bookClassDTO.getNumberFreeLessonsApplied());

        if (finalFreeLessonsAvailable < 0) {
            throw new RuntimeException("Not enough free lessons available");
        }

        user.setFreeLessonsAvailable((short) finalFreeLessonsAvailable);
        userRepository.save(user);
        groupClassStudentsRepository.save(student);
    }


    public List<MyClassesDTO> getMyClasses(Integer userId){
        List<MyClassesDTO> myClassesDTOS = new java.util.ArrayList<>();
        return myClassesDTOS;
    }
}
