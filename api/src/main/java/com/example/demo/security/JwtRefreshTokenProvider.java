package com.example.demo.security;

import org.springframework.stereotype.Component;

@Component
public class JwtRefreshTokenProvider extends JwtTokenProvider {

    public JwtRefreshTokenProvider(JwtProperties jwtProperties) {
        super(jwtProperties.getRefreshTokenSecret(), jwtProperties.getRefreshTokenExpiration());
    }
}
