package com.spring.first.service;

import com.spring.first.model.Chat;

public interface ChatService {
    Chat createChat(Chat chat);
    Chat findChatById(Long id);
    void deleteChatById(Long id);
}
