package com.spring.first.controller;

import com.spring.first.DTO.MessageDTO;
import com.spring.first.config.JwtService;
import com.spring.first.model.Chat;
import com.spring.first.model.Message;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import com.spring.first.repository.ChatRepository;
import com.spring.first.repository.MessageRepository;
import com.spring.first.repository.UserRepository;
import com.spring.first.service.MessageService;
import com.spring.first.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Tag(name = "message_methods")
@RestController
@RequestMapping("/api/v1/message")
public class MessageController {
    private final JwtService jwtService;
    private final UserService userService;
    private final MessageService messageService;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final PagedResourcesAssembler<Message> messagePagedResourcesAssembler;

    private static final int MAX_MESSAGES = 200;

    @Operation(
            summary = "Отправить сообщение в чат"
    )
    @PostMapping("/send_message")
    public ResponseEntity<MessageDTO> sandMessage(@RequestHeader("Authorization") String token,
                                                  @RequestBody String text) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);
        Long chatId = 6L;
        Chat chat = chatRepository.findChatById(chatId);
        if (chat == null) {
            return ResponseEntity.notFound().build();
        }

        long messageCount = messageRepository.countByChat(chat);

        if (messageCount >= MAX_MESSAGES) {
            List<Message> oldestMessages = messageRepository.findOldestMessages(chat, messageCount - MAX_MESSAGES + 1);
            messageRepository.deleteAll(oldestMessages);
        }

        Message message = Message.builder()
                .textOfMessage(text)
                .user(user)
                .chat(chat)
                .publicationDateTime(LocalDateTime.now())
                .build();

        messageRepository.save(message);
        return ResponseEntity.ok(MessageDTO.fromEntity(message));

    }

    @Operation(
            summary = "Все сообщения чата"
    )
    @GetMapping("/all_messages")
    public ResponseEntity<List<MessageDTO>> allMessage() {
        List<Message> messages = messageRepository.findAll();

        List<MessageDTO> messageDTOList = messages.stream()
                .map(MessageDTO::fromEntity)
                .collect(Collectors.toList());



        return ResponseEntity.ok(messageDTOList);
    }

    @Operation(
            summary = "Количество новых соообщений за 7 дней"
    )
    @GetMapping("/messages_count")
    public ResponseEntity<Long> getMessagesCount(@RequestHeader("Authorization") String token) {

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        LocalDateTime sevenDays = LocalDateTime.now().minusDays(7);

        boolean isAdmin = user.getRoles().contains("ROLE_ADMIN");

        if (isAdmin) {
            return ResponseEntity.ok(messageService.messagesCountSevenDays(sevenDays));
        }

        return  ResponseEntity.noContent().build();
    }
}
