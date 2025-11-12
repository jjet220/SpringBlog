package com.spring.first.repository;


import com.spring.first.DTO.UserDTO;
import com.spring.first.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;


public interface UserRepository extends JpaRepository<User, Long> {
    void deleteByEmail(String email);
    User findUserByEmail(String email);
    User findUserById(Long id);
    //void deleteUserById(Long userId);
    Optional<User> findByName(String name);

    @Query("SELECT u FROM User u JOIN UserFriend uf ON u.id = uf.friend.id WHERE uf.user.id = :userId AND uf.status = true")
    Set<User> findFriendsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.registrationDate > :sevenDays")
    Long countUsersSevenDays(LocalDate sevenDays);

    @Query("SELECT u FROM User u WHERE u.name LIKE CONCAT(:symbols, '%')")
    List<User> findUsersStartingWith(@Param("symbols") String symbols);

//    @Query("SELECT u FROM User u JOIN UserFriend uf ON u.id = uf.user.id WHERE uf.friend.id = :userId AND uf.status = false")
//    Set<User> findPendingFriendRequests(@Param("userId") Long userId);
//
//  @Query("SELECT u FROM User u JOIN user_friends uf ON u.id = uf.friend_id WHERE uf.user_id = :userId AND uf.status = true")
//   Set<User> getUserFriends(Long userId);

}
