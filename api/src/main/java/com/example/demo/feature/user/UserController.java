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

import com.example.demo.security.JwtAccessTokenProvider;
import com.example.demo.security.JwtRefreshTokenProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {
        private final JwtAccessTokenProvider jwtAccessTokenProvider;
        private final JwtRefreshTokenProvider jwtRefreshTokenProvider;

        @GetMapping("login")
        public Mono<ResponseEntity<Object>> login(
                        @RequestParam String username,
                        @RequestParam String redirect) {
                return Mono.just(username)
                                .map(name -> jwtAccessTokenProvider.generateToken(name))
                                .map(token -> ResponseEntity
                                                .status(302)
                                                .header("Location", redirect + "?accessToken=" + token)
                                                .build())
                                .switchIfEmpty(Mono.just(ResponseEntity.status(401).build()));
        }

        @GetMapping("token")
        public Mono<ResponseEntity<Token>> getToken() {
                log.debug("獲取令牌請求");
                return ReactiveSecurityContextHolder.getContext()
                                .map(SecurityContext::getAuthentication)
                                .filter(auth -> auth != null)
                                .map(Authentication::getName)
                                .filter(username -> username != null)
                                .map(username -> Token.builder()
                                                .accessToken(jwtAccessTokenProvider.generateToken(username))
                                                .refreshToken(jwtRefreshTokenProvider.generateToken(username))
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

        @GetMapping("hello")
        public Mono<ResponseEntity<String>> hello() {
                return Mono.just(ResponseEntity.ok("Hello, World!"));
        }
}
