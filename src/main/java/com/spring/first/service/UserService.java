package com.spring.first.service;

import com.spring.first.DTO.UserDTO;
import com.spring.first.DTO.UserWithAvatarDTO;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Configuration
public interface UserService {

    List<User> searchUser(String symbols);

    Long usersCount();

    Long usersCountSevenDays(LocalDate sevenDays);

    Page<User> findAllUsers(Pageable pageable);

    User saveUserDTO(UserDTO userDTO);

    Optional<User> findByName(String username);

    User saveUser(User user);

    User findByEmail(String email);

    User updateUser(User user);

    User findUserById(Long id);

    void deleteById(Long userId);

    Map<String, Object> checkRelationship(Long userId, Long friendId);

    Set<User> findIncomingFriendRequests(Long userId);

    Set<User> findOutgoingFriendRequests(Long userId);

    Set<User> findFriendsByUserId(Long userId);

    @Transactional
    void deleteUserByEmail(String email);

    Set<User> getUserFriends(Long userId);

    void sendFriendRequest(Long userId, Long friendId);

    void acceptFriendRequest(Long userId, Long friendId);


    void removeFriend(Long userId, Long friendId);

    boolean checkFriendship(Long userId, Long friendId);

    Set<Post> getUserFavoritePosts(Long userId);

    void addFavoritePost(Long userId, Long postId);

    void removeFavoritePost(Long userId, Long postId);

    UserWithAvatarDTO getUserWithAvatar(Long id);

    void updateUserAvatar(Long userId, MultipartFile file) throws IOException;

    void removeUserAvatar(Long userId);
}
