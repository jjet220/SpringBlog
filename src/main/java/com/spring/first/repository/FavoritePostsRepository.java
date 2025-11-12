package com.spring.first.repository;

import com.spring.first.model.FavoritePosts;
import com.spring.first.model.FavoritePostsId;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface FavoritePostsRepository extends JpaRepository<FavoritePosts, FavoritePostsId> {
    @Query("SELECT COUNT(f) FROM FavoritePosts f WHERE f.post.id = :postId")
    Long countByPostId(@Param("postId") Long postId);

    boolean existsByUserAndPost(User user, Post post);

    @Modifying
    @Query("DELETE FROM FavoritePosts f WHERE f.user.id = :userId AND f.post.id = :postId")
    void deleteFavoritePostByUserIdAndPostId(Long userId, Long postId);

    @Query("SELECT f.post FROM FavoritePosts f WHERE f.user.id = :userId")
    Page<Post> findFavoritePostsByUserId(@Param("userId") Long userId, Pageable pageable);


}