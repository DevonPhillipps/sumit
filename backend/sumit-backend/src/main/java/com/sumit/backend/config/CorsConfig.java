package com.sumit.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        //todo in production replace localhost here with the website domain
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:5173",
                        "http://192.168.3.243:5173",
                        "http://172.18.192.1:5173",
                        "http://localhost:4173",      // Vite preview port
                        "http://192.168.3.243:4173"   // Vite preview on networ
                )
                // your Vite frontend
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
