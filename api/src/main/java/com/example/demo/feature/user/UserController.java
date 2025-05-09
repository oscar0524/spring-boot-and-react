package com.example.demo.feature.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {
        private final JwtUtil jwtUtil;

        @GetMapping("login")
        public Mono<ResponseEntity<Object>> login(
                        @RequestParam String username,
                        @RequestParam String redirect) {
                return Mono.just(username)
                                .map(name -> jwtUtil.generateToken(name))
                                .map(token -> ResponseEntity
                                                .status(302)
                                                .header("Location", redirect + "?accessToken=" + token)
                                                .build())
                                .switchIfEmpty(Mono.just(ResponseEntity.status(401).build()));
        }

        @GetMapping("token")
        public Mono<ResponseEntity<Token>> getToken() {
                return ReactiveSecurityContextHolder.getContext()
                                .map(SecurityContext::getAuthentication)
                                .filter(auth -> auth != null)
                                .map(Authentication::getName)
                                .filter(username -> username != null)
                                .map(username -> jwtUtil.generateToken(username))
                                .map(token -> Token.builder()
                                                .accessToken(token)
                                                .build())
                                .map(ResponseEntity::ok)
                                .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()))
                                .onErrorResume(e -> Mono
                                                .just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()));
        }

        @GetMapping("info")
        public Mono<ResponseEntity<UserInfo>> getInfo() {
                return ReactiveSecurityContextHolder.getContext()
                                .map(SecurityContext::getAuthentication)
                                .filter(auth -> auth != null)
                                .map(Authentication::getName)
                                .filter(username -> username != null)
                                .map(username -> UserInfo.builder()
                                                .username(username)
                                                .build())
                                .map(ResponseEntity::ok)
                                .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()))
                                .doOnError(e -> {
                                        // 只記錄錯誤，不嘗試修改響應
                                        log.error("處理用戶信息時發生錯誤", e);
                                });
        }
}
