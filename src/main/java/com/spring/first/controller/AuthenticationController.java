package com.spring.first.controller;

import com.spring.first.DTO.SignInRequest;
import com.spring.first.DTO.UserDTO;
import com.spring.first.config.AuthenticationService;
import com.spring.first.config.JwtAuthenticationResponse;
import com.spring.first.config.JwtService;
import com.spring.first.model.User;
import com.spring.first.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping("/protected")
    public ResponseEntity<String> getProtectedData() {
        return ResponseEntity.ok("This is protected data");
    }

    @PostMapping("/signup")
    public ResponseEntity<JwtAuthenticationResponse> signUp(@RequestBody @Valid UserDTO request) {
        return ResponseEntity.ok(authenticationService.signUp(request));
    }

    @PostMapping("/signin")
    public ResponseEntity<JwtAuthenticationResponse> signIn(@RequestBody @Valid SignInRequest request) {
        System.out.println("Received signin request: " + request);
        User user = userRepository.findByName(request.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        authenticationService.verifyPassword(request.getPassword(), user.getPassword());
        return ResponseEntity.ok(authenticationService.signIn(request));
    }

}
