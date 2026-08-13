package br.com.leadflow.dto;

import br.com.leadflow.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class TaskDTOs {
    private TaskDTOs() {}

    public record CreateTaskRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 3000) String description,
        @NotNull Long leadId,
        Long responsibleUserId,
        @NotNull Instant dueAt
    ) {}

    public record UpdateTaskRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 3000) String description,
        Long responsibleUserId,
        @NotNull Instant dueAt
    ) {}

    public record CancelTaskRequest(@Size(max = 300) String reason) {}
    public record RescheduleTaskRequest(@NotNull Instant dueAt) {}

    public record TaskResponse(
        Long id, String title, String description, Long leadId, String leadName,
        Long responsibleUserId, String responsibleUserName, Long branchId, String branchName,
        Instant dueAt, TaskStatus status, Instant completedAt, Instant createdAt
    ) {}
}
