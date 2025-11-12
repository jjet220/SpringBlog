package com.spring.first.repository;

import com.spring.first.model.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface CommentLikeRepository extends JpaRepository<CommentLike, CommentLikeId> {

    @Query("SELECT COUNT(f) FROM CommentLike f WHERE f.comment.id = :commentId")
    Long countByCommentId(@Param("commentId") Long commentId);

    boolean existsByUserAndComment(User user, Comment comment);

    @Modifying
    @Transactional
    @Query("DELETE FROM CommentLike f WHERE f.user.id = :userId AND f.comment.id = :commentId")
    void deleteCommentLikeByUserIdAndCommentId(Long userId, Long commentId);

    @Query("SELECT f.comment FROM CommentLike f WHERE f.user.id = :userId")
    Page<Post> findCommentLikeByUserId(@Param("userId") Long userId, Pageable pageable);
}
