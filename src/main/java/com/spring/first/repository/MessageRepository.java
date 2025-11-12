package com.spring.first.repository;


import com.spring.first.model.Chat;
import com.spring.first.model.Message;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    void deleteMessageById(Long id);
    Message findMessageById(Long id);
    List<Message> findAll();
    int countByChat(Chat chat);
    @Query("SELECT m FROM Message m WHERE m.chat = :chat ORDER BY m.publicationDateTime ASC")
    @QueryHints(@QueryHint(name = "org.hibernate.limit", value = ":count"))
    List<Message> findOldestMessages(@Param("chat") Chat chat, @Param("count") long count);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.publicationDateTime > :sevenDays")
    Long countMessagesSevenDays(LocalDateTime sevenDays);
}
