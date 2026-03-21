package org.hotelbooking.userservice.controller;

import lombok.RequiredArgsConstructor;
import org.hotelbooking.userservice.dto.AuthResponse;
import org.hotelbooking.userservice.dto.LoginRequest;
import org.hotelbooking.userservice.dto.RegisterRequest;
import org.hotelbooking.userservice.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        String token = service.register(request);
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        String token = service.login(request);
        return ResponseEntity.ok(new AuthResponse(token));
    }
}
