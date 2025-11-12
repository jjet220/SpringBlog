package com.spring.first.DTO;

import com.spring.first.model.User;
import lombok.*;
import com.spring.first.model.Post;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Base64;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String password;
    private LocalDate dateOfBirth;
    private LocalDate registrationDate;
    private String roles;
    private String avatarContentType;
    private String avatarBase64;

    private Set<Long> friendIds;
    private Set<Long> favoritePostIds;

    public static UserDTO fromEntity(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .dateOfBirth(user.getDateOfBirth())
                .registrationDate(user.getRegistrationDate())
                .roles(user.getRoles())
                .avatarContentType(user.getAvatarContentType())
                .avatarBase64(user.getAvatar() != null ?
                        Base64.getEncoder().encodeToString(user.getAvatar()) : null)
                .friendIds(user.getFriends().stream()
                        .map(User::getId)
                        .collect(Collectors.toSet()))
                .favoritePostIds(user.getFavoritePosts().stream()
                        .map(Post::getId)
                        .collect(Collectors.toSet()))
                .build();
    }

    public User toEntity() {
        User user = new User();
        user.setId(this.id);
        user.setName(this.name);
        user.setEmail(this.email);
        user.setPassword(this.password);
        user.setDateOfBirth(this.dateOfBirth);
        user.setRegistrationDate(this.registrationDate);
        user.setRoles(this.roles != null ? this.roles : "ROLE_USER");
        if (this.avatarBase64 != null && this.avatarContentType != null) {
            user.setAvatar(Base64.getDecoder().decode(this.avatarBase64));
            user.setAvatarContentType(this.avatarContentType);
        }
        return user;
    }

}