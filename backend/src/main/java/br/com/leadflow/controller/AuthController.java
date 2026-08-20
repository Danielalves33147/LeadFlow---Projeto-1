package br.com.leadflow.controller;

import br.com.leadflow.dto.AuthDTOs;
import br.com.leadflow.dto.AuthDTOs.LoginRequest;
import br.com.leadflow.dto.AuthDTOs.LogoutRequest;
import br.com.leadflow.dto.AuthDTOs.PasswordChangeConfirmRequest;
import br.com.leadflow.dto.AuthDTOs.PasswordResetConfirmRequest;
import br.com.leadflow.dto.AuthDTOs.PasswordResetRequest;
import br.com.leadflow.dto.AuthDTOs.PasswordResetVerifyRequest;
import br.com.leadflow.dto.AuthDTOs.RefreshRequest;
import br.com.leadflow.dto.AuthDTOs.RegisterRequest;
import br.com.leadflow.dto.AuthDTOs.UpdateProfileRequest;
import br.com.leadflow.dto.AuthDTOs.VerifyEmailRequest;
import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/verify-email")
    public ApiResponse<?> verifyEmail(
        @Valid @RequestBody VerifyEmailRequest request
    ) {
        authService.verifyEmail(request.token());

        return ApiResponse.of(
            new AuthDTOs.MessageResponse(
                "E-mail confirmado com sucesso. Sua conta está ativa."
            )
        );
    }

    @PostMapping("/login")
    public ApiResponse<?> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.of(authService.login(request));
    }

    @PostMapping("/register")
    public ApiResponse<?> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.of(authService.register(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<?> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.of(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ApiResponse<?> me() {
        return ApiResponse.of(authService.me());
    }

    @PutMapping("/profile")
    public ApiResponse<?> updateProfile(
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ApiResponse.of(authService.updateProfile(request));
    }

    @PostMapping("/password-change/request")
    public ApiResponse<?> requestPasswordChange() {
        return ApiResponse.of(authService.requestPasswordChange());
    }

    @PostMapping("/password-change/confirm")
    public ResponseEntity<Void> confirmPasswordChange(
        @Valid @RequestBody PasswordChangeConfirmRequest request
    ) {
        authService.confirmPasswordChange(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password-reset/request")
    public ApiResponse<?> requestPasswordReset(
        @Valid @RequestBody PasswordResetRequest request
    ) {
        return ApiResponse.of(authService.requestPasswordReset(request));
    }

    @PostMapping("/password-reset/verify")
    public ApiResponse<?> verifyPasswordReset(
        @Valid @RequestBody PasswordResetVerifyRequest request
    ) {
        authService.verifyPasswordReset(request);
        return ApiResponse.of(new AuthDTOs.MessageResponse("Código confirmado."));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Void> confirmPasswordReset(
        @Valid @RequestBody PasswordResetConfirmRequest request
    ) {
        authService.confirmPasswordReset(request);
        return ResponseEntity.noContent().build();
    }
}
