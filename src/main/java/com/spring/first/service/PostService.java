package com.spring.first.service;

import com.spring.first.DTO.PostDTO;
import com.spring.first.model.FavoritePosts;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Configuration
public interface PostService {

    List<Post> searchPost(String symbols);

    Long postsCount();

    List<Post> findAllPosts();

    Long postsCountSevenDays(LocalDate sevenDays);

    Page<Post> findAllPosts(Pageable pageable);

    Post publicationPost(Post post);

    Post findPostById(Long id);

    Post updatePost(Post post);

    Page<Post> findByTheme(Pageable pageable, String theme);

    Page<Post> findByDateOfPublication(Pageable pageable, LocalDate dateOfPublication);

    @Transactional
    void deletePostById(Long id);

    Page<Post> findAllPostOfUserByUserId(Long userId, Pageable pageable);

    Long countByPostId(Long postId);

    FavoritePosts putLike(Long userId, Long postId);

    void deleteFavoritePostByUserId(Long userId, Long postId);

    Page<Post> findAllFavoritePostOfUser(Long userId, Pageable pageable);

    boolean isLiked(Long userId, Long postId);

    default Page<PostDTO> findAllPostsDTO(Pageable pageable) {
        return findAllPosts(pageable).map(PostDTO::fromEntity);
    }

    default PostDTO publicationPostDTO(PostDTO postDTO, User user) {
        Post post = postDTO.toEntity();
        post.setUser(user);
        return PostDTO.fromEntity(publicationPost(post));
    }

}
