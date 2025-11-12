/*package com.spring.first.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spring.first.model.User;
import com.spring.first.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        mockMvc = standaloneSetup(userController).build();
    }

    @Test
    public void testWelcome() throws Exception {
        mockMvc.perform(get("/api/v1/users/welcome"))
                .andExpect(status().isOk())
                .andExpect(content().string("Welcome!"));
    }

    @Test
    public void testProtect() throws Exception {
        mockMvc.perform(get("/api/v1/users/welcome/protected"))
                .andExpect(status().isOk())
                .andExpect(content().string("Protected www"));
    }

    @Test
    public void testFindAllStudent() throws Exception {
        List<User> users = Collections.singletonList(
                User.builder()
                        .name("example")
                        .email("example@gmail.com")
                        .dateOfBirth(LocalDate.of(1992, 6, 22))
                        .build()
        );

        when(userService.findAllUser()).thenReturn(users);

        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(users)));
    }

    @Test
    public void testSaveUser() throws Exception {
        User user = User.builder()
                .name("example")
                .email("example@gmail.com")
                .dateOfBirth(LocalDate.of(1992, 6, 22))
                .build();

        mockMvc.perform(post("/api/v1/users/save_user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isOk())
                .andExpect(content().string("Saved user"));

        verify(userService, times(1)).saveUser(user);
    }

    @Test
    public void testFindByEmail() throws Exception {
        User user = User.builder()
                .name("example")
                .email("example@gmail.com")
                .dateOfBirth(LocalDate.of(1992, 6, 22))
                .build();

        when(userService.findByEmail("example@gmail.com")).thenReturn(user);

        mockMvc.perform(get("/api/v1/users/example@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(user)));
    }

    @Test
    public void testUpdateUser() throws Exception {
        User user = User.builder()
                .name("example")
                .email("example@gmail.com")
                .dateOfBirth(LocalDate.of(1992, 6, 22))
                .build();

        when(userService.updateUser(user)).thenReturn(user);

        mockMvc.perform(put("/api/v1/users/update_user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(user)));
    }

    @Test
    public void testDeleteUser() throws Exception {
        mockMvc.perform(delete("/api/v1/users/delete_user/example@gmail.com"))
                .andExpect(status().isOk());

        verify(userService, times(1)).deleteUser("example@gmail.com");
    }
}*/