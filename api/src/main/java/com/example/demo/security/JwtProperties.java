package com.example.demo.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@Data
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String accessTokenSecret;
    private long accessTokenExpiration;
    private String refreshTokenSecret;
    private long refreshTokenExpiration;
}