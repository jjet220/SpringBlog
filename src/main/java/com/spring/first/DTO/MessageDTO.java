package com.spring.first.DTO;

import com.spring.first.model.Message;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import lombok.*;
import org.springframework.security.core.parameters.P;

import java.time.LocalDateTime;
import java.util.Base64;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long id;
    private String text;
    private LocalDateTime publicationDateTime;
    private String authorAvatarBase64;
    private String authorAvatarContentType;
    private String authorName;
    private Long chatId;
    private Long userId;

    public static MessageDTO fromEntity(Message message){
        User user = message.getUser();
        return MessageDTO.builder()
                .id(message.getId())
                .publicationDateTime(message.getPublicationDateTime())
                .text(message.getTextOfMessage())
                .userId(user.getId())
                .authorName(user.getName())
                .authorAvatarContentType(user.getAvatarContentType())
                .authorAvatarBase64(user.getAvatar() != null ? Base64.getEncoder().encodeToString(user.getAvatar()) : null)
                .build();
    }

    public Message toEntity() {
        return Message.builder()
                .id(this.id)
                .publicationDateTime(this.publicationDateTime)
                .textOfMessage(this.text)
                .build();
    }
}
