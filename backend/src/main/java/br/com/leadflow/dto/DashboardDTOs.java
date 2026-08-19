package br.com.leadflow.dto;

import br.com.leadflow.model.enums.LeadStage;

import java.util.List;

public final class DashboardDTOs {

    private DashboardDTOs() {}public record Kpi(long value, double variation) {}public record EvolutionPoint(
        String label,
        long leads,
        long interactions,
        long points
    ) {}public record StageDistribution(LeadStage stage, long value) {}public record RankingItem(
        Long branchId,
        String branchName,
        long points,
        long conversions,
        double conversionRate,
        double trend
    ) {}public record DashboardResponse(
        Kpi activeLeads,
        Kpi newLeads,
        Kpi interactions,
        Kpi generatedPoints,
        List<EvolutionPoint> commercialEvolution,
        List<StageDistribution> stageDistribution,
        List<RankingItem> branchRanking,
        List<LeadDTOs.LeadSummary> recentLeads
    ) {}public record BranchRankingResponse(
        int position,
        Long branchId,
        String branchName,
        long points,
        long interactions,
        long activeLeads,
        long newLeads,
        long conversions,
        double conversionRate,
        double trend
    ) {}
}
