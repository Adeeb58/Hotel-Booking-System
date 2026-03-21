package org.hotelbooking.apigateway.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class AuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Allow public endpoints
        if (path.contains("/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("Missing Authorization Header");
            return;
        }

        String token = authHeader.substring(7);

        try {
            jwtUtil.validateToken(token);
        } catch (Exception e) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("Invalid Token");
            return;
        }

        String username = jwtUtil.extractUsername(token);
        String role = jwtUtil.extractRole(token);

        jakarta.servlet.http.HttpServletRequestWrapper requestWrapper = new jakarta.servlet.http.HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if ("X-User-Id".equalsIgnoreCase(name)) {
                    return username;
                }
                if ("X-User-Role".equalsIgnoreCase(name)) {
                    return role;
                }
                return super.getHeader(name);
            }

            @Override
            public java.util.Enumeration<String> getHeaderNames() {
                java.util.List<String> names = java.util.Collections.list(super.getHeaderNames());
                names.add("X-User-Id");
                names.add("X-User-Role");
                return java.util.Collections.enumeration(names);
            }

            @Override
            public java.util.Enumeration<String> getHeaders(String name) {
                if ("X-User-Id".equalsIgnoreCase(name)) {
                    return java.util.Collections.enumeration(java.util.Collections.singletonList(username));
                }
                if ("X-User-Role".equalsIgnoreCase(name)) {
                    return java.util.Collections.enumeration(java.util.Collections.singletonList(role));
                }
                return super.getHeaders(name);
            }
        };

        filterChain.doFilter(requestWrapper, response);
    }
}
