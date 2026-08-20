package br.com.leadflow.service;

import br.com.leadflow.dao.BranchDAO;
import br.com.leadflow.dao.InteractionDAO;
import br.com.leadflow.dao.LeadDAO;
import br.com.leadflow.dto.DashboardDTOs.BranchRankingResponse;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.model.enums.UserRole;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RankingService {

    private final BranchDAO branchDAO;
    private final LeadDAO leadDAO;
    private final InteractionDAO interactionDAO;
    private final AccessService accessService;

    public RankingService(
        BranchDAO branchDAO,
        LeadDAO leadDAO,
        InteractionDAO interactionDAO,
        AccessService accessService
    ) {
        this.branchDAO = branchDAO;
        this.leadDAO = leadDAO;
        this.interactionDAO = interactionDAO;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public List<BranchRankingResponse> ranking(Instant from, Instant to) {
        User actor = accessService.currentUser();

        if (actor.getRole() == UserRole.SELLER) {
            throw new AccessDeniedBusinessException("Ranking de filiais não disponível para Vendedores.");
        }

        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minusSeconds(30L * 86400) : from;
        long duration = Math.max(1, end.getEpochSecond() - start.getEpochSecond());
        Instant previousStart = start.minusSeconds(duration);

        List<Branch> branches = actor.getRole() == UserRole.ADMIN
            ? branchDAO.findByCompanyIdOrderByNameAsc(actor.getCompany().getId())
            : branchDAO.findAllById(accessService.authorizedBranchIds(actor));

        if (branches.isEmpty()) {
            return List.of();
        }

        List<Long> branchIds = branches.stream().map(Branch::getId).toList();

        /*
         * Antes, cada filial executava várias consultas separadas.
         * Agora os dados de todas as filiais são agregados em duas queries.
         */
        Map<Long, LeadDAO.BranchLeadMetrics> leadMetrics = new HashMap<>();
        for (LeadDAO.BranchLeadMetrics metric : leadDAO.aggregateBranchLeadMetrics(
            branchIds,
            start,
            end,
            LeadStage.LOST,
            LeadStage.CUSTOMER
        )) {
            leadMetrics.put(metric.getBranchId(), metric);
        }

        Map<Long, InteractionDAO.BranchInteractionMetrics> interactionMetrics = new HashMap<>();
        for (InteractionDAO.BranchInteractionMetrics metric : interactionDAO.aggregateBranchInteractionMetrics(
            branchIds,
            previousStart,
            start,
            end
        )) {
            interactionMetrics.put(metric.getBranchId(), metric);
        }

        List<Metric> metrics = new ArrayList<>();

        for (Branch branch : branches) {
            LeadDAO.BranchLeadMetrics leads = leadMetrics.get(branch.getId());
            InteractionDAO.BranchInteractionMetrics interactions = interactionMetrics.get(branch.getId());

            long news = leads == null ? 0 : safeLong(leads.getNewLeads());
            long active = leads == null ? 0 : safeLong(leads.getActiveLeads());
            long conversions = leads == null ? 0 : safeLong(leads.getConversions());
            long interactionCount = interactions == null ? 0 : safeLong(interactions.getInteractions());
            long points = interactions == null ? 0 : safeLong(interactions.getPoints());
            long previousPoints = interactions == null ? 0 : safeLong(interactions.getPreviousPoints());

            double rate = news == 0 ? 0 : conversions * 100.0 / news;
            double trend = previousPoints == 0
                ? (points > 0 ? 100 : 0)
                : (points - previousPoints) * 100.0 / Math.abs(previousPoints);

            metrics.add(new Metric(
                branch,
                points,
                interactionCount,
                active,
                news,
                conversions,
                round(rate),
                round(trend)
            ));
        }

        metrics.sort(
            Comparator.comparingLong(Metric::points)
                .reversed()
                .thenComparing(metric -> metric.branch().getName())
        );

        List<BranchRankingResponse> output = new ArrayList<>();
        for (int i = 0; i < metrics.size(); i++) {
            Metric metric = metrics.get(i);
            output.add(new BranchRankingResponse(
                i + 1,
                metric.branch().getId(),
                metric.branch().getName(),
                metric.points(),
                metric.interactions(),
                metric.active(),
                metric.news(),
                metric.conversions(),
                metric.rate(),
                metric.trend()
            ));
        }

        return output;
    }

    private long safeLong(Long value) {
        return value == null ? 0 : value;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record Metric(
        Branch branch,
        long points,
        long interactions,
        long active,
        long news,
        long conversions,
        double rate,
        double trend
    ) {}
}
