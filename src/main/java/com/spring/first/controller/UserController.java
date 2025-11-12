package com.spring.first.controller;

import com.spring.first.DTO.PostDTO;
import com.spring.first.DTO.UserDTO;
import com.spring.first.DTO.UserSearchDTO;
import com.spring.first.DTO.UserWithAvatarDTO;
import com.spring.first.config.JwtService;
import com.spring.first.config.MyUserDetailsService;
import com.spring.first.model.User;

import com.spring.first.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

//http://localhost:8080/swagger-ui/index.html#/ подключение к swagger
//http://localhost:8080/swagger-ui/index.html почему-то теперь так
@Tag(name = "USER API", description = "Операции с пользователями")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;
    private final MyUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final PagedResourcesAssembler<User> userPagedResourcesAssembler;


    @Operation(
            summary = "Определить какой ты пользователь",
            description = "Возвращает пользователя и его информацию"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Пользователь найден",
                    content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "401", description = "Пользователь не авторизован"),
            @ApiResponse(responseCode = "404", description = "Пользователь не найден"),
            @ApiResponse(responseCode = "500", description = "Ошибка сервера")
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@Parameter(description = "JWT-токен", example = "$2a$10$0UIMakCk70tLK8s0JtUFR.w5ge.pF7DCiG4WWB80wu1AinE/DWXsS")
                                                   @RequestHeader("Authorization") String token) {
        try {

            String jwt = token.replace("Bearer ", "");
            String username = jwtService.extractUserName(jwt);

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if(!jwtService.isTokenValid(jwt, userDetails)) {
                System.out.println("Ошибка");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }

            Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
            User user = userService.findUserById(userId);


            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }


    @Operation(
            summary = "Поиск всех пользователей",
            description = "Возвращает всех пользователей",
            security = @SecurityRequirement(name = "bearAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Пользователи найдены",
                    content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "404", description = "Пользователи не найдены"),
            @ApiResponse(responseCode = "500", description = "Ошибка сервера")
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/all_user")
    public ResponseEntity<PagedModel<EntityModel<UserDTO>>> findAllUser(
            @Parameter(description = "Количество страниц") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Количество объектов на страницу")@RequestParam(defaultValue = "20") int size) {
        try {

            Page<User> users = userService.findAllUsers(PageRequest.of(page, size));

            if (users.isEmpty()) {
                ResponseEntity.status(HttpStatus.NOT_FOUND);
            }

            PagedModel<EntityModel<UserDTO>> pagedModel = userPagedResourcesAssembler.toModel(
                    users,
                    user -> EntityModel.of(UserDTO.fromEntity(user))
            );

            return ResponseEntity.ok(pagedModel);

        } catch (Exception e) {
            return  ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @Deprecated
    @Operation(summary = "Устаревший метод для нахождения пользователя по имени")
    @GetMapping("/{name}")
    public Optional<User> findByName(String username){
        return userService.findByName(username);
    }


    @Operation(
            summary = "Ищим пользователя по ID",
            description = "Возвращает пользователя"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Пользователь найдены",
                    content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "404", description = "Пользователь не найден"),
            @ApiResponse(responseCode = "500", description = "Ошибка сервера")
    })
    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> findUserById(@Parameter(description = "ID пользователя") @PathVariable Long userId) {
        try {

            User user = userService.findUserById(userId);

            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(UserDTO.fromEntity(user));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @Operation(
            summary = "Ищим профиль пользователя по ID",
            description = "Возвращает пользователя c его полными данными"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Профиль с пользователем найдены",
                    content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "404", description = "Профиль с пользователем не найдены"),
            @ApiResponse(responseCode = "500", description = "Ошибка сервера")
    })
    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserDTO> getUserProfile(@Parameter(description = "ID пользователя") @PathVariable Long userId) {
        try {

            User user = userService.findUserById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(UserDTO.fromEntity(user));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @Operation(
            summary = "Сохраняет пользователя в базе данных",
            description = "Отправляет данные новго пользователя в БД"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Пользователь сохранён",
                    content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "500", description = "Ошибка сервера")
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Данные пользователя",
            required = true,
            content = @Content(schema = @Schema(implementation = UserDTO.class))
    )
    @PostMapping("/save_userDTO")
    public ResponseEntity<UserDTO> saveUserDTO(@RequestBody UserDTO userDTO) {

        try {
            User savedUser = userService.saveUserDTO(userDTO);
            return ResponseEntity.ok(UserDTO.fromEntity(savedUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @Deprecated
    @Operation(
            summary = "Сохраняет пользователя в базе данных(устаревшая)"
    )
    @PostMapping("/save_user")
    public String saveUser(@RequestBody User user) {
        userService.saveUser(user);
        return "Saved user";
    }


    //@PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Deprecated
    @Operation(
            summary = "Находит пользователя в базе данных по электронной почте(устаревшая)"
    )
    @GetMapping("/{email}")
    public User findByEmail(@PathVariable String email) {
        return userService.findByEmail(email);
    }


    @Operation(
            summary = "Обновляет информацию о пользователе в базе данных"
    )
    @PutMapping("/update_user/{userId}")
    public ResponseEntity<User> updateUser(@RequestBody User user,
                                           @PathVariable Long userId,
                                           @RequestHeader("Authorization") String token){
        Long ourUserId = jwtService.extractUserId(token.replace("Bearer ", ""));
        if (Objects.equals(userId, ourUserId)) {
            User existUser = userService.findUserById(userId);
            if (user.getName() != null) {
                existUser.setName(user.getName());
            }
            if (user.getEmail() != null) {
                existUser.setEmail(user.getEmail());
            }
            if (user.getPassword() != null) {
                existUser.setPassword(passwordEncoder.encode(user.getPassword()));
            }
            if (user.getAvatar() != null) {
                existUser.setAvatar(user.getAvatar());
            }
            if (user.getAvatarContentType() != null) {
                existUser.setAvatarContentType(user.getAvatarContentType());
            }
            User savedUser = userService.updateUser(existUser);
            return ResponseEntity.ok(savedUser);
        }
        return ResponseEntity.notFound().build();
    }

    @Operation(
            summary = "Проверка пороля"
    )
    @PostMapping("/check_password")
    public ResponseEntity<Boolean> checkPassword(
            @RequestBody String inputPassword,
            @RequestHeader("Authorization") String token
    ) {
        try {
            Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
            User user = userService.findUserById(userId);

            if (user == null) {
                return ResponseEntity.status(404).body(false);
            }

            System.out.println("Input pass: " + inputPassword);
            System.out.println("DB hash: " + user.getPassword());

            boolean isValid = passwordEncoder.matches(inputPassword, user.getPassword());
            System.out.println("Match result: " + isValid);

            return ResponseEntity.ok(isValid);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(false);
        }
    }

    @Operation(
            summary = "Удаляет пользователя из базы данных"
    )
    @DeleteMapping("/delete_user/{userId}")
    public ResponseEntity<Void> deleteUser(
                           @PathVariable Long userId,
                           @RequestHeader("Authorization") String token){
        Long ourUserId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(ourUserId);
        if (userId == ourUserId || user.getRoles().equals("ROLE_ADMIN")) {
            try {
                SecurityContextHolder.clearContext();
                userService.deleteById(userId);
                return  ResponseEntity.noContent().build();
            } catch (Exception e) {
                return  ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{userId}/avatarUP")
    public ResponseEntity<UserDTO> uploadAvatar(
            @RequestHeader("Authorization") String token,
            @RequestParam("file") MultipartFile file) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        try {
            User user = userService.findUserById(userId);
            user.setAvatar(file.getBytes());
            user.setAvatarContentType(file.getContentType());
            User updatedUser = userService.updateUser(user);
            return ResponseEntity.ok(UserDTO.fromEntity(updatedUser));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{userId}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long userId) {
        try {
            User user = userService.findUserById(userId);
            if (user.getAvatar() == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(user.getAvatarContentType()))
                    .body(user.getAvatar());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{userId}/avatarRM")
    public ResponseEntity<Void> removeAvatar(@PathVariable Long userId) {
        userService.removeUserAvatar(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/default-avatar")
    public ResponseEntity<byte[]> getDefaultAvatar() throws IOException {
        InputStream in = getClass().getResourceAsStream("/static/R7iW4fmaKrA.png");
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(in.readAllBytes());
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserWithAvatarDTO> getUserProfileAvatar(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserWithAvatar(userId));
    }

    @PutMapping("/send_friend")
    public ResponseEntity<String> sendFriend(
            @RequestBody Long friendId,
            @RequestHeader("Authorization") String token) {
        try {
            Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
            userService.sendFriendRequest(userId, friendId);
            return ResponseEntity.ok("Friend request sent successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error");
        }
    }

    @PutMapping("/accept_friend")
    public ResponseEntity<Void> acceptFriend(@RequestBody Long friendId,
                                           @RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        try {
            userService.acceptFriendRequest(userId, friendId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/remove_friend")
    public ResponseEntity<Void> removeFriend(@RequestBody Long friendId,
                                          @RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        try {
            userService.removeFriend(userId, friendId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/check_relationship")
    public ResponseEntity<Map<String, Object>> checkRelationship(
            @RequestParam Long userId,
            @RequestParam Long friendId,
            @RequestHeader("Authorization") String token) {

        try {
            Map<String, Object> relationship = userService.checkRelationship(userId, friendId);
            return ResponseEntity.ok(relationship);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/incoming_friend_requests")
    public ResponseEntity<Set<User>> incomingFriendRequests(@RequestHeader("Authorization") String token){
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));

        try {
            return ResponseEntity.ok(userService.findIncomingFriendRequests(userId));
        } catch (Exception e){
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return ResponseEntity.notFound().build();
    }
    @GetMapping("/outgoing_friend_requests")
    public ResponseEntity<Set<User>> outgoingFriendRequests(@RequestHeader("Authorization") String token){
        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));

        try {
            return ResponseEntity.ok(userService.findOutgoingFriendRequests(userId));
        } catch (Exception e){
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/find_friends/{userId}")
    public ResponseEntity<Set<User>> findFriendsByUser(@PathVariable Long userId, @RequestHeader("Authorization") String token){
        try {
            return ResponseEntity.ok(userService.findFriendsByUserId(userId));
        } catch (Exception e){
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return ResponseEntity.notFound().build();
    }

    @Operation(
            summary = "Количество новых пользователей за 7 дней"
    )
    @GetMapping("/users_count")
    public ResponseEntity<Long> getUsersCountOfSevenDays(@RequestHeader("Authorization") String token) {

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        LocalDate sevenDays = LocalDate.now().minusDays(7);

        boolean isAdmin = user.getRoles().contains("ROLE_ADMIN");

        if (isAdmin) {
            return ResponseEntity.ok(userService.usersCountSevenDays(sevenDays));
        }

        return  ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Количество всех пользователей"
    )
    @GetMapping("/count_users")
    public ResponseEntity<Long> getUsersCount(@RequestHeader("Authorization") String token){

        Long userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        User user = userService.findUserById(userId);

        boolean isAdmin = user.getRoles().contains("ROLE_ADMIN");

        if (isAdmin) {
            return ResponseEntity.ok(userService.usersCount());
        }

        return  ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Поиск пользователя по символам"
    )
    @GetMapping("/search_user")
    public ResponseEntity<List<UserSearchDTO>> searchUser(@RequestParam String symbols){

        List<User> userList = userService.searchUser(symbols);

        if (userList.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<UserSearchDTO> result = userList.stream()
                .map(UserSearchDTO::fromEntity)
                .collect(Collectors.toList());


        return ResponseEntity.ok(result);
    }

}
