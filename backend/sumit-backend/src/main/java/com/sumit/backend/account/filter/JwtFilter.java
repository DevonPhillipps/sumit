package com.sumit.backend.account.filter;

import com.sumit.backend.account.service.JwtService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class JwtFilter implements Filter {

    @Autowired
    private JwtService jwtService;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();

        if (path.startsWith("/api/auth/")) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = req.getHeader("Authorization");

        // Check if its a bearer token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Remove "Bearer "

            // Validate token
            if (jwtService.isValidToken(token)) {
                // Extract user info
                Integer userId = jwtService.extractUserId(token);
                String role = jwtService.extractRole(token);

                // Attach to request
                req.setAttribute("userId", userId);
                req.setAttribute("userRole", role);

                // Allow request to continue
                chain.doFilter(request, response);
                return;
            }
        }

        // If no valid token, return 401
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType("application/json");
        res.getWriter().write("{\"error\": \"Missing or invalid token\"}");
    }
}