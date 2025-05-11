package com.example.demo.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
public class JwtAuthenticationFilter implements WebFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // 沒有認證頭或格式不正確，直接繼續過濾器鏈
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }

        // 提取並驗證 JWT
        String jwt = authHeader.substring(7);
        try {
            String username = jwtTokenProvider.extractUsername(jwt);

            // 用戶名為空或令牌無效，直接繼續過濾器鏈
            if (username == null || !jwtTokenProvider.validateToken(jwt, username)) {
                return chain.filter(exchange);
            }

            // 創建認證對象
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(username, null,
                    null);

            // 先設置安全上下文，然後執行過濾器鏈
            return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));

        } catch (ExpiredJwtException e) {
            // 令牌已過期
            log.debug("JWT令牌已過期: {}", e.getMessage());
            return chain.filter(exchange);
        } catch (UnsupportedJwtException | MalformedJwtException | SignatureException | IllegalArgumentException e) {
            // 其他JWT驗證錯誤
            log.debug("JWT令牌驗證失敗: {}", e.getMessage());
            return chain.filter(exchange);
        }
    }
}
