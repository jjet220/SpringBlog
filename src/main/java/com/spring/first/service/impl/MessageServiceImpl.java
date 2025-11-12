package com.spring.first.service.impl;

import com.spring.first.model.Chat;
import com.spring.first.model.Message;
import com.spring.first.repository.MessageRepository;
import com.spring.first.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Primary
@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository repository;

    @Override
    public Long messagesCountSevenDays(LocalDateTime sevenDays) {
        return repository.countMessagesSevenDays(sevenDays);
    }

    @Override
    public Message writeMessage(Message message) {
        return repository.save(message);
    }

    @Override
    public void deleteMessageById(Long id) {
        repository.deleteMessageById(id);
    }

    @Override
    public List<Message> findAllMessage() {
        return repository.findAll();
    }

    @Override
    public int countByChat(Chat chat) {
        return repository.countByChat(chat);
    }

    //Пока не трогаем
    @Override
    public Message findMessageById(Long id) {
        return repository.findMessageById(id);
    }
}
