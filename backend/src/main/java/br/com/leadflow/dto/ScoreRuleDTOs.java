package br.com.leadflow.dto;

import br.com.leadflow.model.enums.InteractionType;
import br.com.leadflow.model.enums.ScoreOperation;
import br.com.leadflow.model.enums.ScoreRuleStatus;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class ScoreRuleDTOs {

    private ScoreRuleDTOs() {}public record ScoreRuleRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull InteractionType interactionType,
        @NotNull ScoreOperation operation,
        @Min(0) int value,
        @NotNull ScoreRuleStatus status
    ) {}public record ScoreRuleStatusRequest(@NotNull ScoreRuleStatus status) {}public record ScoreRuleResponse(
        Long id,
        String name,
        InteractionType interactionType,
        ScoreOperation operation,
        int value,
        ScoreRuleStatus status,
        Instant updatedAt
    ) {}
}
