package com.recipe.controller;

import com.recipe.dto.AuthResponse;
import com.recipe.dto.LoginRequest;
import com.recipe.dto.RegisterRequest;
import com.recipe.dto.UserDto;
import com.recipe.entity.User;
import com.recipe.service.AuthService;
import com.recipe.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        UserDto profile = userService.getUserProfile(currentUser.getUsername());
        return ResponseEntity.ok(profile);
    }
}
