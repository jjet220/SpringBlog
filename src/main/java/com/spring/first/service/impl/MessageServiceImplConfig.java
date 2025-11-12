package com.spring.first.service.impl;

import com.spring.first.repository.MessageRepository;
import com.spring.first.service.MessageService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MessageServiceImplConfig {
    @Bean
    public MessageService messageTestService(MessageRepository messageRepository){
        return new MessageServiceImpl(messageRepository);
    }
}
