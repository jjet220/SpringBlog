package com.spring.first.model;

import liquibase.change.core.LoadDataChange;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public abstract class UserEvent {
    private String eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private Long userId;

}
