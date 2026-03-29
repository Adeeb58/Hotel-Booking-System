package org.hotelbooking.userservice.service;

import lombok.RequiredArgsConstructor;
import org.hotelbooking.userservice.dto.LoginRequest;
import org.hotelbooking.userservice.dto.RegisterRequest;
import org.hotelbooking.userservice.enitity.Role;
import org.hotelbooking.userservice.enitity.User;
import org.hotelbooking.userservice.exceptions.InvalidCredentialsException;
import org.hotelbooking.userservice.exceptions.UserAlreadyExistsException;
import org.hotelbooking.userservice.exceptions.UserNotFoundException;
import org.hotelbooking.userservice.repository.UserRepository;
import org.hotelbooking.userservice.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.UUID;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder encoder;

    @Value("${google.client-id:}")
    private String googleClientId;

    public String register(RegisterRequest request) {

        if (repo.findByEmail(request.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException("User already exists with this email");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(Role.USER);

        repo.save(user);

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
    }

    public String login(LoginRequest request) {

        User user = repo.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
    }

    public String loginWithGoogle(String credential) {
        if (credential == null || credential.isBlank()) {
            throw new InvalidCredentialsException("Google credential is required");
        }
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new InvalidCredentialsException("Google login is not configured");
        }

        GoogleIdToken.Payload payload = verifyGoogleToken(credential);
        String email = payload.getEmail();

        if (email == null || email.isBlank()) {
            throw new InvalidCredentialsException("Google account email is unavailable");
        }

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new InvalidCredentialsException("Google email is not verified");
        }

        User user = repo.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            String name = (String) payload.get("name");
            newUser.setName((name == null || name.isBlank()) ? email.split("@")[0] : name);
            newUser.setEmail(email);
            newUser.setPassword(encoder.encode(UUID.randomUUID().toString()));
            newUser.setRole(Role.USER);
            return repo.save(newUser);
        });

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
    }

    private GoogleIdToken.Payload verifyGoogleToken(String credential) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new InvalidCredentialsException("Invalid Google token");
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | IOException e) {
            throw new InvalidCredentialsException("Failed to verify Google token");
        }
    }
}
