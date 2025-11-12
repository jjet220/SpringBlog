package com.spring.first.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

@Builder
@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "name_post")
    private String namePost;
    private int likes;
    private int views;
    private LocalDate dateOfPublication;
    private String text;
    private String theme;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
//    @Lob
//    @Column(name = "image", columnDefinition = "BLOB")
   // private byte[] image;todo

    @PrePersist
    public void setDateOfPublication() {
        this.dateOfPublication = LocalDate.now();
    }

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FavoritePosts> favoritePosts = new ArrayList<>();
//    public Period getDateOfPublication() {
//        return Period.between(dateOfPublication, LocalDate.now());
//    }
}
