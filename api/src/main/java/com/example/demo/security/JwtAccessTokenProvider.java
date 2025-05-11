package com.example.demo.security;

import org.springframework.stereotype.Component;

@Component
public class JwtAccessTokenProvider extends JwtTokenProvider {

    public JwtAccessTokenProvider(JwtProperties jwtProperties) {
        super(jwtProperties.getAccessTokenSecret(), jwtProperties.getAccessTokenExpiration());
    }
}
