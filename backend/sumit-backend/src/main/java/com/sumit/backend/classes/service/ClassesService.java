package com.sumit.backend.classes.service;

import com.sumit.backend.account.entity.Role;
import com.sumit.backend.account.entity.Tutor;
import com.sumit.backend.account.entity.User;
import com.sumit.backend.account.repository.TutorRepository;
import com.sumit.backend.account.repository.UserRepository;
import com.sumit.backend.account.service.TutorService;
import com.sumit.backend.classes.dto.*;
import com.sumit.backend.classes.entity.*;
import com.sumit.backend.classes.repository.*;
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
import com.sumit.backend.timeslots.dto.TimeslotsDTO;
import com.sumit.backend.timeslots.entity.Timeslots;
import com.sumit.backend.timeslots.repository.TimeslotsRepository;
import com.sumit.backend.timeslots.service.TimeslotsService;
import com.sumit.backend.venue_timeslots.entity.VenueTimeslots;
import com.sumit.backend.venue_timeslots.entity.VenueTimeslotsStatus;
import com.sumit.backend.venue_timeslots.repository.VenueTimeslotsRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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

    @Autowired
    GroupClassRecurrenceRepository groupClassRecurrenceRepository;

    @Autowired
    GroupClassRecurrenceStudentsRepository groupClassRecurrenceStudentsRepository;

    @Autowired
    ClassStudentPaymentsRepository classStudentPaymentsRepository;

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
        List<LocalDate> dates = groupClassRecurrenceRepository.findClassDatesByGroupClassIdAndStatus(classId, GroupClassRecurrenceStatus.SCHEDULED.name());
        dto.setClassDates(dates);
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
    public void bookGroupClass(BookClassDTO bookClassDTO, Integer userId) {

        GroupClasses groupClasses = groupClassesRepository.findByIdForUpdate(bookClassDTO.getClassId()).orElseThrow();
        if (groupClasses.getStatus() != GroupClassStatus.SCHEDULED) {
            throw new RuntimeException("Class is not scheduled");
        }
        if (groupClassStudentsRepository.countByGroupClassIdAndStatus(bookClassDTO.getClassId(), GroupClassStudentStatus.ACTIVE) >= groupClasses.getClassCapacity()) {
            throw new RuntimeException("Class is full");
        }

        if (groupClassStudentsRepository.existsByStudentUserIdAndGroupClassIdAndStatus(userId, bookClassDTO.getClassId(), GroupClassStudentStatus.ACTIVE)) {
            throw new RuntimeException("Student already enrolled in class");
        }

        GroupClassStudents student = new GroupClassStudents();
        student.setStatus(GroupClassStudentStatus.ACTIVE);
        student.setStudentUserId(userId);
        student.setGroupClassId(bookClassDTO.getClassId());
        student.setBookedRecurring(bookClassDTO.getWeeklyBooking());

        Integer lessonsRemaining = groupClassRecurrenceRepository.countByGroupClassIdAndStatusAndClassDateGreaterThanEqual(
                bookClassDTO.getClassId(),
                GroupClassRecurrenceStatus.SCHEDULED,
                LocalDate.now(ZoneId.of("Africa/Johannesburg"))
        );

        int numberClassesBooked = bookClassDTO.getWeeklyBooking()
                ? lessonsRemaining
                : bookClassDTO.getNumberOfSessionsBooked();

        List<GroupClassRecurrence> recurrenceClasses =
                groupClassRecurrenceRepository.findByGroupClassIdAndStatusOrderByClassDateAsc(
                        bookClassDTO.getClassId(),
                        GroupClassRecurrenceStatus.SCHEDULED,
                        PageRequest.of(0, numberClassesBooked)
                );

        if (recurrenceClasses.size() < numberClassesBooked) {
            throw new RuntimeException("Not enough scheduled recurrence classes");
        }

        int freeLessonsUsed = bookClassDTO.getNumberFreeLessonsApplied();
        if (freeLessonsUsed > recurrenceClasses.size()) {
            freeLessonsUsed = recurrenceClasses.size();
        }
        if (freeLessonsUsed < 0) freeLessonsUsed = 0;

        User user = userRepository.findByIdForUpdate(userId).orElseThrow();
        int finalFreeLessonsAvailable = user.getFreeLessonsAvailable() - freeLessonsUsed;

        if (finalFreeLessonsAvailable < 0) {
            throw new RuntimeException("Not enough free lessons available");
        }

        user.setFreeLessonsAvailable((short) finalFreeLessonsAvailable);
        userRepository.save(user);

        GroupClassStudents gcs = groupClassStudentsRepository.save(student);

        groupClassRecurringService.bookStudentRecurrenceClasses(
                gcs.getId(),
                numberClassesBooked,
                freeLessonsUsed,
                bookClassDTO.getPaymentMethodSelected(),
                recurrenceClasses
        );
    }

    @Transactional
    public List<MyClassesDTO> getMyUpcomingClasses(Integer userId) {

        List<GroupClassStudents> gcs =
                groupClassStudentsRepository.findByStudentUserIdAndStatus(userId, GroupClassStudentStatus.ACTIVE);

        if (gcs.isEmpty()) return new ArrayList<>();

        Map<Integer, GroupClassStudents> gcsById = new HashMap<>(gcs.size() * 2);
        Set<Integer> gcsIds = new HashSet<>(gcs.size() * 2);
        Set<Integer> groupClassIds = new HashSet<>(gcs.size() * 2);

        for (GroupClassStudents s : gcs) {
            gcsById.put(s.getId(), s);
            gcsIds.add(s.getId());
            groupClassIds.add(s.getGroupClassId());
        }

        List<GroupClasses> groupClasses = groupClassesRepository.findAllById(groupClassIds);
        if (groupClasses.isEmpty()) return new ArrayList<>();

        Map<Integer, GroupClasses> groupClassById = new HashMap<>(groupClasses.size() * 2);
        Set<Integer> venueTimeslotsIds = new HashSet<>(groupClasses.size() * 2);
        Set<Integer> comboIds = new HashSet<>(groupClasses.size() * 2);

        for (GroupClasses gc : groupClasses) {
            groupClassById.put(gc.getId(), gc);
            venueTimeslotsIds.add(gc.getVenueTimeslotsId());
            if (gc.getComboId() != null) comboIds.add(gc.getComboId());
        }

        List<VenueTimeslots> venueTimeslotsList = venueTimeslotsRepository.findAllById(venueTimeslotsIds);
        Map<Integer, VenueTimeslots> venueTimeslotsById = new HashMap<>(venueTimeslotsList.size() * 2);

        Set<Integer> venueIds = new HashSet<>();
        Set<Integer> timeslotIds = new HashSet<>();

        for (VenueTimeslots vt : venueTimeslotsList) {
            venueTimeslotsById.put(vt.getId(), vt);
            venueIds.add(vt.getVenueId());
            timeslotIds.add(vt.getTimeslotId());
        }

        List<Venue> venues = venueRepository.findAllById(venueIds);
        Map<Integer, Venue> venueById = new HashMap<>(venues.size() * 2);
        for (Venue v : venues) venueById.put(v.getId(), v);

        List<Timeslots> timeslots = timeslotsRepository.findAllById(timeslotIds);
        Map<Integer, Timeslots> timeslotById = new HashMap<>(timeslots.size() * 2);
        for (Timeslots t : timeslots) timeslotById.put(t.getId(), t);

        List<Combo> combos = comboRepository.findAllById(comboIds);
        Map<Integer, Combo> comboById = new HashMap<>(combos.size() * 2);

        Set<Integer> subjectIds = new HashSet<>();
        Set<Integer> gradeIds = new HashSet<>();

        for (Combo c : combos) {
            comboById.put(c.getId(), c);
            subjectIds.add(c.getSubjectId());
            gradeIds.add(c.getGradeId());
        }

        List<Subject> subjects = subjectRepository.findAllById(subjectIds);
        Map<Integer, Subject> subjectById = new HashMap<>(subjects.size() * 2);
        for (Subject s : subjects) subjectById.put(s.getId(), s);

        List<Grade> grades = gradeRepository.findAllById(gradeIds);
        Map<Integer, Grade> gradeById = new HashMap<>(grades.size() * 2);
        for (Grade g : grades) gradeById.put(g.getId(), g);

        List<GroupClassRecurrenceStudents> rcsList =
                groupClassRecurrenceStudentsRepository.findByGroupClassStudentIdIn(gcsIds);

        if (rcsList.isEmpty()) return new ArrayList<>();

        Set<Integer> recurrenceIds = new HashSet<>(rcsList.size() * 2);
        for (GroupClassRecurrenceStudents rcs : rcsList) recurrenceIds.add(rcs.getGroupClassRecurrenceId());

        LocalDate today = LocalDate.now(ZoneId.of("Africa/Johannesburg"));

        List<GroupClassRecurrenceStatus> allowedStatuses = List.of(
                GroupClassRecurrenceStatus.SCHEDULED,
                GroupClassRecurrenceStatus.CANCELLED
        );

        List<GroupClassRecurrence> upcomingRecurrences =
                groupClassRecurrenceRepository.findByIdInAndStatusInAndClassDateGreaterThanEqual(
                        recurrenceIds,
                        allowedStatuses,
                        today
                );

        if (upcomingRecurrences.isEmpty()) return new ArrayList<>();

        Map<Integer, GroupClassRecurrence> recurrenceById = new HashMap<>(upcomingRecurrences.size() * 2);
        for (GroupClassRecurrence r : upcomingRecurrences) {
            if (r.getStatus() == GroupClassRecurrenceStatus.REMOVED) continue;
            if (r.getStatus() == GroupClassRecurrenceStatus.COMPLETED) continue;
            recurrenceById.put(r.getId(), r);
        }

        if (recurrenceById.isEmpty()) return new ArrayList<>();

        Map<Integer, MyClassesDTO> dtoByClassId = new HashMap<>();
        Map<Integer, List<RecurrenceClassDTO>> recListByClassId = new HashMap<>();

        for (GroupClassRecurrenceStudents rcs : rcsList) {

            GroupClassRecurrence rec = recurrenceById.get(rcs.getGroupClassRecurrenceId());
            if (rec == null) continue;

            GroupClassStudents gcsRow = gcsById.get(rcs.getGroupClassStudentId());
            if (gcsRow == null) continue;

            GroupClasses gc = groupClassById.get(gcsRow.getGroupClassId());
            if (gc == null) continue;

            Integer classId = gc.getId();

            MyClassesDTO base = dtoByClassId.get(classId);
            if (base == null) {
                base = new MyClassesDTO();
                base.setClassId(classId);

                VenueTimeslots vt = venueTimeslotsById.get(gc.getVenueTimeslotsId());
                Venue venue = (vt != null) ? venueById.get(vt.getVenueId()) : null;
                Timeslots ts = (vt != null) ? timeslotById.get(vt.getTimeslotId()) : null;

                Combo combo = comboById.get(gc.getComboId());
                Subject subject = (combo != null) ? subjectById.get(combo.getSubjectId()) : null;
                Grade grade = (combo != null) ? gradeById.get(combo.getGradeId()) : null;

                base.setVenueName(venue != null ? venue.getName() : null);
                base.setSubject(subject != null ? subject.getName() : null);
                base.setGrade(grade != null ? grade.getGrade() : null);

                if (vt != null && vt.getDayOfWeek() != null) {
                    DayOfWeek dayOfWeek = vt.getDayOfWeek();
                    try {
                        base.setDayOfWeek(DayOfWeek.valueOf(dayOfWeek.name()));
                    } catch (Exception ignored) {
                        base.setDayOfWeek(null);
                    }
                }

                TimeslotsDTO tsDto = null;
                if (ts != null) {
                    tsDto = new TimeslotsDTO();
                    tsDto.setId(ts.getId());
                    tsDto.setStartTime(ts.getStartTime());
                    tsDto.setEndTime(ts.getEndTime());
                }
                base.setTimeslot(tsDto);

                dtoByClassId.put(classId, base);
                recListByClassId.put(classId, new ArrayList<>());
            }

            RecurrenceClassDTO recDto = new RecurrenceClassDTO();
            recDto.setRecurrenceClassId(rec.getId());
            recDto.setClassDate(rec.getClassDate());
            recDto.setRecurrenceStatus(rec.getStatus());

            recListByClassId.get(classId).add(recDto);
        }

        List<MyClassesDTO> result = new ArrayList<>(dtoByClassId.values());

        for (MyClassesDTO dto : result) {
            List<RecurrenceClassDTO> list = recListByClassId.get(dto.getClassId());
            if (list == null) list = new ArrayList<>();

            list.sort((a, b) -> {
                LocalDate da = a.getClassDate();
                LocalDate db = b.getClassDate();
                if (da == null && db == null) return 0;
                if (da == null) return 1;
                if (db == null) return -1;
                return da.compareTo(db);
            });

            dto.setRecurrenceClasses(list);
        }

        return result;
    }

    @Transactional
    public void studentCancelClass(Integer groupClassId, Integer userId) {
        //todo payment systems ensure u check for prepaid lessons here to organise refunds
        GroupClassStudents gcs = groupClassStudentsRepository.findByStudentUserIdAndGroupClassIdAndStatus(userId, groupClassId, GroupClassStudentStatus.ACTIVE).orElseThrow(() -> new RuntimeException("student in group class not found"));
        List<GroupClassRecurrence> gcr = groupClassRecurrenceRepository.findByGroupClassIdAndClassDateGreaterThanEqual(gcs.getGroupClassId(), LocalDate.now(ZoneId.of("Africa/Johannesburg")));

        Set<Integer> recurrenceIds = new HashSet<>();
        for (GroupClassRecurrence g : gcr) {
            recurrenceIds.add(g.getId());
        }

        List<GroupClassRecurrenceStudents> groupClassRecurrenceStudents = groupClassRecurrenceStudentsRepository.findByGroupClassStudentIdAndStatusAndGroupClassRecurrenceIdIn(gcs.getId(), GroupClassRecurrenceStudentsStatus.SCHEDULED, recurrenceIds);

        short free_lesson_counter = 0;
        for (GroupClassRecurrenceStudents gcrs : groupClassRecurrenceStudents) {
            if (gcrs.getPaymentMethodSelected() == PaymentMethodSelectedEnum.FREE_LESSON) {
                free_lesson_counter++;
            }
            gcrs.setStatus(GroupClassRecurrenceStudentsStatus.CANCELLED);
        }

        if (free_lesson_counter > 0) {
            User user = userRepository.findByIdForUpdate(userId).orElseThrow();
            user.setFreeLessonsAvailable((short) (user.getFreeLessonsAvailable() + free_lesson_counter));
            userRepository.save(user);
        }

        groupClassRecurrenceStudentsRepository.saveAll(groupClassRecurrenceStudents);

        gcs.setStatus(GroupClassStudentStatus.CANCELLED);
        gcs.setCancelledAt(Instant.now());
        groupClassStudentsRepository.save(gcs);
    }

    public List<TutorClassesDTO> tutorGetAllClasses(Integer userId) {
        Tutor tutor = tutorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("tutor not found"));

        List<GroupClasses> groupClasses =
                groupClassesRepository.findAllByTutorIdAndStatus(tutor.getId(), GroupClassStatus.SCHEDULED);

        Map<Integer, GroupClasses> groupClassesMap = new HashMap<>();
        Set<Integer> groupClassIds = new HashSet<>();
        Set<Integer> venueTimeslotIds = new HashSet<>();
        Set<Integer> comboIds = new HashSet<>();

        for (GroupClasses gc : groupClasses) {
            groupClassesMap.put(gc.getId(), gc);
            groupClassIds.add(gc.getId());
            venueTimeslotIds.add(gc.getVenueTimeslotsId());
            comboIds.add(gc.getComboId());
        }

        List<GroupClassRecurrence> groupClassRecurrences =
                groupClassRecurrenceRepository.findByGroupClassIdInAndStatus(
                        groupClassIds, GroupClassRecurrenceStatus.SCHEDULED
                );

        Map<Integer, List<GroupClassRecurrence>> groupClassRecurrencesMap = new HashMap<>();
        Set<Integer> recurrenceIds = new HashSet<>();
        for (GroupClassRecurrence gcr : groupClassRecurrences) {
            recurrenceIds.add(gcr.getId());
            groupClassRecurrencesMap
                    .computeIfAbsent(gcr.getGroupClassId(), k -> new ArrayList<>())
                    .add(gcr);
        }

        // =========================
        // Fetch recurrence_class_student rows for these recurrenceIds
        // =========================
        List<GroupClassRecurrenceStudents> rcsRows =
                groupClassRecurrenceStudentsRepository.findByGroupClassRecurrenceIdInAndStatus(recurrenceIds, GroupClassRecurrenceStudentsStatus.SCHEDULED);

        Map<Integer, List<GroupClassRecurrenceStudents>> rcsByRecurrenceId = new HashMap<>();
        Set<Integer> groupClassStudentIds = new HashSet<>();
        for (GroupClassRecurrenceStudents rcs : rcsRows) {
            rcsByRecurrenceId
                    .computeIfAbsent(rcs.getGroupClassRecurrenceId(), k -> new ArrayList<>())
                    .add(rcs);

            groupClassStudentIds.add(rcs.getGroupClassStudentId());
        }

        // =========================
        // Fetch GroupClassStudents for those rcs rows (to get student user id)
        // =========================
        List<GroupClassStudents> gcsRows =
                groupClassStudentsRepository.findAllById(groupClassStudentIds);

        Map<Integer, GroupClassStudents> gcsById = new HashMap<>();
        Set<Integer> studentUserIds = new HashSet<>();
        for (GroupClassStudents gcs : gcsRows) {
            gcsById.put(gcs.getId(), gcs);
            studentUserIds.add(gcs.getStudentUserId());
        }

        // =========================
        // Fetch Users for student details
        // =========================
        List<User> studentUsers = userRepository.findAllById(studentUserIds);
        Map<Integer, User> userMap = new HashMap<>();
        for (User u : studentUsers) {
            userMap.put(u.getId(), u);
        }

        // =========================
        // VenueTimeslots -> Venue + Timeslot + DayOfWeek
        // =========================
        List<VenueTimeslots> venueTimeslots =
                venueTimeslotsRepository.findAllById(venueTimeslotIds);

        Map<Integer, VenueTimeslots> venueTimeslotsMap = new HashMap<>();
        Set<Integer> venueIds = new HashSet<>();
        Set<Integer> timeslotIds = new HashSet<>();
        for (VenueTimeslots vt : venueTimeslots) {
            venueTimeslotsMap.put(vt.getId(), vt);
            venueIds.add(vt.getVenueId());
            timeslotIds.add(vt.getTimeslotId());
        }

        List<Venue> venues = venueRepository.findAllById(venueIds);
        Map<Integer, Venue> venueMap = new HashMap<>();
        for (Venue v : venues) {
            venueMap.put(v.getId(), v);
        }

        List<Timeslots> timeslots = timeslotsRepository.findAllById(timeslotIds);
        Map<Integer, Timeslots> timeslotsMap = new HashMap<>();
        for (Timeslots ts : timeslots) {
            timeslotsMap.put(ts.getId(), ts);
        }

        // =========================
        // Combo -> Subject + Grade
        // =========================
        List<Combo> combos =
                comboRepository.findAllById(comboIds);

        Map<Integer, Combo> combosMap = new HashMap<>();
        Set<Integer> subjectIds = new HashSet<>();
        Set<Integer> gradeIds = new HashSet<>();
        for (Combo c : combos) {
            combosMap.put(c.getId(), c);
            subjectIds.add(c.getSubjectId());
            gradeIds.add(c.getGradeId());
        }

        List<Subject> subjects = subjectsRepository.findAllById(subjectIds);
        Map<Integer, Subject> subjectsMap = new HashMap<>();
        for (Subject s : subjects) {
            subjectsMap.put(s.getId(), s);
        }

        List<Grade> grades = gradeRepository.findAllById(gradeIds);
        Map<Integer, Grade> gradesMap = new HashMap<>();
        for (Grade g : grades) {
            gradesMap.put(g.getId(), g);
        }

        // =========================
        // Build output
        // =========================
        List<TutorClassesDTO> result = new ArrayList<>();
        for (GroupClasses gc : groupClasses) {
            TutorClassesDTO dto = new TutorClassesDTO();
            dto.setClassId(gc.getId());

            // recurrence classes (with students)
            List<GroupClassRecurrence> gcrList =
                    groupClassRecurrencesMap.getOrDefault(gc.getId(), new ArrayList<>());

            List<TutorRecurrenceClassesDTO> recurrenceDtos = new ArrayList<>(gcrList.size());
            for (GroupClassRecurrence gcr : gcrList) {
                TutorRecurrenceClassesDTO r = new TutorRecurrenceClassesDTO();
                r.setRecurrenceClassId(gcr.getId());
                r.setClassDate(gcr.getClassDate());
                r.setRecurrenceStatus(gcr.getStatus());

                List<GroupClassRecurrenceStudents> rcsList =
                        rcsByRecurrenceId.getOrDefault(gcr.getId(), new ArrayList<>());

                List<StudentDTO> students = new ArrayList<>(rcsList.size());
                for (GroupClassRecurrenceStudents rcs : rcsList) {
                    GroupClassStudents gcs = gcsById.get(rcs.getGroupClassStudentId());
                    if (gcs == null) continue;

                    User u = userMap.get(gcs.getStudentUserId());
                    if (u == null) continue;

                    StudentDTO sdto = new StudentDTO();
                    sdto.setStudentUserId(u.getId());

                    sdto.setRecurrenceClassStudentId(rcs.getId());

                    sdto.setStudentFirstName(u.getFirstName());
                    sdto.setStudentLastName(u.getSurname());

                    sdto.setPaymentMethodSelected(rcs.getPaymentMethodSelected());

                    students.add(sdto);
                }


                r.setStudents(students);
                recurrenceDtos.add(r);
            }
            dto.setRecurrenceClasses(recurrenceDtos);

            // venue + timeslot + day of week
            VenueTimeslots vt = venueTimeslotsMap.get(gc.getVenueTimeslotsId());
            if (vt != null) {
                Venue v = venueMap.get(vt.getVenueId());
                if (v != null) {
                    dto.setVenueName(v.getName());
                }

                Timeslots ts = timeslotsMap.get(vt.getTimeslotId());
                if (ts != null) {
                    TimeslotsDTO tsDto = new TimeslotsDTO();
                    tsDto.setId(ts.getId());
                    tsDto.setStartTime(ts.getStartTime());
                    tsDto.setEndTime(ts.getEndTime());
                    tsDto.setTurnaroundMinutes(ts.getTurnaroundMinutes());
                    dto.setTimeslot(tsDto);
                }

                dto.setDayOfWeek(vt.getDayOfWeek());
            }

            // subject + grade (via combo)
            Combo combo = combosMap.get(gc.getComboId());
            if (combo != null) {
                Subject s = subjectsMap.get(combo.getSubjectId());
                if (s != null) {
                    dto.setSubject(s.getName());
                }

                Grade g = gradesMap.get(combo.getGradeId());
                if (g != null) {
                    dto.setGrade(g.getGrade());
                }
            }

            result.add(dto);
        }

        return result;
    }

    @Transactional
    public void tutorValidateClass(ValidateClassDTO dto, Integer userId) {
        GroupClassRecurrence gcr = groupClassRecurrenceRepository.findById(dto.getGroupClassRecurrenceId())
                .orElseThrow(() -> new RuntimeException("GroupClassRecurrence not found"));

        GroupClasses groupClass = groupClassesRepository.findById(gcr.getGroupClassId()).orElseThrow(() -> new RuntimeException("GroupClass not found"));
        Tutor tutor = tutorRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("tutor not found"));
        if (groupClass.getTutorId() != tutor.getId()) {
            throw new RuntimeException("tutor does not own this class");
        }


        if (dto.getStudentPaymentDTOs() == null || dto.getStudentPaymentDTOs().isEmpty()) {
            throw new RuntimeException("No students provided");
        }

        // 1) Load and lock all recurrence_class_student rows in one go
        Set<Integer> rcsIds = new HashSet<>();
        for (ValidateStudentPaymentDTO s : dto.getStudentPaymentDTOs()) {
            if (s.getRecurrenceStudentId() == null) {
                throw new RuntimeException("recurrenceStudentId missing");
            }
            rcsIds.add(s.getRecurrenceStudentId());
        }

        List<GroupClassRecurrenceStudents> rcsRows = groupClassRecurrenceStudentsRepository.findAllById(rcsIds);

        if (rcsRows.size() != rcsIds.size()) {
            throw new RuntimeException("One or more recurrence students not found");
        }

        Map<Integer, GroupClassRecurrenceStudents> rcsById = new HashMap<>(rcsRows.size() * 2);
        for (GroupClassRecurrenceStudents rcs : rcsRows) {
            // Safety: ensure they belong to this recurrence
            if (!Objects.equals(rcs.getGroupClassRecurrenceId(), gcr.getId())) {
                throw new RuntimeException("recurrenceStudentId does not belong to this class recurrence");
            }
            rcsById.put(rcs.getId(), rcs);
        }

        // 2) Apply updates + optionally create payment rows
        boolean allStudentPaid = true;
        List<ClassStudentPayments> paymentsToInsert = new ArrayList<>();

        for (ValidateStudentPaymentDTO s : dto.getStudentPaymentDTOs()) {

            GroupClassRecurrenceStudents rcs = rcsById.get(s.getRecurrenceStudentId());
            if (rcs == null) {
                throw new RuntimeException("GroupClassRecurrenceStudents not found");
            }

            // Don’t allow tutor to validate a cancelled row (optional but sane)
            if (rcs.getStatus() == GroupClassRecurrenceStudentsStatus.CANCELLED
                    || rcs.getStatus() == GroupClassRecurrenceStudentsStatus.TUTOR_CANCELLED) {
                throw new RuntimeException("Cannot validate a cancelled student row");
            }

            // Attendance status update (required)
            if (s.getStatus() == null) {
                throw new RuntimeException("Student status missing");
            }
            rcs.setStatus(s.getStatus());

            // Payment method update (optional, but usually present if payment info present)
            if (s.getPaymentMethodSelected() != null) {
                rcs.setPaymentMethodSelected(s.getPaymentMethodSelected());
            }

            // Decide if we should insert payment row:
            // Only if payment info was provided in DTO (your rule)
            boolean hasPaymentInfo =
                    s.getPaymentMethodSelected() != null
                            && (s.getPaymentMethodSelected() == PaymentMethodSelectedEnum.FREE_LESSON
                            || (s.getPaymentMethodSelected() == PaymentMethodSelectedEnum.CASH
                            && s.getAmountPaid() != null
                            && !s.getAmountPaid().trim().isEmpty()));

            // Only require payment if ATTENDED (otherwise absent doesn’t block completion)
            boolean requiresPayment = (s.getStatus() == GroupClassRecurrenceStudentsStatus.ATTENDED);

            if (requiresPayment) {
                if (!hasPaymentInfo) {
                    allStudentPaid = false;
                } else {
                    // Insert payment once (unique constraint exists; we check to be nice)
                    if (!classStudentPaymentsRepository.existsByRecurrenceClassStudentId(rcs.getId())) {
                        ClassStudentPayments p = new ClassStudentPayments();
                        p.setRecurrenceClassStudentId(rcs.getId());

                        if (s.getPaymentMethodSelected() == PaymentMethodSelectedEnum.FREE_LESSON) {
                            p.setAmount(BigDecimal.ZERO);
                        } else {
                            // CASH
                            try {
                                BigDecimal amount = new BigDecimal(s.getAmountPaid().trim());
                                if (amount.compareTo(BigDecimal.ZERO) < 0) {
                                    throw new RuntimeException("amountPaid cannot be negative");
                                }
                                p.setAmount(amount);
                            } catch (NumberFormatException ex) {
                                throw new RuntimeException("Invalid amountPaid: " + s.getAmountPaid());
                            }
                        }

                        paymentsToInsert.add(p);
                    }
                }
            }
        }

        // 3) Persist changes
        groupClassRecurrenceStudentsRepository.saveAll(rcsRows);

        if (!paymentsToInsert.isEmpty()) {
            classStudentPaymentsRepository.saveAll(paymentsToInsert);
        }

        // 4) Mark recurrence complete if everyone who attended has paid
        if (allStudentPaid) {
            gcr.setStatus(GroupClassRecurrenceStatus.COMPLETED);
            groupClassRecurrenceRepository.save(gcr);
        }
    }

    @Transactional
    public void tutorCancelRecurrenceClass(Integer groupClassRecurrenceId, Integer userId) {
        Tutor tutor = tutorRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("tutor not found"));
        GroupClassRecurrence groupClassRecurrence = groupClassRecurrenceRepository.findByIdForUpdate(groupClassRecurrenceId).orElseThrow(() -> new RuntimeException("GroupClassRecurrence not found"));
        GroupClasses groupClasses = groupClassesRepository.findById(groupClassRecurrence.getGroupClassId()).orElseThrow(() -> new RuntimeException("GroupClass not found"));
        if ((int) groupClasses.getTutorId() != (int) tutor.getId()) {
            throw new RuntimeException("tutor does not own this class");
        }

        List<GroupClassRecurrenceStudents> groupClassRecurrenceStudents = groupClassRecurrenceStudentsRepository.findByGroupClassRecurrenceIdAndStatus(groupClassRecurrenceId, GroupClassRecurrenceStudentsStatus.SCHEDULED);

        Set<Integer> studentsWithFreeLessonsGroupClassId = new HashSet<>();
        for (GroupClassRecurrenceStudents gcrs : groupClassRecurrenceStudents) {
            gcrs.setStatus(GroupClassRecurrenceStudentsStatus.TUTOR_CANCELLED);
            if (gcrs.getPaymentMethodSelected() == PaymentMethodSelectedEnum.FREE_LESSON) {
                studentsWithFreeLessonsGroupClassId.add(gcrs.getGroupClassStudentId());
            }
        }

        List<GroupClassStudents> gcr = groupClassStudentsRepository.findByIdIn(studentsWithFreeLessonsGroupClassId);

        Set<Integer> userIds = new HashSet<>();
        for (GroupClassStudents gcs : gcr) {
            userIds.add(gcs.getStudentUserId());
        }

        List<User> users = userRepository.findAllByIdIn(userIds);
        for (User user : users) {
            user.setFreeLessonsAvailable((short) (user.getFreeLessonsAvailable() + 1));
        }

        groupClassRecurrence.setStatus(GroupClassRecurrenceStatus.CANCELLED);

        groupClassStudentsRepository.saveAll(gcr);
        groupClassRecurrenceStudentsRepository.saveAll(groupClassRecurrenceStudents);
        userRepository.saveAll(users);
        groupClassRecurrenceRepository.save(groupClassRecurrence);
    }

    public long getPendingGroupClassesCount(Integer userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("user not found"));
        if (user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only admins can access this endpoint");
        }

        return  groupClassesRepository.countByStatus(GroupClassStatus.PENDING);
    }


}
