package br.com.leadflow.service;

import br.com.leadflow.dao.BranchDAO;
import br.com.leadflow.dao.InteractionDAO;
import br.com.leadflow.dao.LeadDAO;
import br.com.leadflow.dto.DashboardDTOs.BranchRankingResponse;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.model.enums.UserRole;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

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
        if (actor.getRole() == UserRole.SELLER)
            throw new AccessDeniedBusinessException("Ranking de filiais não disponível para Vendedores.");
        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minusSeconds(30L * 86400) : from;
        long duration = Math.max(1, end.getEpochSecond() - start.getEpochSecond());
        Instant previousStart = start.minusSeconds(duration);
        List<Branch> branches = actor
            .getRole() == UserRole
            .ADMIN ? branchDAO
            .findByCompanyIdOrderByNameAsc(actor.getCompany()
            .getId()) : branchDAO
            .findAllById(accessService.authorizedBranchIds(actor));
        List<Metric> metrics = new ArrayList<>();
        for (Branch b : branches) {
            List<Lead> all = leadDAO.findByBranchIdOrderByCreatedAtDesc(b.getId());
            long active = all.stream()
                .filter(l -> l.getStage() != LeadStage.LOST)
                .count();
            long news = all.stream()
                .filter(l -> within(l.getCreatedAt(), start, end))
                .count();
            long conversions = all
                .stream()
                .filter(l -> l.getStage() == LeadStage.CUSTOMER && within(l.getCreatedAt(), start, end))
                .count();
            long interactions = interactionDAO.countByLeadBranchIdAndCreatedAtBetween(b.getId(), start, end);
            long points = value(interactionDAO.sumScoreAppliedByBranchBetween(b.getId(), start, end));
            long previous = value(interactionDAO.sumScoreAppliedByBranchBetween(b.getId(), previousStart, start));
            double rate = news == 0 ? 0 : conversions * 100.0 / news;
            double trend = previous == 0 ? (points > 0 ? 100 : 0) : (points - previous) * 100.0 / Math.abs(previous);
            metrics
                .add(new Metric(b, points, interactions, active, news, conversions, round(rate), round(trend)));
        }
        metrics.sort(Comparator.comparingLong(Metric::points)
            .reversed()
            .thenComparing(m -> m.branch().getName()));
        List<BranchRankingResponse> out = new ArrayList<>();
        for (int i = 0;
            i < metrics.size();
            i++) {
            Metric m = metrics.get(i);
            out.add(new BranchRankingResponse(i + 1, m.branch()
                .getId(), m
                .branch()
                .getName(), m
                .points(), m
                .interactions(), m
                .active(), m
                .news(), m
                .conversions(), m
                .rate(), m
                .trend()));
        }
        return out;
    }

    private boolean within(Instant v, Instant a, Instant b) {
        return !v.isBefore(a) && !v.isAfter(b);
    }

    private long value(Long v) {
        return v == null ? 0 : v;
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
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
