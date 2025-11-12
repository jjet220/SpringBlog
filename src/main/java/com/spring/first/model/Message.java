package com.spring.first.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;

@Builder
@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table( name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "publication_date_time")
    private LocalDateTime publicationDateTime;
    @Column(name = "text_of_message")
    private String textOfMessage;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne
    @JoinColumn(name = "chat_id", nullable = false)
    @JsonBackReference
    private Chat chat;

    @PrePersist
    public void setPublicationDateTime() {
        this.publicationDateTime = LocalDateTime.now();
    }

    public String getFormattedTime() {
        return publicationDateTime != null
                ? publicationDateTime.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                : "";
    }

//    public String getFormattedDate() {
//        return publicationDateTime != null
//                ? publicationDateTime.toLocalDate().toString()
//                : "";
//    }
}
