package br.com.leadflow.dto;

import br.com.leadflow.model.enums.InvitationStatus;
import br.com.leadflow.model.enums.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class InvitationDTOs {

    private InvitationDTOs() {
    }

    public record CreateInvitationRequest(
        @NotBlank
        @Size(min = 2, max = 120)
        String name,

        @NotBlank
        @Email
        @Size(max = 180)
        String email,

        @NotNull
        UserRole role,

        Long primaryBranchId,

        Long managerId,

        List<Long> authorizedBranchIds
    ) {
    }

    public record InvitationResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        InvitationStatus status,
        Long companyId,
        String companyName,
        Long primaryBranchId,
        String primaryBranchName,
        Long managerId,
        String managerName,
        List<Long> authorizedBranchIds,
        Instant expiresAt,
        Instant createdAt
    ) {
    }

    public record ValidateInvitationResponse(
        boolean valid,
        String name,
        String email,
        String companyName,
        UserRole role,
        String primaryBranchName,
        Instant expiresAt
    ) {
    }

    public record AcceptInvitationRequest(
        @NotBlank
        String token,

        @NotBlank
        @Size(min = 8, max = 72)
        String password,

        @NotBlank
        @Size(min = 8, max = 72)
        String confirmPassword
    ) {
    }

    public record AcceptInvitationResponse(
        String message,
        String email
    ) {
    }
}