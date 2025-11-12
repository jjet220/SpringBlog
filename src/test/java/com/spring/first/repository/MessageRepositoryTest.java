/*package com.spring.first.repository;

import com.spring.first.model.Chat;
import com.spring.first.model.Message;
import com.spring.first.model.User;
import com.spring.first.service.ChatService;
import com.spring.first.service.MessageService;
import com.spring.first.service.UserService;
import com.spring.first.service.impl.ChatServiceImplConfig;
import com.spring.first.service.impl.MessageServiceImplConfig;
import com.spring.first.service.impl.UserServiceImplConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.util.AssertionErrors.assertNotNull;

@Transactional
@SpringBootTest
@Import({MessageServiceImplConfig.class, ChatServiceImplConfig.class, UserServiceImplConfig.class})
@ActiveProfiles({"test", "testSecurity"})
@WithMockUser(
        username = "admin",
        password = "admin123",
        roles = {"USER"},
        authorities = {"READ", "WRITE"}
)
public class MessageRepositoryTest {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatService chatService;

    @Test
    public void MessageRepository_writeMessage() {
        User user = User.builder()
                .name("testing_name")
                .email("test@gmail.com")
                .dateOfBirth(LocalDate.of(1990, 4, 12))
                .password("pass_example")
                .build();

        userService.saveUser(user);

        User foundUser = userService.findByEmail("test@gmail.com");



        assertNotNull("Пользователь не должен быть null", foundUser);

        Chat chat = Chat.builder()
                .user(user)
                .build();

        chatService.createChat(chat);

        Chat foundChat = chatService.findChatById(chat.getId());

        assertNotNull("Чат не должен быть null", foundChat);

        Message message = Message.builder()
                .textOfMessage("Hello ho ho ho")
                .chat(chat)
                .user(user)
                .build();

        messageService.writeMessage(message);

        Message foundMessage = messageService.findMessageById(chat.getId());

        assertNotNull("Сообщение не должно быть null", foundMessage);
    }
    //todo
}*/
