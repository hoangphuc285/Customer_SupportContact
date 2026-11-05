package com.example.cd2.config;

import com.example.cd2.security.ApiKeyAuthFilter;
import com.example.cd2.security.JwtAuthFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    private static final String DEFAULT_N8N_KEY = "change-this-n8n-api-key";

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** JwtAuthFilter chi chay trong chuoi bao mat, khong dang ky them o tang servlet. */
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> reg = new FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOriginPatterns(java.util.List.of("*"));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        configuration.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter,
                                           @Value("${app.n8n.api-key}") String n8nApiKey) throws Exception {
        if (DEFAULT_N8N_KEY.equals(n8nApiKey)) {
            log.warn("N8N_API_KEY dang la gia tri mac dinh - hay doi truoc khi trien khai that.");
        }
        ApiKeyAuthFilter apiKeyFilter = new ApiKeyAuthFilter(n8nApiKey);

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST,
                        "/api/auth/register", "/api/auth/login", "/api/auth/refresh").permitAll()
                .requestMatchers("/actuator/health", "/error").permitAll()
                .requestMatchers("/api/chat/**", "/api/escalation/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/portal/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/portal/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/staff/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/staff/**").permitAll()
                .requestMatchers(HttpMethod.PATCH, "/api/staff/**").permitAll()
                .requestMatchers("/api/n8n/**").hasRole("N8N")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/portal/**").hasAnyRole("CUSTOMER", "ADMIN", "AGENT")
                .requestMatchers("/api/staff/**").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
