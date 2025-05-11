package com.example.demo.security;

import org.springframework.stereotype.Component;

@Component
public class JwtRefreshTokenAuthFilter extends JwtAuthenticationFilter {

    public JwtRefreshTokenAuthFilter(JwtRefreshTokenProvider jwtRefreshTokenProvider) {
        super(jwtRefreshTokenProvider);
    }

}
