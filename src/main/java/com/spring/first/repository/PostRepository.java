package com.spring.first.repository;

import com.spring.first.model.Post;
import com.spring.first.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p WHERE p.namePost LIKE CONCAT(:symbols, '%')")
    List<Post> findPostsStartingWith(@Param("symbols") String symbols);

    @Query("SELECT COUNT(p) FROM Post p WHERE p.dateOfPublication > :sevenDays")
    Long countPostsSevenDays(LocalDate sevenDays);
    void deletePostById(Long id);
    Post findPostById(Long id);
    Page<Post> findAllPostOfUserByUserId(Long userId, Pageable pageable);
    Page<Post> findAll(Pageable pageable);
    Page<Post> findByTheme(Pageable pageable, String theme);
    Page<Post> findByDateOfPublication(Pageable pageable, LocalDate dateOfPublication);
}
