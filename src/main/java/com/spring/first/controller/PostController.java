package com.spring.first.controller;

import com.spring.first.DTO.PostDTO;
import com.spring.first.DTO.PostSearchDTO;
import com.spring.first.DTO.UserSearchDTO;
import com.spring.first.config.JwtService;
import com.spring.first.model.FavoritePosts;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import com.spring.first.repository.UserRepository;
import com.spring.first.service.PostService;
import com.spring.first.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Tag(name = "posts_methods")
@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final JwtService jwtService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final PagedResourcesAssembler<Post> postPagedResourcesAssembler;


    @Operation(summary = "Список всех постов")
    @GetMapping
    public ResponseEntity<PagedModel<EntityModel<PostDTO>>> findAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Post> posts = postService.findAllPosts(PageRequest.of(page, size));
        PagedModel<EntityModel<PostDTO>> pagedModel = postPagedResourcesAssembler.toModel(
                posts,
                post -> EntityModel.of(PostDTO.fromEntity(post))
        );
        System.out.println("posts");
        return ResponseEntity.ok(pagedModel);
    }


    @Operation(summary = "Все посты пользователя")
    @GetMapping("/{id}/user_posts")
    public ResponseEntity<PagedModel<EntityModel<PostDTO>>> findAllPostOfUserByUserId(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Post> posts = postService.findAllPostOfUserByUserId(id, PageRequest.of(page, size));

        return ResponseEntity.ok(postPagedResourcesAssembler.toModel(
                posts,
                post -> EntityModel.of(PostDTO.fromEntity(post))
        ));
    }


    @Operation(summary = "Публикация поста")
    @PostMapping("/publication_post")
    public ResponseEntity<PostDTO> publicationPost(
            @RequestBody PostDTO postDTO,
            @RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        Post post = postDTO.toEntity();
        post.setUser(user);
        Post savedPost = postService.publicationPost(post);

        return ResponseEntity.ok(PostDTO.fromEntity(savedPost));
    }

    @Operation(summary = "Редактирование поста")
    @PutMapping("/update_post/{postId}")
    public ResponseEntity<PostDTO> updatePost(
            @PathVariable Long postId,
            @RequestBody PostDTO updatePostDTO) {
        Post existingPost = postService.findPostById(postId);
        if (existingPost == null) {
            return ResponseEntity.notFound().build();
        }

        existingPost.setNamePost(updatePostDTO.getNamePost());
        existingPost.setText(updatePostDTO.getText());

        Post updatedPost = postService.updatePost(existingPost);
        return ResponseEntity.ok(PostDTO.fromEntity(updatedPost));
    }


    @Operation(summary = "Удаление поста по ID")
    @DeleteMapping("/delete_post/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            @RequestHeader("Authorization") String token) {

        try {

            Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
            User user = userService.findUserById(userId);

            Post post = postService.findPostById(postId);
            boolean isAuthor = post.getUser().getId().equals(userId);
            boolean isAdmin = user.getRoles().contains("ROLE_ADMIN");

            if (isAuthor || isAdmin) {
                postService.deletePostById(postId);
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Получение поста по ID")
    @GetMapping("/{postId}")
    public ResponseEntity<PostDTO> findPost(@PathVariable Long postId,
                                            @RequestHeader("Authorization") String token) {

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));

        Post post = postService.findPostById(postId);
        if (post == null || userId == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(PostDTO.fromEntity(post));
    }

    @Operation(summary = "Сортировка постов")
    @GetMapping("/sort")
    public ResponseEntity<PagedModel<EntityModel<PostDTO>>> sortPost(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String theme,
            @RequestParam(required = false) Boolean dateAscOrDesc) {

        Page<Post> posts = postService.findAllPosts(PageRequest.of(page, size));
        PagedModel<EntityModel<PostDTO>> pagedModel = postPagedResourcesAssembler.toModel(
                posts,
                post -> EntityModel.of(PostDTO.fromEntity(post))
        );
        Sort sort = dateAscOrDesc != null && dateAscOrDesc ?
                Sort.by(Sort.Order.asc("dateOfPublication")) :
                Sort.by(Sort.Order.desc("dateOfPublication"));

        if (theme != null) {
            posts = postService.findByTheme(PageRequest.of(page, size, sort), theme);
        } else {
            posts = postService.findAllPosts(PageRequest.of(page, size, sort));
        }

        return ResponseEntity.ok(postPagedResourcesAssembler.toModel(
                posts,
                post -> EntityModel.of(PostDTO.fromEntity(post))
        ));
    }

    @Operation(summary = "Получить количество лайков")
    @GetMapping("/count/{postId}")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long postId) {
        return ResponseEntity.ok(postService.countByPostId(postId));
    }

    @Operation(
            summary = "Поставить отметку нравиться"
    )
    @PostMapping("/put_like")
    public ResponseEntity<?> putLikePost(@RequestParam Long postId,
                                                     @RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));

        FavoritePosts favoritePosts = postService.putLike(userId, postId);
        long count = postService.countByPostId(postId);

        Map<String, Object> response = new HashMap<>();

        response.put("count", count);
        response.put("liked", favoritePosts != null);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Проверить, лайкнул ли пользователь пост")
    @GetMapping("/is_liked")
    public ResponseEntity<Boolean> isLiked(@RequestParam Long postId,
                                           @RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(postService.isLiked(userId, postId));
    }

    @Operation(summary = "Избранные посты пользователя")
    @GetMapping("/favorite_posts")
    public ResponseEntity<PagedModel<EntityModel<PostDTO>>> favoritePosts(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        Page<Post> posts = postService.findAllFavoritePostOfUser(userId, PageRequest.of(page, size));
        PagedModel<EntityModel<PostDTO>> pagedModel = postPagedResourcesAssembler.toModel(
                posts,
                post -> EntityModel.of(PostDTO.fromEntity(post))
        );
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(
            summary = "Количество новых постов за 7 дней"
    )
    @GetMapping("/posts_count")
    public ResponseEntity<Long> getPostsCountOfSevenDays(@RequestHeader("Authorization") String token) {

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        LocalDate sevenDays = LocalDate.now().minusDays(7);

        boolean isAdmin = user.getRoles().contains("ROLE_ADMIN");

        if (isAdmin) {
            return ResponseEntity.ok(postService.postsCountSevenDays(sevenDays));
        }

        return  ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Количество всех постов"
    )
    @GetMapping("/count_posts")
    public ResponseEntity<Long> getPostsCount(@RequestHeader("Authorization") String token){

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        boolean isAdmin = user.getRoles().contains("ROLE_ADMIN");

        if (isAdmin) {
            return ResponseEntity.ok(postService.postsCount());
        }

        return  ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Поиск поста по символам"
    )
    @GetMapping("/search_post")
    public ResponseEntity<List<PostSearchDTO>> searchPost(@RequestParam String symbols){

        List<Post> postList = postService.searchPost(symbols);

        if (postList.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<PostSearchDTO> result = postList.stream()
                .map(PostSearchDTO::fromEntity)
                .collect(Collectors.toList());


        return ResponseEntity.ok(result);
    }

}
