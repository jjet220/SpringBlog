package com.spring.first.service.impl;

import com.spring.first.DTO.UserDTO;
import com.spring.first.DTO.UserWithAvatarDTO;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import com.spring.first.model.UserFriend;
import com.spring.first.repository.PostRepository;
import com.spring.first.repository.UserFriendRepository;
import com.spring.first.repository.UserRepository;
import com.spring.first.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;

@Service
@Primary
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PostRepository postRepository;
    private final UserFriendRepository userFriendRepository;


    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public List<User> searchUser(String symbols) {

        return userRepository.findUsersStartingWith(symbols);
    }

    @Override
    public Long usersCount() {
        return userRepository.count();
    }

    @Override
    public Long usersCountSevenDays(LocalDate sevenDays) {
        return userRepository.countUsersSevenDays(sevenDays);
    }

    @Override
    public Page<User> findAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Override
    public User saveUserDTO(UserDTO userDTO) {
        User user = userDTO.toEntity();
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByName(String username) {
        return userRepository.findByName(username);
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findUserByEmail(email);
    }

    @Override
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public User findUserById(Long id) {
        return userRepository.findUserById(id);
    }

    public void deleteById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Set<User> friendsCopy = new HashSet<>(user.getFriends());
        for (User friend : friendsCopy) {
            friend.getFriends().remove(user);
            userRepository.save(friend);
        }
        user.getFriends().clear();

        user.getFavoritePosts().clear();

        List<Post> postsCopy = new ArrayList<>(user.getPosts());
        for (Post post : postsCopy) {

            postRepository.delete(post);
        }
        user.getPosts().clear();

        userRepository.delete(user);

        userRepository.flush();
    }

    @Transactional
    @Override
    public void deleteUserByEmail(String email) {
        userRepository.deleteByEmail(email);
    }

    @Override
    public Set<User> getUserFriends(Long userId) {
        return userRepository.findFriendsByUserId(userId);
    }


    @Override
    public void sendFriendRequest(Long userId, Long friendId) {
        if (userId.equals(friendId)) {
            throw new IllegalArgumentException("Невозможно отправить запрос на добавление в друзья самому себе");
        }

        User user = userRepository.findById(userId).orElseThrow();

        User friend = userRepository.findById(friendId).orElseThrow();

        if (userFriendRepository.existsByUserAndFriend(user, friend)) {
            throw new IllegalStateException("Запрос на добавление в друзья уже существует");
        }

        UserFriend userFriend = new UserFriend();
        userFriend.setUser(user);
        userFriend.setFriend(friend);
        userFriend.setStatus(false);
        userFriendRepository.save(userFriend);

    }

    @Override
    public void acceptFriendRequest(Long userId, Long friendId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            User friend = userRepository.findById(friendId)
                    .orElseThrow(() -> new IllegalArgumentException("Friend not found"));

            Optional<UserFriend> existingRequest = userFriendRepository
                    .findByUserAndFriend(friendId, userId);

            if (existingRequest.isEmpty()) {
                throw new IllegalStateException("Friend request not found");
            }

            userFriendRepository.acceptFriendRequest(userId, friendId);

            if (!userFriendRepository.existsByUserAndFriend(user, friend)) {
                UserFriend reciprocal = new UserFriend();
                reciprocal.setUser(user);
                reciprocal.setFriend(friend);
                reciprocal.setStatus(true);
                userFriendRepository.save(reciprocal);
            }
        } catch (Exception e) {
            throw e;
        }
    }

    @Override
    public void removeFriend(Long userId, Long friendId) {
        userFriendRepository.deleteByUserAndFriend(userId, friendId);

        userFriendRepository.deleteByUserAndFriend(friendId, userId);
    }

    @Override
    public boolean checkFriendship(Long userId, Long friendId) {
        Optional<UserFriend> relationship = userFriendRepository.findByUserAndFriend(userId, friendId);
        return relationship.isPresent() && relationship.get().isStatus();
    }

    @Override
    public Map<String, Object> checkRelationship(Long userId, Long friendId) {

        Optional<UserFriend> relation1 = userFriendRepository.findByUserAndFriend(userId, friendId);
        Optional<UserFriend> relation2 = userFriendRepository.findByUserAndFriend(friendId, userId);

        Map<String, Object> result = new HashMap<>();

        if (relation1.isPresent() || relation2.isPresent()) {
            result.put("exists", true);

            boolean isFriend = (relation1.isPresent() && relation1.get().isStatus()) ||
                    (relation2.isPresent() && relation2.get().isStatus());

            result.put("isFriend", isFriend);

            if (relation1.isPresent()) {
                result.put("direction", "outgoing");
            } else {
                result.put("direction", "incoming");
            }
        } else {
            result.put("exists", false);
        }

        return result;
    }

    @Override
    public Set<User> findIncomingFriendRequests(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return userFriendRepository.findIncomingFriendRequests(userId);
    }

    @Override
    public Set<User> findOutgoingFriendRequests(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return userFriendRepository.findOutgoingFriendRequests(userId);
    }

    @Override
    public Set<User> findFriendsByUserId(Long userId) {

        User user = userRepository.findById(userId).orElseThrow();

        Set<User> friends = userFriendRepository.findFriendsByUserId(userId);

        return friends;
    }

    @Override
    public Set<Post> getUserFavoritePosts(Long userId) {
        return Set.of();
    }

    @Override
    public void addFavoritePost(Long userId, Long postId) {

    }

    @Override
    public void removeFavoritePost(Long userId, Long postId) {

    }

    public UserWithAvatarDTO getUserWithAvatar(Long id) {
        User user = findUserById(id);
        return new UserWithAvatarDTO(user);
    }

    public void updateUserAvatar(Long userId, MultipartFile file) throws IOException {
        User user = findUserById(userId);
        user.setAvatar(file.getBytes());
        user.setAvatarContentType(file.getContentType());
        userRepository.save(user);
    }

    public void removeUserAvatar(Long userId) {
        User user = findUserById(userId);
        user.setAvatar(null);
        user.setAvatarContentType(null);
        userRepository.save(user);
    }

}
