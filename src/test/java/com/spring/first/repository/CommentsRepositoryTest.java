/*package com.spring.first.repository;

import com.spring.first.config.SecurityConfigTest;
import com.spring.first.model.Comment;
import com.spring.first.model.Post;
import com.spring.first.model.User;
import com.spring.first.service.CommentService;
import com.spring.first.service.PostService;
import com.spring.first.service.UserService;
import com.spring.first.service.impl.CommentServiceImplConfig;
import com.spring.first.service.impl.UserServiceImplConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.AssertionErrors;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.util.AssertionErrors.assertNotNull;
@Transactional
@SpringBootTest
@Import({CommentServiceImplConfig.class, UserServiceImplConfig.class, PostRepositoryTest.class, SecurityConfigTest.class})
@ActiveProfiles({"test", "testSecurity"})
@WithMockUser(
        username = "admin",
        password = "admin123",
        roles = {"USER"},
        authorities = {"READ", "WRITE"}
)
public class CommentsRepositoryTest {

    @Autowired
    private CommentService commentService;

    @Autowired
    private PostService postService;

    @Autowired
    private UserService userService;

    @Test
    public void CommentRepository_allCommentsOfPost() {
        User user = User.builder()
                .name("example")
                .email("example@gmail.com")
                .dateOfBirth(LocalDate.of(1992, 6, 22))
                .build();

        userService.saveUser(user);

        User foundUser = userService.findByEmail("example@gmail.com");

        assertNotNull("Пользователь не должен быть null", foundUser);

        Post post = Post.builder()
                .dateOfPublication(LocalDate.now())
                .namePost("example_post")
                .views(100)
                .likes(7)
                .text("TyT kakoito text")
                .user(user)
                .build();

        postService.publicationPost(post);

        Post foundPost = postService.findPostById(post.getId());

        assertNotNull("Пост не должен быть равен нулю", foundPost);

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2024, 3, 24))
                .text("First example comment")
                .likes(10)
                        .build();

        commentService.writeComment(comment);

        Comment comment1 = Comment.builder()
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2024, 4, 14))
                .text("2 example comment")
                .likes(102)
                .build();

        commentService.writeComment(comment1);

        Comment comment2 = Comment.builder()
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2024, 12, 18))
                .text("3 example comment")
                .likes(19)
                .build();

        commentService.writeComment(comment2);

        Comment foundComment = commentService.findCommentById(comment.getId());

        assertNotNull("Комментарий не должен быть равен нулю", foundComment);

        List<Comment> allComments = commentService.allComments();


        assertEquals(3, allComments.size(), "Постов должно быть 3");

    }

    @Test
    public void CommentRepository_deleteCommentById() {
        User user = User.builder()
                .name("example")
                .email("example@gmail.com")
                .dateOfBirth(LocalDate.of(1992, 6, 22))
                .build();

        userService.saveUser(user);

        User foundUser = userService.findByEmail("example@gmail.com");

        assertNotNull("Пользователь не должен быть null", foundUser);

        Post post = Post.builder()
                .dateOfPublication(LocalDate.now())
                .namePost("example_post")
                .views(100)
                .likes(7)
                .text("TyT kakoito text")
                .user(user)
                .build();

        postService.publicationPost(post);

        Post foundPost = postService.findPostById(post.getId());

        assertNotNull("Пост не должен быть равен нулю", foundPost);

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2024, 3, 24))
                .text("First example comment")
                .likes(10)
                .build();

        commentService.writeComment(comment);


        Comment foundComment = commentService.findCommentById(comment.getId());

        assertNotNull("Комментарий не должен быть равен нулю", foundComment);

        commentService.deleteCommentById(comment.getId());

        Comment deletedComment = commentService.findCommentById(comment.getId());
        AssertionErrors.assertNull("Комментарий должен быть null", deletedComment);
    }

    @Test
    public void CommentRepository_updateComment() {
        User user = User.builder()
                .name("example")
                .email("example@gmail.com")
                .dateOfBirth(LocalDate.of(1992, 6, 22))
                .build();

        userService.saveUser(user);

        User foundUser = userService.findByEmail("example@gmail.com");

        assertNotNull("Пользователь не должен быть null", foundUser);

        Post post = Post.builder()
                .dateOfPublication(LocalDate.now())
                .namePost("example_post")
                .views(100)
                .likes(7)
                .text("TyT kakoito text")
                .user(user)
                .build();

        postService.publicationPost(post);

        Post foundPost = postService.findPostById(post.getId());

        assertNotNull("Пост не должен быть равен нулю", foundPost);

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2024, 3, 24))
                .text("First example comment")
                .likes(10)
                .build();

        commentService.writeComment(comment);


        Comment foundComment = commentService.findCommentById(comment.getId());

        assertNotNull("Комментарий не должен быть равен нулю", foundComment);

        Comment updateComment = Comment.builder()
                .id(comment.getId())
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2020, 1, 17))
                .text("Update comment")
                .likes(1011)
                .build();

        commentService.updateComment(updateComment);

        assertEquals(comment.getId(), updateComment.getId(), "ID должны совпадать");
        assertEquals("Update comment", updateComment.getText(), "Текст должен совпадать");

    }

    @Test
    public void CommentRepository_findAllByPostId() {
        User user = User.builder()
                .name("example")
                .email("example@gmail.com")
                .dateOfBirth(LocalDate.of(1992, 6, 22))
                .build();

        userService.saveUser(user);

        User foundUser = userService.findByEmail("example@gmail.com");

        assertNotNull("Пользователь не должен быть null", foundUser);

        Post post = Post.builder()
                .dateOfPublication(LocalDate.now())
                .namePost("example_post")
                .views(100)
                .likes(7)
                .text("TyT kakoito text")
                .user(user)
                .build();

        postService.publicationPost(post);

        Post foundPost = postService.findPostById(post.getId());

        assertNotNull("Пост не должен быть равен нулю", foundPost);

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2024, 3, 24))
                .text("First example comment")
                .likes(10)
                .build();

        commentService.writeComment(comment);

        Comment comment1 = Comment.builder()
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2024, 4, 14))
                .text("2 example comment")
                .likes(102)
                .build();

        commentService.writeComment(comment1);

        Comment comment2 = Comment.builder()
                .post(post)
                .user(user)
                .dateOfPublication(LocalDate.of(2024, 12, 18))
                .text("3 example comment")
                .likes(19)
                .build();

        commentService.writeComment(comment2);

        Comment foundComment = commentService.findCommentById(comment.getId());

        assertNotNull("Комментарий не должен быть равен нулю", foundComment);

        List<Comment> allComments = commentService.findAllByPostId(post.getId());


        assertEquals(3, allComments.size(), "Постов должно быть 3");
    }
}*/
