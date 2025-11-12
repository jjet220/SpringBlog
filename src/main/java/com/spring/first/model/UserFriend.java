package com.spring.first.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_friends")
@IdClass(UserFriendId.class)
@Getter
@Setter
public class UserFriend {
    @Id
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Id
    @ManyToOne
    @JoinColumn(name = "friend_id")
    private User friend;

    @Column(nullable = false, columnDefinition = "TINYINT(1) default 0")
    private boolean status = false;
}

