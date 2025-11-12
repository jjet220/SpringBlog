//package com.spring.first.repository;
//
//import com.spring.first.model.User;
//
//import com.spring.first.service.UserService;
//import com.spring.first.service.impl.UserServiceImplConfig;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
//import org.springframework.context.annotation.Import;
//import org.springframework.test.context.ActiveProfiles;
//import org.springframework.test.context.junit.jupiter.SpringExtension;
//
//
//import java.time.LocalDate;
//import java.util.List;
//
//import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.springframework.test.util.AssertionErrors.assertNotNull;
//import static org.springframework.test.util.AssertionErrors.assertNull;
//
//
//@DataJpaTest
//@ExtendWith(SpringExtension.class)
//@Import(UserServiceImplConfig.class)
//@ActiveProfiles("test")
//public class UserRepositoryTest {
//
//    @Autowired
//    private UserService userService;
//
//
//    @Test
//    public void UserRepository_FindById() {
//        User user = User.builder()
//                .name("example")
//                .email("example@gmail.com")
//                .dateOfBirth(LocalDate.of(1992, 6, 22))
//                .build();
//
//        userService.saveUser(user);
//
//        User foundUser = userService.findByEmail("example@gmail.com");
//
//        assertNotNull("Пользователь не должен быть null", foundUser);
//    }
//
//    @Test
//    public void UserRepository_DeleteByEmail(){
//        User user = User.builder()
//                .name("example")
//                .email("example@gmail.com")
//                .dateOfBirth(LocalDate.of(1992, 6, 22))
//                .build();
//
//        userService.saveUser(user);
//
//        userService.deleteUserByEmail("example@gmail.com");
//        User deletedUser = userService.findByEmail("example@gmail.com");
//
//        assertNull("Пользователь должен быть null", deletedUser);
//    }
//
//    @Test
//    public void UserRepository_UpdateUser(){
//        User user = User.builder()
//                .name("example")
//                .email("example@gmail.com")
//                .dateOfBirth(LocalDate.of(1992, 6, 22))
//                .build();
//        userService.saveUser(user);
//
//        User savedUser = userService.findByEmail("example@gmail.com");
//        assertNotNull( "Пользователь должен существовать до обновления", savedUser);
//
//        User updatedUser = User.builder()
//                .id(savedUser.getId())
//                .roles("USER")
//                .name("updated")
//                .email("example@gmail.com")
//                .dateOfBirth(LocalDate.of(1992, 6, 22))
//                .build();
//
//        userService.updateUser(updatedUser);
//
//        User foundUser = userService.findByEmail("example@gmail.com");
//        assertNotNull("Пользователь не должен быть null после обновления", foundUser);
//        assertEquals("updated", foundUser.getName(), "Имя пользователя должно быть обновлено");
//    }
//
//    @Test
//    public void UserRepository_FindAllUsers() {
//        User user0 = User.builder()
//                .name("example0")
//                .email("example@gmail.com")
//                .dateOfBirth(LocalDate.of(1992, 6, 22))
//                .build();
//        userService.saveUser(user0);
//        User user1 = User.builder()
//                .name("Anton")
//                .email("anton1@gmail.com")
//                .dateOfBirth(LocalDate.of(1974, 2, 18))
//                .build();
//        userService.saveUser(user1);
//
//        User user2 = User.builder()
//                .name("egorik")
//                .email("egorik@gmail.com")
//                .dateOfBirth(LocalDate.of(2002, 11, 9))
//                .build();
//        userService.saveUser(user2);
//
//        User user3 = User.builder()
//                .name("negroid")
//                .email("negroid@gmail.com")
//                .dateOfBirth(LocalDate.of(1961, 7, 30))
//                .build();
//        userService.saveUser(user3);
//
//        List<User> allUsers = userService.findAllUser();
//
//        assertEquals(4, allUsers.size(), "Пользователей должно быть 4");
//    }
//
//}