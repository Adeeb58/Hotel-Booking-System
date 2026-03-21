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
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Always allow preflight OPTIONS requests - CorsFilter handles the CORS headers
        if (method.equalsIgnoreCase("OPTIONS")) {
            filterChain.doFilter(request, response);
            return;
        }

        // ── PUBLIC ROUTES (no JWT required) ─────────────────────────────────────────
        // /auth/**  → login, register
        // GET /hotels/** and GET /rooms/** → public hotel browsing
        if (path.startsWith("/auth") ||
            (method.equalsIgnoreCase("GET") && (path.startsWith("/hotels") || path.startsWith("/rooms")))) {
            filterChain.doFilter(request, response);
            return;
        }

        // ── PROTECTED ROUTES (JWT required) ──────────────────────────────────────────
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendError(response, HttpStatus.UNAUTHORIZED.value(), "Missing or malformed Authorization header");
            return;
        }

        String token = authHeader.substring(7);

        try {
            jwtUtil.validateToken(token);
        } catch (Exception e) {
            sendError(response, HttpStatus.UNAUTHORIZED.value(), "Invalid or expired token");
            return;
        }

        // Extract claims and propagate them as downstream headers
        String role = jwtUtil.extractRole(token);
        String userId = jwtUtil.extractUserId(token);

        // Wrap request to inject X-User-Id and X-User-Role headers for downstream services
        HttpServletRequest wrappedRequest = new jakarta.servlet.http.HttpServletRequestWrapper(request) {

            @Override
            public String getHeader(String name) {
                if ("X-User-Id".equalsIgnoreCase(name)) return userId;
                if ("X-User-Role".equalsIgnoreCase(name)) return role;
                return super.getHeader(name);
            }

            @Override
            public Enumeration<String> getHeaderNames() {
                List<String> names = Collections.list(super.getHeaderNames());
                names.add("X-User-Id");
                names.add("X-User-Role");
                return Collections.enumeration(names);
            }

            @Override
            public Enumeration<String> getHeaders(String name) {
                if ("X-User-Id".equalsIgnoreCase(name))
                    return Collections.enumeration(Collections.singletonList(userId));
                if ("X-User-Role".equalsIgnoreCase(name))
                    return Collections.enumeration(Collections.singletonList(role));
                return super.getHeaders(name);
            }
        };

        filterChain.doFilter(wrappedRequest, response);
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}
