package com.spring.first.repository;

import com.spring.first.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    Chat findChatById(Long id);
    void deleteById(Long id);
}
