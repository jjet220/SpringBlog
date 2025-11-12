package com.spring.first.DTO;

import com.spring.first.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Base64;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserWithAvatarDTO {
    private Long id;
    private String name;
    private String email;
    private String avatarContentType;
    private String avatarBase64;

    public UserWithAvatarDTO(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.avatarContentType = user.getAvatarContentType();
        this.avatarBase64 = user.getAvatar() != null ?
                Base64.getEncoder().encodeToString(user.getAvatar()) : null;
    }
}