package com.spring.first.DTO;

import com.spring.first.model.Post;
import com.spring.first.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostSearchDTO {
    private Long id;
    private String namePost;
    private String avatarUrl;
    private String avatarContentType;

    public static PostSearchDTO fromEntity(Post post) {
        String avatarUrl = null;
        if (post.getUser().getAvatar() != null) {
            avatarUrl = "/api/v1/users/" + post.getUser().getId() + "/avatar";
        }

        return new PostSearchDTO(
                post.getId(),
                post.getNamePost(),
                avatarUrl,
                post.getUser().getAvatarContentType()
        );
    }
}
