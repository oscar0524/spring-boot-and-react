package com.example.demo.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.server.session.CookieWebSessionIdResolver;
import org.springframework.web.server.session.WebSessionIdResolver;

@Configuration
public class SessionConfig {

    @Bean
    WebSessionIdResolver webSessionIdResolver() {
        CookieWebSessionIdResolver resolver = new CookieWebSessionIdResolver();
        resolver.setCookieName("SESSIONID");
        resolver.setCookieMaxAge(java.time.Duration.ofHours(1));
        resolver.addCookieInitializer(cookie -> {
            cookie.httpOnly(true);
            cookie.path("/");
        });
        return resolver;
    }
}