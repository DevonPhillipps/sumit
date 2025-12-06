package com.sumit.backend.account.repository;

import com.sumit.backend.account.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

//<User, Integer>, the User tells JPA which class we are using
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    //remember it removes findBy and keeps just Email and then converts to camel case so email and checks
    //user if it has a matching local var named email
    User findByEmail(String email);
    boolean existsByEmail(String email);
    User findByPhoneNumber(String phoneNumber);
    boolean existsByPhoneNumber(String phoneNumber);
}