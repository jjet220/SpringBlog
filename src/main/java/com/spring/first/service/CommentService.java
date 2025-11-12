package com.spring.first.service;

import com.spring.first.model.Comment;
import com.spring.first.model.CommentLike;
import com.spring.first.model.FavoritePosts;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Configuration
public interface CommentService {

    Long countComments();

    List<Comment> findAllByPostId(Long postId);

    Comment findCommentById(Long id);

    Long countByPostId(Long postId);

    Page<Comment> findAllCommentOfPostByPostId(Pageable pageable, Long Id);

    Page<Comment> findAllCommentsByUserId(Pageable pageable, Long id);

    Comment writeComment(Comment comment);

    @Transactional
    void deleteCommentById(Long id);

    Comment updateComment(Comment comment);

    Comment likeComment(int likes);

    Long countByCommentId(Long commentId);

    CommentLike putLike(Long userId, Long commentId);

    void deleteCommentLikeByUserId(Long userId, Long commentId);

    boolean isLiked(Long userId, Long commentId);
}
