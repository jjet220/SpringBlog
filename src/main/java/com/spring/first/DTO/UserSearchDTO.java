package com.spring.first.DTO;

import com.spring.first.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchDTO {
    private Long id;
    private String name;
    private String avatarUrl;
    private String avatarContentType; // Добавляем content type

    public static UserSearchDTO fromEntity(User user) {
        String avatarUrl = null;
        if (user.getAvatar() != null) {
            avatarUrl = "/api/v1/users/" + user.getId() + "/avatar";
        }

        return new UserSearchDTO(
                user.getId(),
                user.getName(),
                avatarUrl,
                user.getAvatarContentType()
        );
    }
}