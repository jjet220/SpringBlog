package com.spring.first.service.impl;

import com.spring.first.model.*;
import com.spring.first.repository.CommentRepository;
import com.spring.first.repository.FavoritePostsRepository;
import com.spring.first.repository.PostRepository;
import com.spring.first.repository.UserRepository;
import com.spring.first.service.PostService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Primary
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final FavoritePostsRepository favoritePostsRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    @Override
    public Page<Post> findAllPosts(Pageable pageable) {
        return postRepository.findAll(pageable);
    }

    @Override
    public List<Post> searchPost(String symbols) {
        return postRepository.findPostsStartingWith(symbols);
    }

    @Override
    public Long postsCount() {
        return postRepository.count();
    }

    @Override
    public List<Post> findAllPosts() {
        return postRepository.findAll();
    }

    @Override
    public Long postsCountSevenDays(LocalDate sevenDays) {
        return postRepository.countPostsSevenDays(sevenDays);
    }

    @Override
    public Post publicationPost(Post post) {
        return postRepository.save(post);
    }

    @Override
    public Post findPostById(Long id) {
        return postRepository.findPostById(id);
    }

    @Override
    public Post updatePost(Post post) {
        return postRepository.save(post);
    }

    @Override
    public Page<Post> findByTheme(Pageable pageable, String theme) {
        return postRepository.findByTheme(pageable, theme);
    }

    @Override
    public Page<Post> findByDateOfPublication(Pageable pageable, LocalDate dateOfPublication) {
        return postRepository.findByDateOfPublication(pageable, dateOfPublication);
    }

    public Long countByPostId(Long postId) {
        System.out.println("Count u posta:" + postId);
        return favoritePostsRepository.countByPostId(postId);
    }

    @Transactional
    @Override
    public FavoritePosts putLike(Long userId, Long postId) {
        User user = userRepository.findUserById(userId);

        Post post = postRepository.findPostById(postId);

        FavoritePostsId id = new FavoritePostsId(userId, postId);

        if (favoritePostsRepository.existsById(id)) {
            deleteFavoritePostByUserId(userId, postId);
            return null;
        }

        FavoritePosts favorite = new FavoritePosts();
        favorite.setId(id);
        favorite.setUser(user);
        favorite.setPost(post);

        return favoritePostsRepository.save(favorite);
    }

    @Override
    @Transactional
    public void deleteFavoritePostByUserId(Long userId, Long postId){
        favoritePostsRepository.deleteFavoritePostByUserIdAndPostId(userId, postId);
    }

    @Override
    public Page<Post> findAllFavoritePostOfUser(Long userId, Pageable pageable) {

        return favoritePostsRepository.findFavoritePostsByUserId(userId, pageable);

    }

    @Override
    public boolean isLiked(Long userId, Long postId) {
        User user = userRepository.findUserById(userId);
        Post post = postRepository.findPostById(postId);
        return favoritePostsRepository.existsByUserAndPost(user, post);
    }

    @Override
    @Transactional
    public void deletePostById(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));

        List<FavoritePosts> favoritesCopy = new ArrayList<>(post.getFavoritePosts());
        for (FavoritePosts favorite : favoritesCopy) {
            favoritePostsRepository.delete(favorite);
        }
        post.getFavoritePosts().clear();

        // Удаляем все комментарии поста
        List<Comment> commentsCopy = new ArrayList<>(post.getComments());
        for (Comment comment : commentsCopy) {
            deleteCommentById(comment.getId());
        }
        post.getComments().clear();

        // Удаляем сам пост
        postRepository.delete(post);
        postRepository.flush();
    }

    @Transactional
    public void deleteCommentById(Long commentId) {
        commentRepository.deleteById(commentId);
    }

    @Override
    public Page<Post> findAllPostOfUserByUserId(Long userId, Pageable pageable) {
        return postRepository.findAllPostOfUserByUserId(userId, pageable);
    }

}
