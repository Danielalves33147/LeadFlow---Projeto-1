package br.com.leadflow.controller;

import br.com.leadflow.dto.AuthDTOs.LoginRequest;
import br.com.leadflow.dto.AuthDTOs.LogoutRequest;
import br.com.leadflow.dto.AuthDTOs.RefreshRequest;
import br.com.leadflow.dto.AuthDTOs.RegisterRequest;
import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService){this.authService=authService;}

    @PostMapping("/login") public ApiResponse<?> login(@Valid @RequestBody LoginRequest request){return ApiResponse.of(authService.login(request));}
    @PostMapping("/register") public ApiResponse<?> register(@Valid @RequestBody RegisterRequest request){return ApiResponse.of(authService.register(request));}
    @PostMapping("/refresh") public ApiResponse<?> refresh(@Valid @RequestBody RefreshRequest request){return ApiResponse.of(authService.refresh(request.refreshToken()));}
    @PostMapping("/logout") public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request){authService.logout(request.refreshToken());return ResponseEntity.noContent().build();}
    @GetMapping("/me") public ApiResponse<?> me(){return ApiResponse.of(authService.me());}
}
