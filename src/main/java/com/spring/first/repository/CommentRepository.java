package com.spring.first.repository;

import com.spring.first.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    void deleteCommentById(Long id);
    Comment findCommentById(Long id);
    Page<Comment> findByPostId(Long postId, Pageable pageable);
    Page<Comment> findAllCommentOfPostByPostId(Pageable pageable, Long Id);
    Page<Comment> findAllCommentsByUserId(Pageable pageable, Long id);
    Long countByPostId(Long postId);
}
