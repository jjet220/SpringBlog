package com.spring.first.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Builder
@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@JsonIgnoreProperties({ "age"})
@Schema(description = "Модель пользователя")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "Уникальный индетификатор", example = "1")
    private Long id;

    @Column(unique = true)
    @Schema(description = "Имя пользователя", example = "jjet220")
    private String name;

    @Transient
    @Schema(description = "Возраст", example = "32")
    private int age;

    @Schema(description = "Дата рождения", example = "04.01.2001")
    private LocalDate dateOfBirth;

    @Schema(description = "Дата регистрации", example = "03.06.2024")
    private LocalDate registrationDate;

    @Column(unique = true)
    @Schema(description = "Email адрес", example = "example@gmail.com")
    private String email;

    @Schema(description = "Роль", example = "ROLE_ADMIN")
    private String roles = "ROLE_USER";

    @Schema(description = "Пароль", example = "DN!j1fkk4t8ghf")
    private String password;

    @Lob
    @Column(name = "avatar", columnDefinition = "LONGBLOB")
    @Schema(description = "Аватар", example = "картинка")
    private byte[] avatar;

    @Column(name = "avatar_content_type")
    @Schema(description = "Тип контена аватар", example = "image/jpeg")
    private String avatarContentType;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "user_friends",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "friend_id")
    )
    @JsonIgnore
    @ArraySchema(
            arraySchema = @Schema(description = "Сет Друзей"),
            minItems = 1
    )
    private Set<User> friends = new HashSet<>();

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "user_favorite_posts",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "post_id")
    )
    @JsonIgnore
    @ArraySchema(
            arraySchema = @Schema(description = "Сет понравившихся постов"),
            minItems = 1
    )
    private Set<Post> favoritePosts = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ArraySchema(
            arraySchema = @Schema(description = "Лист постов"),
            minItems = 1
    )
    private List<Post> posts = new ArrayList<>();

    @PrePersist
    public void setDateOfPublication() {
        this.registrationDate = LocalDate.now();
    }

    public int getAge() {
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }

}
