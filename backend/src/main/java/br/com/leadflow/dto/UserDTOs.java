package br.com.leadflow.dto;

import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class UserDTOs {

    private UserDTOs() {}public record CreateUserRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @NotBlank @Email @Size(max = 180) String email,
        @NotNull UserRole role,
        Long primaryBranchId,
        Long managerId,
        List<Long> authorizedBranchIds,
        @NotBlank @Size(min = 8, max = 72) String temporaryPassword
    ) {}public record UpdateUserRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @NotNull UserRole role,
        Long primaryBranchId,
        Long managerId,
        List<Long> authorizedBranchIds
    ) {}public record UserStatusRequest(@NotNull UserStatus status) {}public record UserResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        UserStatus status,
        Long primaryBranchId,
        String primaryBranchName,
        Long managerId,
        String managerName,
        List<Long> authorizedBranchIds,
        long activeLeads,
        Instant lastLoginAt,
        Instant createdAt
    ) {}public record DeactivationImpact(long activeLeads, long pendingTasks, boolean canDeactivate) {}
}
