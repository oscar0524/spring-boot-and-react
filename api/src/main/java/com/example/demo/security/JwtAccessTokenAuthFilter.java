package com.example.demo.security;

import org.springframework.stereotype.Component;

@Component
public class JwtAccessTokenAuthFilter extends JwtAuthenticationFilter {

    public JwtAccessTokenAuthFilter(JwtAccessTokenProvider jwtAccessTokenProvider) {
        super(jwtAccessTokenProvider);
    }
}
