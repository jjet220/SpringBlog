package com.spring.first.service.impl;

import com.spring.first.model.*;
import com.spring.first.repository.CommentLikeRepository;
import com.spring.first.repository.CommentRepository;
import com.spring.first.repository.UserRepository;
import com.spring.first.service.CommentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Primary
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CommentLikeRepository commentLikeRepository;

    @Override
    public Long countComments() {
        return commentRepository.count();
    }

    @Override
    public List<Comment> findAllByPostId(Long postId) {
        return (List<Comment>) commentRepository.findCommentById(postId);
    }

    @Override
    public Comment findCommentById(Long id) {
        return commentRepository.findCommentById(id);
    }

    @Override
    public Long countByPostId(Long postId) {
        return commentRepository.countByPostId(postId);
    }

    @Override
    public Page<Comment> findAllCommentOfPostByPostId(Pageable pageable, Long id) {
        return commentRepository.findByPostId(id, pageable);
    }

    @Override
    public Page<Comment> findAllCommentsByUserId(Pageable pageable, Long id) {
        return commentRepository.findAllCommentsByUserId(pageable, id);
    }


    @Override
    public Comment writeComment(Comment comment) {
        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void deleteCommentById(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        List<CommentLike> likesCopy = new ArrayList<>(comment.getCommentLikes());
        for (CommentLike like : likesCopy) {
            commentLikeRepository.delete(like);
        }
        comment.getCommentLikes().clear();

        commentRepository.delete(comment);
    }

    @Override
    public Comment updateComment(Comment comment) {
        return commentRepository.save(comment);
    }

    @Override
    public Comment likeComment(int likes) {
        //todo
        return null;
    }

    @Override
    public Long countByCommentId(Long commentId) {
        System.out.println("Count u commenta:" + commentId);
        return commentLikeRepository.countByCommentId(commentId);
    }

    @Override
    public CommentLike putLike(Long userId, Long commentId) {
        User user = userRepository.findUserById(userId);

        Comment comment = commentRepository.findCommentById(commentId);

        CommentLikeId id = new CommentLikeId(userId, commentId);

        if (commentLikeRepository.existsById(id)) {
            deleteCommentLikeByUserId(userId, commentId);
            return null;
        }

        CommentLike commentLike = new CommentLike();
        commentLike.setId(id);
        commentLike.setUser(user);
        commentLike.setComment(comment);

        return commentLikeRepository.save(commentLike);
    }

    @Override
    public void deleteCommentLikeByUserId(Long userId, Long commentId) {
        commentLikeRepository.deleteCommentLikeByUserIdAndCommentId(userId, commentId);
    }

    @Override
    public boolean isLiked(Long userId, Long commentId) {
        User user = userRepository.findUserById(userId);
        Comment comment = commentRepository.findCommentById(commentId);
        return commentLikeRepository.existsByUserAndComment(user, comment);
    }
}
