/*package com.spring.first.repository;

import com.spring.first.model.Post;
import com.spring.first.model.User;
import com.spring.first.service.PostService;
import com.spring.first.service.UserService;
import com.spring.first.service.impl.PostServiceImplConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.util.AssertionErrors.assertNotNull;
import static org.springframework.test.util.AssertionErrors.assertNull;

@Transactional

@SpringBootTest
@ActiveProfiles({"test", "testSecurity"})
@WithMockUser(
        username = "admin",
        password = "admin123",
        roles = {"USER"},
        authorities = {"READ", "WRITE"}
)
@Import(PostServiceImplConfig.class)
public class PostRepositoryTest {

    @Autowired
    private PostService postService;

    @Autowired
    private UserService userService;

    @Test
    public void PostRepository_FindPostById(){

        User user = User.builder()
                .name("testing_name")
                .email("test@gmail.com")
                .dateOfBirth(LocalDate.of(1990, 4, 12))
                .password("pass_example")
                .build();

        userService.saveUser(user);

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

        //System.out.println(post.getText());
        assertNotNull("Пост не должен быть равен нулю", foundPost);
    }

    @Test
    public void PostRepository_deletePostById() {
        User user = User.builder()
                .name("testing_name")
                .email("test@gmail.com")
                .dateOfBirth(LocalDate.of(1990, 4, 12))
                .password("pass_example")
                .build();

        userService.saveUser(user);

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

        assertNotNull("Пост не должен быть равен нулю до удаления", foundPost);

        postService.deletePostById(post.getId());

        Post deletedPost = postService.findPostById(post.getId());
        assertNull("Пост должен быть null", deletedPost);
    }

    @Test
    public void PostRepository_findAllPosts() {
        User user = User.builder()
                .name("testing_name")
                .email("test@gmail.com")
                .dateOfBirth(LocalDate.of(1990, 4, 12))
                .password("pass_example")
                .build();

        userService.saveUser(user);

        Post post0 = Post.builder()
                .dateOfPublication(LocalDate.now())
                .namePost("example_post0")
                .views(100)
                .likes(7)
                .text("TyT kakoito text")
                .user(user)
                .build();

        postService.publicationPost(post0);

        Post post1 = Post.builder()
                .dateOfPublication(LocalDate.now())
                .namePost("example_post1")
                .views(10000)
                .likes(7)
                .text("TyT kakoito text")
                .user(user)
                .build();

        postService.publicationPost(post1);

        Post post2 = Post.builder()
                .dateOfPublication(LocalDate.now())
                .namePost("example_post2")
                .views(10230)
                .likes(73)
                .text("TyT kakoito text2")
                .user(user)
                .build();

        postService.publicationPost(post2);

        List<Post> allPosts = postService.findAllPosts();

        assertEquals(3, allPosts.size(), "Постов должно быть 3");
    }

    @Test
    public void PostRepository_updatePost() {
        User user = User.builder()
                .name("testing_name")
                .email("test@gmail.com")
                .dateOfBirth(LocalDate.of(1990, 4, 12))
                .password("pass_example")
                .build();

        userService.saveUser(user);

        Post post = Post.builder()
                .dateOfPublication(LocalDate.now())
                .namePost("example_post")
                .views(100)
                .likes(7)
                .text("TyT kakoito text")
                .user(user)
                .build();

        postService.publicationPost(post);

        Post updatePost = Post.builder()
                .id(post.getId())
                .dateOfPublication(LocalDate.now())
                .namePost("example_post")
                .views(1001)
                .likes(70)
                .text("change")
                .user(user).build();

        postService.updatePost(updatePost);

        Post foundPost = postService.findPostById(updatePost.getId());
        assertNotNull("Пост не должен быть null после обновления", foundPost);

        assertEquals(post.getId(), updatePost.getId(), "ID должны совпадать");
        assertEquals(1001, updatePost.getViews(), "Количество просмотров должно быть 1001");
    }

    @Test
    public void PostRepository_findAllPostOfUserByUserId() {
        User user = User.builder()
                .name("testing_name")
                .email("test@gmail.com")
                .dateOfBirth(LocalDate.of(1990, 4, 12))
                .password("pass_example")
                .build();

        userService.saveUser(user);


    }
}
*/