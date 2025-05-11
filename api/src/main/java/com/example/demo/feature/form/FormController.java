package com.example.demo.feature.form;

import java.util.Collections;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import com.example.demo.feature.user.Token;
import com.example.demo.feature.user.UserInfo;
import com.example.demo.security.JwtAccessTokenProvider;
import com.example.demo.security.JwtRefreshTokenProvider;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/form")
@RequiredArgsConstructor
public class FormController {

        // 使用 WebFlux 相容的安全上下文儲存庫
        private final ServerSecurityContextRepository securityContextRepository;

        private final JwtAccessTokenProvider jwtAccessTokenProvider;
        private final JwtRefreshTokenProvider jwtRefreshTokenProvider;

        @GetMapping("/login")
        public Mono<ResponseEntity<Object>> login(
                        @RequestParam String username,
                        @RequestParam String redirect,
                        ServerWebExchange exchange) {
                UsernamePasswordAuthenticationToken authentication = UsernamePasswordAuthenticationToken.authenticated(
                                username,
                                null,
                                Collections.emptyList());

                SecurityContext context = new SecurityContextImpl(authentication);
                return securityContextRepository.save(exchange, context)
                                .thenReturn(ResponseEntity.status(HttpStatus.FOUND)
                                                .header(HttpHeaders.LOCATION, redirect)
                                                .build());
        }

        @GetMapping("/logout")
        public Mono<ResponseEntity<Object>> logout(
                        @RequestParam String redirect,
                        ServerWebExchange exchange) {
                // 清除安全上下文
                return securityContextRepository.save(exchange, null)
                                .then(exchange.getSession())
                                .flatMap(session -> {
                                        // 使 session 失效
                                        return session.invalidate().then(Mono.just(
                                                        ResponseEntity.status(HttpStatus.FOUND)
                                                                        .header(HttpHeaders.LOCATION, redirect)
                                                                        .build()));
                                });
        }

        @GetMapping("/token")
        public Mono<ResponseEntity<Token>> token(ServerWebExchange exchange) {
                return exchange.getPrincipal()
                                .cast(org.springframework.security.core.Authentication.class)
                                .map(authentication -> authentication.getName())
                                .map(username -> Token.builder()
                                                .accessToken(jwtAccessTokenProvider.generateToken(username))
                                                .refreshToken(jwtRefreshTokenProvider.generateToken(username))
                                                .build())
                                .map(ResponseEntity::ok)
                                .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()))
                                .onErrorResume(e -> Mono
                                                .just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()));
        }

        @GetMapping("/info")
        public Mono<ResponseEntity<UserInfo>> info(ServerWebExchange exchange) {
                return exchange.getPrincipal()
                                .cast(org.springframework.security.core.Authentication.class)
                                .map(authentication -> authentication.getName())
                                .map(username -> UserInfo.builder()
                                                .username(username)
                                                .build())
                                .map(ResponseEntity::ok)
                                .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()))
                                .onErrorResume(e -> Mono
                                                .just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()));
        }

}
