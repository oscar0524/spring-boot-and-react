package com.example.demo.security;

import java.util.Arrays;

// Spring Framework 相關導入
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.session.ReactiveSessionRegistry;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.SessionLimit;
import org.springframework.security.web.server.authentication.logout.DelegatingServerLogoutHandler;
import org.springframework.security.web.server.authentication.logout.SecurityContextServerLogoutHandler;
import org.springframework.security.web.server.authentication.logout.WebSessionServerLogoutHandler;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository;
import org.springframework.security.web.server.util.matcher.NegatedServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;
// CORS 相關導入
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

// Lombok 相關導入
import lombok.RequiredArgsConstructor;

// 其他導入
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Mono;

/**
 * Spring Security 配置類
 * 負責設置應用的安全設定，包括CORS、認證和授權
 */
@Configuration // 標記為配置類，供Spring容器識別
@EnableWebFluxSecurity // 啟用WebFlux的安全功能
@RequiredArgsConstructor // Lombok注解，自動生成包含final字段的構造函數
public class SecurityConfig {

    // 添加 ServerSecurityContextRepository Bean
    @Bean
    ServerSecurityContextRepository serverSecurityContextRepository() {
        return new WebSessionServerSecurityContextRepository();
    }

    /**
     * 提供 ReactiveSessionRegistry 以支援並行會話管理
     */
    @Bean
    ReactiveSessionRegistry reactiveSessionRegistry() {
        return new MapReactiveSessionRegistry();
    }

    /**
     * 配置CORS (跨域資源共享) 過濾器
     * 
     * @return 配置好的CORS過濾器
     */
    @Bean
    CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        // 允許的來源域名
        corsConfig.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        // 允許的HTTP方法
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE",
                "OPTIONS"));
        // 允許的HTTP請求頭
        corsConfig.setAllowedHeaders(Arrays.asList("*"));
        // 允許發送身份驗證信息(cookies等)
        corsConfig.setAllowCredentials(true);
        // 預檢請求的有效時間(秒)
        corsConfig.setMaxAge(3600L);

        // 註冊CORS配置到所有路徑
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE) // 設置過濾器的優先級
    SecurityWebFilterChain springFormSecurityFilterChan(
            ServerHttpSecurity http,
            CorsWebFilter corsWebFilter,
            ReactiveSessionRegistry reactiveSessionRegistry) {
        return http
                // 限制只對 /form/** 路徑生效
                .securityMatcher(ServerWebExchangeMatchers.pathMatchers("/form/**"))
                // 禁用CSRF保護
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                // 禁用HTTP基本認證
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                // 禁用表單登入
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                // 配置路徑的訪問權限
                .authorizeExchange(exchanges -> exchanges
                        // 登入路徑允許所有人訪問
                        .pathMatchers("/form/login").permitAll()
                        // 其他所有路徑需要認證
                        .anyExchange().authenticated())
                // 添加CORS過濾器，應放在認證過濾器之前
                .addFilterAt(corsWebFilter, SecurityWebFiltersOrder.CORS)
                .sessionManagement((sessions) -> sessions
                        .concurrentSessions((concurrency) -> concurrency
                                .maximumSessions(SessionLimit.of(1))
                                .sessionRegistry(reactiveSessionRegistry)))
                // 添加下面的異常處理配置
                .exceptionHandling(exceptionHandlingSpec -> exceptionHandlingSpec
                        .authenticationEntryPoint((exchange, ex) -> {
                            if (!exchange.getResponse().isCommitted()) {
                                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                            }
                            return Mono.empty();
                        }))
                .build();
    }

    /**
     * 配置Spring Security的過濾器鏈
     * 
     * @param http          服務器HTTP安全配置對象
     * @param jwtFilter     JWT認證過濾器
     * @param corsWebFilter CORS過濾器
     * @return 配置好的安全過濾器鏈
     */
    @Bean
    SecurityWebFilterChain springJWTSecurityFilterChain(
            ServerHttpSecurity http,
            JwtAuthenticationFilter jwtFilter,
            CorsWebFilter corsWebFilter) {

        return http
                // 設定此過濾器鏈處理除了 /form/** 以外的所有請求
                .securityMatcher(new NegatedServerWebExchangeMatcher(
                        ServerWebExchangeMatchers.pathMatchers("/form/**")))
                // 禁用CSRF保護
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                // 禁用HTTP基本認證
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                // 禁用表單登入
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                // 不保存安全上下文，實現無狀態會話
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                // 配置路徑的訪問權限
                .authorizeExchange(exchanges -> exchanges
                        // 登入路徑允許所有人訪問
                        .pathMatchers("/user/login").permitAll()
                        // 測試路徑允許所有人訪問
                        .pathMatchers("/test/hello").permitAll()
                        // 其他所有路徑需要認證
                        .anyExchange().authenticated())
                // 添加CORS過濾器，應放在認證過濾器之前
                .addFilterAt(corsWebFilter, SecurityWebFiltersOrder.CORS)
                // 添加JWT認證過濾器
                .addFilterAt(jwtFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                // 配置異常處理
                .exceptionHandling(exceptionHandlingSpec -> exceptionHandlingSpec
                        // 處理未認證的請求
                        .authenticationEntryPoint((exchange, ex) -> {
                            // 檢查響應是否已提交，避免重複設置狀態碼
                            if (!exchange.getResponse().isCommitted()) {
                                exchange.getResponse()
                                        .setStatusCode(HttpStatus.UNAUTHORIZED);
                            }
                            return Mono.empty();
                        })
                        // 處理權限不足的請求
                        .accessDeniedHandler((exchange, denied) -> {
                            // 檢查響應是否已提交，避免重複設置狀態碼
                            if (!exchange.getResponse().isCommitted()) {
                                exchange.getResponse()
                                        .setStatusCode(HttpStatus.FORBIDDEN);
                            }
                            return Mono.empty();
                        }))
                .build();
    }
}
