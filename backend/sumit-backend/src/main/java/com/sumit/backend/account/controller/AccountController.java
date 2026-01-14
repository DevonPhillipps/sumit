package com.sumit.backend.account.controller;

import com.sumit.backend.account.repository.UserRepository;
import com.sumit.backend.account.service.AccountService;
import com.sumit.backend.classes.dto.GetBookClassPageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    @Autowired
    AccountService accountService;

    @GetMapping("get-number-available-free-lessons")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Short> getNumberAvailableFreeLessons(@AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = Integer.parseInt(userDetails.getUsername());
        return ResponseEntity.ok(accountService.getNumberAvailableFreeLessons(userId));
    }
}
