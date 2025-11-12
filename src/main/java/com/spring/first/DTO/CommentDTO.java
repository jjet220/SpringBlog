package com.spring.first.DTO;

import com.spring.first.model.User;
import lombok.*;
import com.spring.first.model.Comment;
import java.time.LocalDate;
import java.util.Base64;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long id;
    private int likes;
    private LocalDate dateOfPublication;
    private String text;
    private Long userId;
    private String userName;
    private String postName;
    private Long postId;
    private int likeCount;
    private String authorAvatarBase64;
    private String authorAvatarContentType;

    public static CommentDTO fromEntity(Comment comment) {
        User author = comment.getUser();
        return CommentDTO.builder()
                .id(comment.getId())
                .likes(comment.getLikes())
                .dateOfPublication(comment.getDateOfPublication())
                .text(comment.getText())
                .userId(author.getId())
                .userName(author.getName())
                .postName(comment.getPost().getNamePost())
                .postId(comment.getPost().getId())
                .likeCount(comment.getCommentLikes().size())
                .authorAvatarContentType(author.getAvatarContentType())
                .authorAvatarBase64(author.getAvatar() != null ? Base64.getEncoder().encodeToString(author.getAvatar()) : null)
                .build();
    }

    public Comment toEntity() {
        return Comment.builder()
                .id(this.id)
                .likes(this.likes)
                .dateOfPublication(this.dateOfPublication)
                .text(this.text)
                .build();
    }
}
