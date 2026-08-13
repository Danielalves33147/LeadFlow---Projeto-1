package br.com.leadflow.dto;

import br.com.leadflow.model.enums.HistoryEventType;
import br.com.leadflow.model.enums.LeadOrigin;
import br.com.leadflow.model.enums.LeadStage;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class LeadDTOs {
    private LeadDTOs() {}

    public record CreateLeadRequest(
        @NotBlank @Size(min = 2, max = 160) String name,
        @Size(max = 20) String phone,
        @Email @Size(max = 180) String email,
        @NotNull LeadOrigin origin,
        @Size(max = 9) String cep,
        @NotNull Long branchId,
        Long responsibleUserId
    ) {}

    public record UpdateLeadRequest(
        @NotBlank @Size(min = 2, max = 160) String name,
        @Size(max = 20) String phone,
        @Email @Size(max = 180) String email,
        @NotNull LeadOrigin origin,
        @Size(max = 9) String cep
    ) {}

    public record ChangeStageRequest(@NotNull LeadStage stage, @Size(max = 500) String reason) {}
    public record ReassignLeadRequest(@NotNull Long responsibleUserId) {}

    public record LeadSummary(
        Long id, String name, String phone, String email, LeadOrigin origin, LeadStage stage, int score,
        Long branchId, String branchName, Long responsibleUserId, String responsibleUserName,
        Instant lastInteractionAt, Instant createdAt, long overdueTasks
    ) {}

    public record LeadResponse(
        Long id, String name, String phone, String email, LeadOrigin origin, String cep, LeadStage stage, int score,
        Long branchId, String branchName, Long responsibleUserId, String responsibleUserName,
        Instant lastInteractionAt, Instant createdAt, Instant updatedAt, long pendingTasks, long overdueTasks
    ) {}

    public record HistoryResponse(
        Long id, HistoryEventType eventType, String previousValue, String newValue,
        Long performedById, String performedByName, String description, Instant createdAt
    ) {}
}
