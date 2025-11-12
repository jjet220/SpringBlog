package com.spring.first.repository;


import com.spring.first.model.User;
import com.spring.first.model.UserFriend;
import com.spring.first.model.UserFriendId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;

public interface UserFriendRepository extends JpaRepository<UserFriend, UserFriendId> {
    @Transactional
    @Modifying
    @Query("DELETE FROM UserFriend uf WHERE (uf.user.id = :userId AND uf.friend.id = :friendId) OR (uf.user.id = :friendId AND uf.friend.id = :userId)")
    void deleteByUserAndFriend(@Param("userId") Long userId, @Param("friendId") Long friendId);

    @Transactional
    @Modifying
    @Query("UPDATE UserFriend uf SET uf.status = true WHERE uf.user.id = :friendId AND uf.friend.id = :userId")
    void acceptFriendRequest(@Param("userId") Long userId, @Param("friendId") Long friendId);

    @Query("SELECT uf FROM UserFriend uf WHERE " +
            "(uf.user.id = :userId AND uf.friend.id = :friendId) OR " +
            "(uf.user.id = :friendId AND uf.friend.id = :userId)")
    Optional<UserFriend> findRelationshipBetweenUsers(@Param("userId") Long userId,
                                                      @Param("friendId") Long friendId);

    boolean existsByUserAndFriend(User user, User friend);

    @Query("SELECT uf FROM UserFriend uf WHERE uf.user.id = :userId AND uf.friend.id = :friendId")
    Optional<UserFriend> findByUserAndFriend(@Param("userId") Long userId, @Param("friendId") Long friendId);

    @Query("SELECT u FROM User u JOIN UserFriend uf ON u.id = uf.user.id " +
            "WHERE uf.friend.id = :userId AND uf.status = false")
    Set<User> findIncomingFriendRequests(@Param("userId") Long userId);


    @Query("SELECT u FROM User u JOIN UserFriend uf ON u.id = uf.friend.id " +
            "WHERE uf.user.id = :userId AND uf.status = false")
    Set<User> findOutgoingFriendRequests(@Param("userId") Long userId);

    @Query("SELECT uf.friend FROM UserFriend uf WHERE uf.user.id = :userId AND uf.status = true")
    Set<User> findFriendsByUserId(@Param("userId") Long userId);
}
