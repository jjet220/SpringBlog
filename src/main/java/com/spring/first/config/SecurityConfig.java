package com.spring.first.config;

import com.spring.first.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@Profile("main")
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final MyUserDetailsService userDetailsService;

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {

        return new MyUserDetailsService(userRepository);
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfiguration = new CorsConfiguration();
                    corsConfiguration.setAllowedOriginPatterns(List.of("http://localhost:8080"));
                    corsConfiguration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
                    corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    corsConfiguration.setAllowedHeaders(List.of("*"));
                    corsConfiguration.setAllowCredentials(true);
                    return corsConfiguration;
                }))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.getWriter().write(
                                    "{\"error\":\"Требуется аутентификация\"," +
                                            "\"details\":\"" + authException.getMessage() + "\"}"
                            );
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/swagger-ui/index.html"
                                , "/api/v1/posts"
                                , "/api/v1/comments/count/{postId}"
                                , "/profile/{userId}"
                                ,"/api/v1/users/profile/${userId}"
                                , "/ribbon"
                                ,"/post/{id}"
                                , "/api/v1/posts/sort"
                                ,"/api/v1/posts/count/{postId}"
                                , "/api/v1/message/all_messages"
                                , "/api/v1/users/profile/{userId}"
                                ,"/api/v1/users/default-avatar"
                                ,"/api/v1/users/{userId}/avatar"
                                ,"/api/v1/comments/{userId}/comments"
                                ,"/panel-admin"
                                ,"/api/v1/comments/like/count/{commentId}"
                                , "/api/v1/auth/signin"
                                ,"/api/v1/auth/protected"
                                , "/welcome").permitAll()
                        .requestMatchers("/registration",
                                "/api/v1/auth/signup"
                                ,"/api/v1/users/save_userDTO"
                                ,"/authentication"
                                , "/api/v1/posts/{id}/user_posts").anonymous()
                        //.requestMatchers("/panel-admin").hasRole("ADMIN")
                        .requestMatchers("/api/v1/posts/publication_post").authenticated()
                        .requestMatchers("/api/v1/posts/update_post/{postId}").authenticated()
                        .requestMatchers("/api/v1/posts/delete_post/{postId}").authenticated()
                        .requestMatchers("/api/v1/posts/{postId}").authenticated()
                        .requestMatchers("/api/v1/users/me").authenticated()
                        .requestMatchers("/api/v1/posts/put_like").authenticated()
                        .requestMatchers("/api/v1/posts/is_liked").authenticated()
                        .requestMatchers("/api/v1/chat/create").authenticated()
                        .requestMatchers("/api/v1/message/send_message").authenticated()
                        .requestMatchers("/api/v1/comments/{postId}/comments_of_post").authenticated()
                        .requestMatchers("/api/v1/comments/put_like").authenticated()
                        .requestMatchers("/api/v1/comments/is_liked").authenticated()
                        .requestMatchers("/api/v1/comments/write_comment/{postId}").authenticated()
                        .requestMatchers("/api/v1/comments/delete_comment/{commentId}").authenticated()
                        .requestMatchers("/api/v1/comments/update_comment/{commentId}").authenticated()
                        .requestMatchers("/api/v1/comments/{commentId}").authenticated()
                        .requestMatchers("/api/v1/chat/all").authenticated()
                        .requestMatchers("/api/v1/chat/create").authenticated()
                        .requestMatchers("/api/v1/chat/delete/{chatId}").authenticated()
                        .requestMatchers("/api/v1/users/update_user/{userId}").authenticated()
                        .requestMatchers("/api/v1/users/send_friend").authenticated()
                        .requestMatchers("/api/v1/users/accept_friend").authenticated()
                        .requestMatchers("/api/v1/users/remove_friend").authenticated()
                        .requestMatchers("/api/v1/users/check_relationship").authenticated()
                        .requestMatchers("/api/v1/users/incoming_friend_requests").authenticated()
                        .requestMatchers("/api/v1/users/outgoing_friend_requests").authenticated()
                        .requestMatchers("/api/v1/users/find_friends/{userId}").authenticated()
                        .requestMatchers("/api/v1/users/{userId}/avatarUP").authenticated()
                        .requestMatchers("/api/v1/users/{userId}/avatarRM").authenticated()
                        .requestMatchers("/api/v1/users/check_password").authenticated()
                        .requestMatchers("/api/v1/users/{userId}").authenticated()
                        .requestMatchers("/api/v1/users/users_count").authenticated()
                        .requestMatchers("/api/v1/posts/posts_count").authenticated()
                        .requestMatchers("/api/v1/comments/count_comments").authenticated()
                        .requestMatchers("/api/v1/comments/count_posts").authenticated()
                        .requestMatchers("/api/v1/comments/count_users").authenticated()
                        .requestMatchers("/api/v1/message/messages_count").authenticated()
                        .requestMatchers("/api/v1/users/delete_user/{userId}").authenticated()
                        .requestMatchers("/api/v1/posts/search_post").authenticated()
                        .requestMatchers("/api/v1/users/search_user").authenticated()
                        .requestMatchers("/api/v1/users/all_user").authenticated()
                        .requestMatchers("/api/v1/users/welcome").authenticated())
                .sessionManagement(manager -> manager.sessionCreationPolicy(STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setUserDetailsService(userDetailsService);
        authenticationProvider.setPasswordEncoder(passwordEncoder());
        return authenticationProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
