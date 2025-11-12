package com.spring.first.controller;

import com.spring.first.DTO.CommentDTO;
import com.spring.first.config.JwtService;
import com.spring.first.model.*;
import com.spring.first.repository.PostRepository;
import com.spring.first.repository.UserRepository;
import com.spring.first.service.CommentService;
import com.spring.first.service.PostService;
import com.spring.first.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.print.Pageable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RequiredArgsConstructor
@Tag(name = "comments_methods")
@RestController
@RequestMapping("/api/v1/comments")
public class CommentController {

    private final PostService postService;
    private final JwtService jwtService;
    private final CommentService commentService;
    private final PagedResourcesAssembler<Comment> pagedResourcesAssembler;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final UserService userService;

    @Operation(
            summary = "Все комментарии поста"
    )
    @GetMapping("/{postId}/comments_of_post")
    public ResponseEntity<PagedModel<EntityModel<CommentDTO>>> findAllCommentsOfPost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Comment> comments = commentService.findAllCommentOfPostByPostId(PageRequest.of(page, size), postId);
        PagedModel<EntityModel<CommentDTO>> pagedModel =  pagedResourcesAssembler.toModel(comments, comment -> EntityModel.of(CommentDTO.fromEntity(comment)));
        return ResponseEntity.ok(pagedModel);
    }


    @Operation(
            summary = "Добавление комментария под пост"
    )
    @PostMapping("/write_comment/{postId}")
    public ResponseEntity<Map<String, String>> writeComment(@RequestBody CommentDTO commentDTO,
            @PathVariable Long postId,
            @RequestHeader("Authorization") String token) {

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));

        Optional<User> optionalUser = userRepository.findById(userId);
        User user = optionalUser.orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        Post post = postRepository.findPostById(postId);

        Comment commentResponse = commentDTO.toEntity();

        post.getComments().add(commentResponse);

        commentResponse.setUser(user);

        commentResponse.setPost(post);

        commentService.writeComment(commentResponse);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Комментарий написан");
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Количество комментириев"
    )
    @GetMapping("/count/{postId}")
    public ResponseEntity<Long> getCommentsCount(@PathVariable Long postId) {
        Long count = commentService.countByPostId(postId);
        return ResponseEntity.ok(count);
    }

    @Operation(
            summary = "Удаление комментария под постом"
    )
    @DeleteMapping("/delete_comment/{commentId}")
    public ResponseEntity<Void> deleteCommentById(@PathVariable Long commentId) {
        try {
            commentService.deleteCommentById(commentId);

            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

    }

    @Operation(
            summary = "Обновление комментария под постом"
    )
    @PutMapping("/update_comment/{commentId}")
    public ResponseEntity<CommentDTO> updateComment(@PathVariable Long commentId,
                                                 @RequestBody CommentDTO updateCommentDTO,
                                                 @RequestHeader("Authorization") String token) {

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));

        Comment comment = commentService.findCommentById(commentId);

        if (comment == null) {
            return ResponseEntity.notFound().build();
        }

        comment.setText(updateCommentDTO.getText());

        Comment savedComment = commentService.updateComment(comment);
        return ResponseEntity.ok(CommentDTO.fromEntity(savedComment));
    }

    @Operation(
            summary = "Найти комментарий по его Id"
    )
    @GetMapping("/{commentId}")
    public ResponseEntity<CommentDTO> findComment(@PathVariable Long commentId) {
        Comment comment = commentService.findCommentById(commentId);
        return ResponseEntity.ok(CommentDTO.fromEntity(comment));
    }

    @Operation(
            summary = "Найти комменатрии пользователя"
    )
    @GetMapping("/{userId}/comments")
    public  ResponseEntity<PagedModel<EntityModel<CommentDTO>>> findCommentsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        Optional<User> optionalUser = userRepository.findById(userId);
        User user = optionalUser.orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        Page<Comment> comments = commentService.findAllCommentsByUserId(PageRequest.of(page, size), userId);
        PagedModel<EntityModel<CommentDTO>> pagedModel =  pagedResourcesAssembler.toModel(comments, comment -> EntityModel.of(CommentDTO.fromEntity(comment)));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(
            summary = "Поставить отметку нравиться комменатрию"
    )
    @PostMapping("/put_like")
    public ResponseEntity<?> putLikeComment(@RequestParam Long commentId,
                                         @RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));

        CommentLike commentLike = commentService.putLike(userId, commentId);
        long count = commentService.countByCommentId(commentId);

        Map<String, Object> response = new HashMap<>();

        response.put("count", count);
        response.put("liked", commentLike != null);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Проверить, лайкнул ли пользователь комментарий")
    @GetMapping("/is_liked")
    public ResponseEntity<Boolean> isLiked(@RequestParam Long commentId,
                                           @RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(commentService.isLiked(userId, commentId));
    }

    @Operation(summary = "Получить количество лайков")
    @GetMapping("/like/count/{commentId}")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.countByCommentId(commentId));
    }

    @Operation(
            summary = "Количество всех комментариев"
    )
    @GetMapping("/count_comments")
    public ResponseEntity<Long> getCommentsCount(@RequestHeader("Authorization") String token){

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        boolean isAdmin = user.getRoles().contains("ROLE_ADMIN");

        if (isAdmin) {
            return ResponseEntity.ok(commentService.countComments());
        }

        return  ResponseEntity.noContent().build();
    }
}
