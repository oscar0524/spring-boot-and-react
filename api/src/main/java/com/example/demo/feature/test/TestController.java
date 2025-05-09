package com.example.demo.feature.test;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping("hello")
    public Mono<String> hello() {
        return Mono.just("Hello, World!");
    }
}
