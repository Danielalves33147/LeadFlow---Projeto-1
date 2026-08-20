package br.com.leadflow.service;

import br.com.leadflow.dto.DashboardDTOs.DashboardResponse;
import br.com.leadflow.dto.DashboardDTOs.EvolutionPoint;
import br.com.leadflow.dto.DashboardDTOs.Kpi;
import br.com.leadflow.dto.DashboardDTOs.RankingItem;
import br.com.leadflow.dto.DashboardDTOs.StageDistribution;
import br.com.leadflow.dto.InteractionDTOs.InteractionResponse;
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
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final LeadService leadService;
    private final InteractionService interactionService;
    private final RankingService rankingService;
    private final AccessService accessService;

    public DashboardService(
        LeadService leadService,
        InteractionService interactionService,
        RankingService rankingService,
        AccessService accessService
    ) {
        this.leadService = leadService;
        this.interactionService = interactionService;
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
        Instant prevStart = start.minusSeconds(duration);

        var currentLeads = leadService
            .list(
                null,
                branchId,
                null,
                null,
                null,
                null,
                null,
                start,
                end,
                PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt"))
            )
            .content();

        var previousLeads = leadService
            .list(
                null,
                branchId,
                null,
                null,
                null,
                null,
                null,
                prevStart,
                start,
                PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt"))
            )
            .content();

        var currentInteractions = interactionService
            .list(
                branchId,
                null,
                null,
                null,
                null,
                start,
                end,
                PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt"))
            )
            .content();

        var previousInteractions = interactionService
            .list(
                branchId,
                null,
                null,
                null,
                null,
                prevStart,
                start,
                PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt"))
            )
            .content();

        long active = currentLeads.stream()
            .filter(l -> l.stage() != LeadStage.LOST)
            .count();
        long previousActive = previousLeads.stream()
            .filter(l -> l.stage() != LeadStage.LOST)
            .count();

        long generated = currentInteractions.stream()
            .mapToLong(InteractionResponse::scoreApplied)
            .sum();
        long prevGenerated = previousInteractions.stream()
            .mapToLong(InteractionResponse::scoreApplied)
            .sum();

        Map<LeadStage, Long> stages = new EnumMap<>(LeadStage.class);
        for (LeadStage stage : LeadStage.values()) {
            stages.put(stage, 0L);
        }
        for (LeadSummary lead : currentLeads) {
            stages.merge(lead.stage(), 1L, Long::sum);
        }

        List<StageDistribution> distribution = stages
            .entrySet()
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

        List<LeadSummary> recent = currentLeads.stream().limit(8).toList();

        return new DashboardResponse(
            new Kpi(active, variation(active, previousActive)),
            new Kpi(currentLeads.size(), variation(currentLeads.size(), previousLeads.size())),
            new Kpi(
                currentInteractions.size(),
                variation(currentInteractions.size(), previousInteractions.size())
            ),
            new Kpi(generated, variation(generated, prevGenerated)),
            evolution(start, end, currentLeads, currentInteractions),
            distribution,
            ranking,
            recent
        );
    }

    private List<EvolutionPoint> evolution(
        Instant start,
        Instant end,
        List<LeadSummary> leads,
        List<InteractionResponse> interactions
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

        for (LeadSummary lead : leads) {
            addToBucket(
                buckets,
                lead.createdAt().atZone(ZoneOffset.UTC).toLocalDate(),
                0,
                1
            );
        }

        for (InteractionResponse interaction : interactions) {
            LocalDate date = interaction.createdAt().atZone(ZoneOffset.UTC).toLocalDate();
            addToBucket(buckets, date, 1, 1);
            addToBucket(buckets, date, 2, interaction.scoreApplied());
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
            return 1;   // diário
        }
        if (days <= 30) {
            return 7;   // semanal
        }
        if (days <= 90) {
            return 15;  // quinzenal
        }
        if (days <= 180) {
            return 30;  // mensal
        }
        return 60;      // bimestral
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

    private double variation(long current, long previous) {
        if (previous == 0) {
            return current == 0 ? 0 : 100;
        }
        return Math.round(((current - previous) * 1000.0 / Math.abs(previous))) / 10.0;
    }

    private record EvolutionBucket(LocalDate start, LocalDate end, long[] values) {}
}
