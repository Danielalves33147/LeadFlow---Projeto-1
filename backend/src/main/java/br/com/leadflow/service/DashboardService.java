package br.com.leadflow.service;

import br.com.leadflow.dao.InteractionDAO;
import br.com.leadflow.dao.LeadDAO;
import br.com.leadflow.dto.DashboardDTOs.DashboardResponse;
import br.com.leadflow.dto.DashboardDTOs.EvolutionPoint;
import br.com.leadflow.dto.DashboardDTOs.Kpi;
import br.com.leadflow.dto.DashboardDTOs.RankingItem;
import br.com.leadflow.dto.DashboardDTOs.StageDistribution;
import br.com.leadflow.dto.LeadDTOs.LeadSummary;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.model.enums.UserRole;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final LeadDAO leadDAO;
    private final InteractionDAO interactionDAO;
    private final RankingService rankingService;
    private final AccessService accessService;

    public DashboardService(
        LeadDAO leadDAO,
        InteractionDAO interactionDAO,
        RankingService rankingService,
        AccessService accessService
    ) {
        this.leadDAO = leadDAO;
        this.interactionDAO = interactionDAO;
        this.rankingService = rankingService;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse get(Long branchId, Instant from, Instant to) {
        User actor = accessService.currentUser();

        if (actor.getRole() == UserRole.SELLER) {
            throw new AccessDeniedBusinessException("Vendedores não possuem acesso ao Dashboard.");
        }

        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minusSeconds(30L * 86400) : from;
        long duration = Math.max(1, end.getEpochSecond() - start.getEpochSecond());
        Instant previousStart = start.minusSeconds(duration);

        List<Long> authorizedBranchIds = accessService.authorizedBranchIds(actor);
        List<Long> dashboardBranchIds = resolveDashboardBranchIds(branchId, authorizedBranchIds);

        if (dashboardBranchIds.isEmpty()) {
            return emptyDashboard(start, end);
        }

        /*
         * O Dashboard usa projeções leves em vez de LeadService.list/InteractionService.list.
         * Isso evita mapear entidades completas e, principalmente, evita a consulta de tarefas
         * por Lead feita em LeadService.toSummary().
         */
        List<LeadDAO.DashboardLeadPoint> currentLeads = leadDAO.findDashboardLeadPoints(
            dashboardBranchIds,
            start,
            end
        );

        List<LeadDAO.DashboardLeadPoint> previousLeads = leadDAO.findDashboardLeadPoints(
            dashboardBranchIds,
            previousStart,
            start
        );

        List<InteractionDAO.DashboardInteractionPoint> currentInteractions = interactionDAO
            .findDashboardInteractionPoints(dashboardBranchIds, start, end);

        List<InteractionDAO.DashboardInteractionPoint> previousInteractions = interactionDAO
            .findDashboardInteractionPoints(dashboardBranchIds, previousStart, start);

        long active = currentLeads.stream()
            .filter(lead -> lead.getStage() != LeadStage.LOST)
            .count();

        long previousActive = previousLeads.stream()
            .filter(lead -> lead.getStage() != LeadStage.LOST)
            .count();

        long generated = currentInteractions.stream()
            .mapToLong(interaction -> safeInt(interaction.getScoreApplied()))
            .sum();

        long previousGenerated = previousInteractions.stream()
            .mapToLong(interaction -> safeInt(interaction.getScoreApplied()))
            .sum();

        Map<LeadStage, Long> stages = new EnumMap<>(LeadStage.class);
        for (LeadStage stage : LeadStage.values()) {
            stages.put(stage, 0L);
        }

        for (LeadDAO.DashboardLeadPoint lead : currentLeads) {
            stages.merge(lead.getStage(), 1L, Long::sum);
        }

        List<StageDistribution> distribution = stages.entrySet()
            .stream()
            .map(entry -> new StageDistribution(entry.getKey(), entry.getValue()))
            .toList();

        List<RankingItem> ranking = rankingService
            .ranking(start, end)
            .stream()
            .limit(5)
            .map(item -> new RankingItem(
                item.branchId(),
                item.branchName(),
                item.points(),
                item.conversions(),
                item.conversionRate(),
                item.trend()
            ))
            .toList();

        List<LeadSummary> recent = leadDAO
            .findDashboardRecentLeads(
                dashboardBranchIds,
                start,
                end,
                PageRequest.of(0, 8)
            )
            .stream()
            .map(this::toRecentLeadSummary)
            .toList();

        return new DashboardResponse(
            new Kpi(active, variation(active, previousActive)),
            new Kpi(currentLeads.size(), variation(currentLeads.size(), previousLeads.size())),
            new Kpi(
                currentInteractions.size(),
                variation(currentInteractions.size(), previousInteractions.size())
            ),
            new Kpi(generated, variation(generated, previousGenerated)),
            evolution(start, end, currentLeads, currentInteractions),
            distribution,
            ranking,
            recent
        );
    }

    private List<Long> resolveDashboardBranchIds(Long branchId, List<Long> authorizedBranchIds) {
        if (branchId == null) {
            return authorizedBranchIds;
        }

        if (!authorizedBranchIds.contains(branchId)) {
            throw new AccessDeniedBusinessException("Você não possui acesso a esta filial.");
        }

        return List.of(branchId);
    }

    private DashboardResponse emptyDashboard(Instant start, Instant end) {
        List<StageDistribution> distribution = new ArrayList<>();
        for (LeadStage stage : LeadStage.values()) {
            distribution.add(new StageDistribution(stage, 0));
        }

        return new DashboardResponse(
            new Kpi(0, 0),
            new Kpi(0, 0),
            new Kpi(0, 0),
            new Kpi(0, 0),
            evolution(start, end, List.of(), List.of()),
            distribution,
            List.of(),
            List.of()
        );
    }

    private LeadSummary toRecentLeadSummary(LeadDAO.DashboardRecentLead lead) {
        return new LeadSummary(
            lead.getId(),
            lead.getName(),
            lead.getPhone(),
            lead.getEmail(),
            lead.getOrigin(),
            lead.getStage(),
            safeInt(lead.getScore()),
            lead.getBranchId(),
            lead.getBranchName(),
            lead.getResponsibleUserId(),
            lead.getResponsibleUserName(),
            lead.getLastInteractionAt(),
            lead.getCreatedAt(),
            0
        );
    }

    private List<EvolutionPoint> evolution(
        Instant start,
        Instant end,
        List<LeadDAO.DashboardLeadPoint> leads,
        List<InteractionDAO.DashboardInteractionPoint> interactions
    ) {
        LocalDate startDate = start.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate endDate = end.atZone(ZoneOffset.UTC).toLocalDate();
        int bucketDays = bucketDays(startDate, endDate);
        List<EvolutionBucket> buckets = new ArrayList<>();

        LocalDate cursor = startDate;
        while (!cursor.isAfter(endDate)) {
            LocalDate bucketEnd = cursor.plusDays(bucketDays - 1L);
            if (bucketEnd.isAfter(endDate)) {
                bucketEnd = endDate;
            }
            buckets.add(new EvolutionBucket(cursor, bucketEnd, new long[3]));
            cursor = bucketEnd.plusDays(1);
        }

        for (LeadDAO.DashboardLeadPoint lead : leads) {
            addToBucket(
                buckets,
                lead.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate(),
                0,
                1
            );
        }

        for (InteractionDAO.DashboardInteractionPoint interaction : interactions) {
            LocalDate date = interaction.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
            addToBucket(buckets, date, 1, 1);
            addToBucket(buckets, date, 2, safeInt(interaction.getScoreApplied()));
        }

        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd/MM");
        List<EvolutionPoint> result = new ArrayList<>();
        for (EvolutionBucket bucket : buckets) {
            String label = bucketDays == 1
                ? bucket.start().format(dayFormatter)
                : bucket.start().format(dayFormatter) + "–" + bucket.end().format(dayFormatter);
            result.add(new EvolutionPoint(
                label,
                bucket.values()[0],
                bucket.values()[1],
                bucket.values()[2]
            ));
        }
        return result;
    }

    private int bucketDays(LocalDate start, LocalDate end) {
        long days = Math.max(1, ChronoUnit.DAYS.between(start, end) + 1);

        if (days <= 7) {
            return 1;
        }
        if (days <= 30) {
            return 7;
        }
        if (days <= 90) {
            return 15;
        }
        if (days <= 180) {
            return 30;
        }
        return 60;
    }

    private void addToBucket(
        List<EvolutionBucket> buckets,
        LocalDate date,
        int metricIndex,
        long value
    ) {
        for (EvolutionBucket bucket : buckets) {
            if (!date.isBefore(bucket.start()) && !date.isAfter(bucket.end())) {
                bucket.values()[metricIndex] += value;
                return;
            }
        }
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private double variation(long current, long previous) {
        if (previous == 0) {
            return current == 0 ? 0 : 100;
        }
        return Math.round(((current - previous) * 1000.0 / Math.abs(previous))) / 10.0;
    }

    private record EvolutionBucket(LocalDate start, LocalDate end, long[] values) {}
}
