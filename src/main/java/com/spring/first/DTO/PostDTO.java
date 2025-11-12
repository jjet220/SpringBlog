package com.spring.first.DTO;


import com.spring.first.model.Post;
import com.spring.first.model.User;
import lombok.*;

import java.time.LocalDate;
import java.util.Base64;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private Long id;
    private String namePost;
    private int likes;
    private int views;
    private LocalDate dateOfPublication;
    private String text;
    private String theme;
    private Long userId;
    private String authorName;
    private String authorAvatarBase64;
    private String authorAvatarContentType;

    public static PostDTO fromEntity(Post post) {
        User author = post.getUser();
        return PostDTO.builder()
                .id(post.getId())
                .namePost(post.getNamePost())
                .likes(post.getLikes())
                .views(post.getViews())
                .dateOfPublication(post.getDateOfPublication())
                .text(post.getText())
                .theme(post.getTheme())
                .userId(author.getId())
                .authorName(author.getName())
                .authorAvatarContentType(author.getAvatarContentType())
                .authorAvatarBase64(author.getAvatar() != null ? Base64.getEncoder().encodeToString(author.getAvatar()) : null)
                .build();
    }

    public Post toEntity() {
        return Post.builder()
                .id(this.id)
                .namePost(this.namePost)
                .likes(this.likes)
                .views(this.views)
                .dateOfPublication(this.dateOfPublication)
                .text(this.text)
                .theme(this.theme)
                .build();
    }
}