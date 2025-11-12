package com.spring.first.service.impl;

import com.spring.first.model.Chat;
import com.spring.first.model.Message;
import com.spring.first.repository.ChatRepository;
import com.spring.first.repository.MessageRepository;
import com.spring.first.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Primary
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    @Override
    public Chat createChat(Chat chat) {
        return chatRepository.save(chat);
    }

    @Override
    public Chat findChatById(Long id) {
        return chatRepository.findChatById(id);
    }

    @Override
    public void deleteChatById(Long id) {
        Chat chat = chatRepository.findChatById(id);

        List<Message> messageCopy = new ArrayList<>(chat.getMessages());

        for (Message message : messageCopy) {
            messageRepository.deleteMessageById(message.getId());
        }
        chat.getMessages().clear();


        chatRepository.deleteById(id);
        chatRepository.flush();
    }
}
