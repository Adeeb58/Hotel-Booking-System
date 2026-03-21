package org.hotelbooking.userservice.service;

import org.hotelbooking.userservice.dto.LoginRequest;
import org.hotelbooking.userservice.dto.RegisterRequest;
import org.hotelbooking.userservice.enitity.Role;
import org.hotelbooking.userservice.enitity.User;
import org.hotelbooking.userservice.exceptions.InvalidCredentialsException;
import org.hotelbooking.userservice.exceptions.UserAlreadyExistsException;
import org.hotelbooking.userservice.exceptions.UserNotFoundException;
import org.hotelbooking.userservice.repository.UserRepository;
import org.hotelbooking.userservice.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, jwtUtil, passwordEncoder);
    }

    @Test
    void register_createsUserAndReturnsToken() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Adeeb");
        request.setEmail("adeeb@mail.com");
        request.setPassword("plain-pass");

        when(userRepository.findByEmail("adeeb@mail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plain-pass")).thenReturn("hashed-pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId("u-1");
            return u;
        });
        when(jwtUtil.generateToken("adeeb@mail.com", "USER", "u-1")).thenReturn("jwt-token");

        String token = authService.register(request);

        assertEquals("jwt-token", token);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_throwsWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@mail.com");

        when(userRepository.findByEmail("existing@mail.com")).thenReturn(Optional.of(new User()));

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
    }

    @Test
    void login_returnsTokenWhenCredentialsValid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@mail.com");
        request.setPassword("pass");

        User user = new User();
        user.setId("u-2");
        user.setEmail("user@mail.com");
        user.setPassword("hashed");
        user.setRole(Role.USER);

        when(userRepository.findByEmail("user@mail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken("user@mail.com", "USER", "u-2")).thenReturn("jwt-2");

        String token = authService.login(request);

        assertEquals("jwt-2", token);
    }

    @Test
    void login_throwsWhenUserNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("missing@mail.com");
        request.setPassword("pass");

        when(userRepository.findByEmail("missing@mail.com")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> authService.login(request));
    }

    @Test
    void login_throwsWhenPasswordInvalid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@mail.com");
        request.setPassword("wrong");

        User user = new User();
        user.setEmail("user@mail.com");
        user.setPassword("hashed");
        user.setRole(Role.USER);

        when(userRepository.findByEmail("user@mail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }
}
