package org.hotelbooking.apigateway.security;

import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String SECRET;

    public void validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(SECRET)
                    .parseClaimsJws(token);
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired token");
        }
    }

    public String extractUsername(String token) {
        return Jwts.parser().setSigningKey(SECRET)
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractRole(String token) {
        return Jwts.parser().setSigningKey(SECRET)
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    public String extractUserId(String token) {
        return Jwts.parser().setSigningKey(SECRET)
                .parseClaimsJws(token)
                .getBody()
                .get("userId", String.class);
    }
}
