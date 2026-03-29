package org.hotelbooking.userservice.controller;

import lombok.RequiredArgsConstructor;
import org.hotelbooking.userservice.dto.UserDTO;
import org.hotelbooking.userservice.enitity.User;
import org.hotelbooking.userservice.exceptions.UserNotFoundException;
import org.hotelbooking.userservice.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable("id") String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
        return ResponseEntity.ok(new UserDTO(user.getId(), user.getName(), user.getEmail()));
    }
}
