package br.com.leadflow.dto;

import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class AuthDTOs {

    private AuthDTOs() {
    }

    public record LoginRequest(
        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(min = 8, max = 72)
        String password
    ) {
    }

    public record RegisterRequest(
        @NotBlank
        @Size(min = 2, max = 120)
        String name,

        @NotBlank
        @Email
        @Size(max = 180)
        String email,

        @NotBlank
        @Size(min = 2, max = 160)
        String companyName,

        @NotBlank
        @Size(min = 14, max = 18)
        String cnpj,

        @NotBlank
        @Size(min = 8, max = 72)
        String password,

        @AssertTrue
        boolean acceptedTerms,

        @AssertTrue
        boolean acceptedPrivacy
    ) {
    }

    public record RefreshRequest(
        @NotBlank
        String refreshToken
    ) {
    }

    public record LogoutRequest(
        @NotBlank
        String refreshToken
    ) {
    }

    public record VerifyEmailRequest(
        @NotBlank
        String token
    ) {
    }

    public record UpdateProfileRequest(
        @NotBlank
        @Size(min = 2, max = 120)
        String name,

        @NotBlank
        @Email
        @Size(max = 180)
        String email
    ) {
    }

    public record PasswordChangeConfirmRequest(
        @NotBlank
        @Pattern(regexp = "\\d{6}")
        String token,

        @NotBlank
        @Size(min = 8, max = 72)
        String newPassword
    ) {
    }

    public record PasswordChangeRequestResponse(
        String maskedEmail,
        long expiresInSeconds
    ) {
    }

    public record PasswordResetRequest(
        @NotBlank
        @Email
        @Size(max = 180)
        String email
    ) {
    }

    public record PasswordResetVerifyRequest(
        @NotBlank
        @Email
        @Size(max = 180)
        String email,

        @NotBlank
        @Pattern(regexp = "\\d{6}")
        String token
    ) {
    }

    public record PasswordResetConfirmRequest(
        @NotBlank
        @Email
        @Size(max = 180)
        String email,

        @NotBlank
        @Pattern(regexp = "\\d{6}")
        String token,

        @NotBlank
        @Size(min = 8, max = 72)
        String newPassword
    ) {
    }

    public record PasswordResetRequestResponse(
        String message,
        long expiresInSeconds
    ) {
    }

    public record RegisterResponse(
        String message,
        String email
    ) {
    }

    public record MessageResponse(
        String message
    ) {
    }

    public record AuthUser(
        Long id,
        String name,
        String email,
        UserRole role,
        UserStatus status,
        Long companyId,
        String companyName,
        Long primaryBranchId,
        String primaryBranchName,
        List<Long> authorizedBranchIds
    ) {
    }

    public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        AuthUser user
    ) {
    }
}
