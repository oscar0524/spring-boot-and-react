package com.example.demo.security;

import org.springframework.security.core.session.ReactiveSessionInformation;
import org.springframework.security.core.session.ReactiveSessionRegistry;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;

/**
 * 基於Map的ReactiveSessionRegistry實現
 * 用於在記憶體中管理使用者會話
 */
public class MapReactiveSessionRegistry implements ReactiveSessionRegistry {

    private final Map<String, ReactiveSessionInformation> sessions = new ConcurrentHashMap<>();

    @Override
    public Flux<ReactiveSessionInformation> getAllSessions(Object principal) {
        return Flux.fromIterable(sessions.values())
                .filter(session -> session.getPrincipal().equals(principal));
    }

    @Override
    public Mono<Void> saveSessionInformation(ReactiveSessionInformation information) {
        return Mono.fromRunnable(() -> sessions.put(information.getSessionId(), information));
    }

    @Override
    public Mono<ReactiveSessionInformation> getSessionInformation(String sessionId) {
        return Mono.justOrEmpty(sessions.get(sessionId));
    }

    @Override
    public Mono<ReactiveSessionInformation> removeSessionInformation(String sessionId) {
        return Mono.justOrEmpty(sessions.remove(sessionId));
    }

    @Override
    public Mono<ReactiveSessionInformation> updateLastAccessTime(String sessionId) {
        return Mono.justOrEmpty(sessions.get(sessionId))
                .map(session -> {
                    ReactiveSessionInformation updatedSession = new ReactiveSessionInformation(
                            session.getPrincipal(),
                            session.getSessionId(),
                            Instant.now());
                    sessions.put(sessionId, updatedSession);
                    return updatedSession;
                });
    }
}