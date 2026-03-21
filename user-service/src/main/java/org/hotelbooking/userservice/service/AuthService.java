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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder encoder;

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

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }

    public String login(LoginRequest request) {

        User user = repo.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }
}
