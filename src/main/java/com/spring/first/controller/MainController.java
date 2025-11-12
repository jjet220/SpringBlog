package com.spring.first.controller;

import com.spring.first.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Tag(name = "main_methods")
@Controller
@RequiredArgsConstructor
public class MainController {

    private final UserService service;

    @Operation(summary = "Главная страница")
    @GetMapping("/welcome")
    public String welcome() {
        return "main_page";
    }


    @Operation(summary = "Страница для регистрации пользователя")
    @GetMapping("/registration")
    public String registration() {
        return "registration";
    }

    @Operation(summary = "Страниц для аунтетификации пользователя")
    @GetMapping("/authentication")
    public String authentication() {
        return "Authentication";
    }

    @Operation(summary = "Лента")
    @GetMapping("/ribbon")
    public String ribbon() {
        return "ribbon";
    }

    @Operation(summary = "Пост")
    @GetMapping("/post/{id}")
    public String post(@PathVariable Long id) {
        return "post";
    }

    @Operation(summary = "Админ панель")
    @GetMapping("/panel-admin")
    public String adminPanel() {
        System.out.println("=== CONTROLLER HIT ===");
        System.out.println("Current roles: " +
                SecurityContextHolder.getContext().getAuthentication().getAuthorities());
        return "adminPanel";
    }

    @Operation(summary = "Профиль пользователя, индитификатор по ID, данные из UserController переброшеные через фронтэнд js")
    @GetMapping("/profile/{id}")
    public String profileUserById(@PathVariable Long id) {
        return "profileUser";
    }

}