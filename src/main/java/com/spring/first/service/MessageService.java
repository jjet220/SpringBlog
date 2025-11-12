package com.spring.first.service;

import com.spring.first.model.Chat;
import com.spring.first.model.Message;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
public interface MessageService {

    Long messagesCountSevenDays(LocalDateTime sevenDays);

    Message writeMessage(Message message);

    //Права пользователя ADMIN
    void deleteMessageById(Long id);

    List<Message> findAllMessage();

    int countByChat(Chat chat);

    Message findMessageById(Long id);
}
