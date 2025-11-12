package com.spring.first.controller;

import com.spring.first.DTO.ChatDTO;
import com.spring.first.config.JwtService;
import com.spring.first.model.Chat;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import com.spring.first.repository.ChatRepository;
import com.spring.first.repository.MessageRepository;
import com.spring.first.repository.UserRepository;
import com.spring.first.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@Tag(name = "chat_methods")
@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {
    private final JwtService jwtService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final PagedResourcesAssembler<Chat> chatPagedResourcesAssembler;

    @Operation(
            summary = "Создание чата"
    )
    @PostMapping("/create")
    public ResponseEntity<?> createChat(@RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        if (!"ROLE_ADMIN".equals(user.getRoles())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Только администраторы могут создавать чаты");
        }

        Chat chat = Chat.builder()
                .user(user)
                .build();
        chatRepository.save(chat);
        return ResponseEntity.ok(ChatDTO.fromEntity(chat));
    }

    @Operation(
            summary = "Удаление чата"
    )
    @DeleteMapping("/delete/{chatId}")
    public  ResponseEntity<Void> deleteChat(@RequestHeader("Authorization") String token,
                                            @PathVariable Long chatId) {
        Long ourUserId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(ourUserId);
        if (user.getRoles().equals("ROLE_ADMIN")) {
            try {
                SecurityContextHolder.clearContext();
                chatRepository.deleteById(chatId);
                return ResponseEntity.noContent().build();
            } catch (Exception e) {
                return  ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        return ResponseEntity.notFound().build();
    }

    @Operation(summary = "Получить все чаты")
    @GetMapping("/all")
    public ResponseEntity<PagedModel<EntityModel<ChatDTO>>> getAllChats(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<Chat> chats = chatRepository.findAll(PageRequest.of(page, size));
        PagedModel<EntityModel<ChatDTO>> pagedModel = chatPagedResourcesAssembler.toModel(
                chats,
                chat -> EntityModel.of(ChatDTO.fromEntity(chat))
        );
        return ResponseEntity.ok(pagedModel);
    }
}
