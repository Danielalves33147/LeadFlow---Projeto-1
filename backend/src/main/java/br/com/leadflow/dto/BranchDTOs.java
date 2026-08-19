package br.com.leadflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class BranchDTOs {

    private BranchDTOs() {}public record BranchRequest(@NotBlank @Size(min = 2, max = 120) String name, boolean active) {}public record BranchSummary(Long id,
        String name, boolean active, long activeLeads, long newLeads, long interactions, long points, long conversions,
        double conversionRate, long members) {}public record ChartPoint(String label, long value) {}public record StagePoint(String stage,
        long value) {}public record OriginPoint(String origin, long value) {}public record SellerRanking(
        Long userId,
        String name,
        long leads,
        long interactions,
        long conversions,
        long points
    ) {}public record BranchDetails(
        Long id,
        String name,
        boolean active,
        long activeLeads,
        long newLeads,
        long interactions,
        long points,
        long conversions,
        double conversionRate,
        long members,
        List<ChartPoint> pointsEvolution,
        List<ChartPoint> conversionsEvolution,
        List<StagePoint> stageDistribution,
        List<OriginPoint> originDistribution,
        List<SellerRanking> teamRanking
    ) {}
}
