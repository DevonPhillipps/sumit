package com.sumit.backend.account.repository;

import com.sumit.backend.account.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

//<User, Integer>, the User tells JPA which class we are using
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    //remember it removes findBy and keeps just Email and then converts to camel case so email and checks
    //user if it has a matching local var named email
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    User findByPhoneNumber(String phoneNumber);
    boolean existsByPhoneNumber(String phoneNumber);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Integer id);
}