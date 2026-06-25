package com.recipe.controller;

import com.recipe.dto.ProfileUpdateRequest;
import com.recipe.dto.UserDto;
import com.recipe.entity.User;
import com.recipe.service.AuthService;
import com.recipe.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<UserDto> getUserProfile(@PathVariable String username) {
        UserDto profile = userService.getUserProfile(username);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@RequestBody ProfileUpdateRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        UserDto updated = userService.updateProfile(currentUser, request.getBio(), request.getProfilePictureUrl());
        return ResponseEntity.ok(updated);
    }
}
