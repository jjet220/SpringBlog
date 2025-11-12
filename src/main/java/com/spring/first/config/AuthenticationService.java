package com.spring.first.config;

import com.spring.first.DTO.SignInRequest;
import com.spring.first.DTO.UserDTO;
import com.spring.first.model.User;
import com.spring.first.repository.UserRepository;
import com.spring.first.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final MyUserDetailsService userDetailsService;


    public JwtAuthenticationResponse signUp(UserDTO request) {
        var user = UserDTO.builder()
                .name(request.getName())
                .email(request.getEmail())
                .dateOfBirth(request.getDateOfBirth())
                .password(request.getPassword())
                .roles("ROLE_USER")
                .build();

        userService.saveUserDTO(user);

        var userDetails = userDetailsService.loadUserByUsername(request.getName());
        var jwt = jwtService.generateToken(userDetails);//Под вопросом???
        return new JwtAuthenticationResponse(jwt);
    }


    public JwtAuthenticationResponse signIn(SignInRequest request) {

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.getName(),
                request.getPassword()
        ));

        var user = userDetailsService.loadUserByUsername(request.getName());
        var jwt = jwtService.generateToken(user);
        return  new JwtAuthenticationResponse(jwt);
    }

    public void verifyPassword(String rawPassword, String encodedPassword) {
        System.out.println("Raw password: " + rawPassword);
        System.out.println("Encoded password: " + encodedPassword);
        System.out.println("Matches: " + passwordEncoder.matches(rawPassword, encodedPassword));

        String newEncoded = passwordEncoder.encode(rawPassword);
        System.out.println("New encoded: " + newEncoded);
        System.out.println("New matches: " + passwordEncoder.matches(rawPassword, newEncoded));
    }

}
