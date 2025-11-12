package com.spring.first.DTO;

import com.spring.first.model.Chat;
import com.spring.first.model.Comment;
import com.spring.first.model.User;
import lombok.*;

import java.time.LocalDate;
import java.util.Base64;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatDTO {
    private Long id;
    private Long userId;
    private String userName;
    private Long messageCount;
    private LocalDate creationDate;

    public static ChatDTO fromEntity(Chat chat) {
        User user = chat.getUser();
        return ChatDTO.builder()
                .id(chat.getId())
                .userId(user.getId())
                .userName(user.getName())
                .messageCount((long) chat.getMessages().size())
                .creationDate(chat.getCreationDate())
                .build();
    }

    public Chat toEntity() {
        return Chat.builder()
                .id(this.id)
                .build();
    }
}
