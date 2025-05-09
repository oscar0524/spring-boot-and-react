package com.example.demo.security;

import java.util.Arrays;
import java.util.Collections;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {
        @Bean
        CorsWebFilter corsWebFilter() {
                CorsConfiguration corsConfig = new CorsConfiguration();
                corsConfig.setAllowedOrigins(
                                Arrays.asList("*"));
                corsConfig.setMaxAge(3600L);
                corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

                // 明確指定允許的 headers
                corsConfig.setAllowedHeaders(Collections.singletonList("*"));
                // corsConfig.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", corsConfig);

                return new CorsWebFilter(source);
        }

        @Bean
        SecurityWebFilterChain springSecurityFilterChain(
                        ServerHttpSecurity http,
                        JwtAuthenticationFilter jwtFilter) {

                return http
                                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                                .authorizeExchange(exchanges -> exchanges
                                                .pathMatchers("/user/login").permitAll()
                                                .pathMatchers("/test/hello").permitAll()
                                                .anyExchange().authenticated())
                                .addFilterAt(jwtFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                                // .exceptionHandling(exceptionHandlingSpec -> exceptionHandlingSpec
                                // .authenticationEntryPoint((exchange, ex) -> Mono
                                // .fromRunnable(() -> exchange.getResponse()
                                // .setStatusCode(HttpStatus.UNAUTHORIZED)))
                                // .accessDeniedHandler((exchange, denied) -> Mono
                                // .fromRunnable(() -> exchange.getResponse()
                                // .setStatusCode(HttpStatus.FORBIDDEN))))
                                .build();
        }
}
