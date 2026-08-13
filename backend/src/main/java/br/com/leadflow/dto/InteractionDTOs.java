package br.com.leadflow.dto;

import br.com.leadflow.model.enums.InteractionChannel;
import br.com.leadflow.model.enums.InteractionType;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.model.enums.ScoreOperation;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class InteractionDTOs {
    private InteractionDTOs() {}

    public record CreateInteractionRequest(
        @NotNull Long leadId,
        @NotNull InteractionChannel channel,
        @NotNull InteractionType type,
        @Size(max = 3000) String notes
    ) {}

    public record InteractionResponse(
        Long id, Long leadId, String leadName, Long branchId, String branchName,
        Long responsibleUserId, String responsibleUserName, InteractionChannel channel,
        InteractionType type, String notes, int scoreApplied, String scoreRuleName,
        LeadStage stage, Instant createdAt
    ) {}

    public record ScorePreviewResponse(
        Long leadId, int currentScore, InteractionType interactionType, ScoreOperation operation,
        Integer ruleValue, String ruleName, int projectedScore, int scoreDelta
    ) {}
}
