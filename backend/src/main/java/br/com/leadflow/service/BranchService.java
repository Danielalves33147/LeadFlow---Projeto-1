package br.com.leadflow.service;

import br.com.leadflow.dao.BranchDAO;
import br.com.leadflow.dao.InteractionDAO;
import br.com.leadflow.dao.LeadDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.dto.BranchDTOs.BranchDetails;
import br.com.leadflow.dto.BranchDTOs.BranchRequest;
import br.com.leadflow.dto.BranchDTOs.BranchSummary;
import br.com.leadflow.dto.BranchDTOs.ChartPoint;
import br.com.leadflow.dto.BranchDTOs.OriginPoint;
import br.com.leadflow.dto.BranchDTOs.SellerRanking;
import br.com.leadflow.dto.BranchDTOs.StagePoint;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.exception.ResourceNotFoundException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.Interaction;
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.LeadOrigin;
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

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BranchService {

    private final BranchDAO branchDAO;
    private final LeadDAO leadDAO;
    private final InteractionDAO interactionDAO;
    private final UserDAO userDAO;
    private final AccessService accessService;

    public BranchService(
        BranchDAO branchDAO,
        LeadDAO leadDAO,
        InteractionDAO interactionDAO,
        UserDAO userDAO,
        AccessService accessService
    ) {
        this.branchDAO = branchDAO;
        this.leadDAO = leadDAO;
        this.interactionDAO = interactionDAO;
        this.userDAO = userDAO;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public List<BranchSummary> list(Instant from, Instant to) {
        User actor = accessService.currentUser();
        if (actor.getRole() == UserRole.SELLER) {
            throw new AccessDeniedBusinessException("Vendedores não acessam Filiais.");
        }
        return branches(actor)
            .stream()
            .map(branch -> summary(branch, from, to))
            .toList();
    }

    @Transactional(readOnly = true)
    public BranchDetails get(Long id, Instant from, Instant to) {
        User actor = accessService.currentUser();
        if (actor.getRole() == UserRole.SELLER) {
            throw new AccessDeniedBusinessException("Vendedores não acessam Filiais.");
        }

        Branch branch = accessService.requireBranch(id, actor);
        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minusSeconds(30L * 86400) : from;
        BranchSummary summary = summary(branch, start, end);

        List<Lead> allLeads = leadDAO.findByBranchIdOrderByCreatedAtDesc(id);
        List<Lead> periodLeads = allLeads
            .stream()
            .filter(lead -> within(lead.getCreatedAt(), start, end))
            .toList();

        Map<LeadStage, Long> stages = new EnumMap<>(LeadStage.class);
        Map<LeadOrigin, Long> origins = new EnumMap<>(LeadOrigin.class);
        for (LeadStage stage : LeadStage.values()) {
            stages.put(stage, 0L);
        }
        for (LeadOrigin origin : LeadOrigin.values()) {
            origins.put(origin, 0L);
        }
        for (Lead lead : periodLeads) {
            stages.merge(lead.getStage(), 1L, Long::sum);
            origins.merge(lead.getOrigin(), 1L, Long::sum);
        }

        List<StagePoint> stagePoints = stages
            .entrySet()
            .stream()
            .map(entry -> new StagePoint(entry.getKey().name(), entry.getValue()))
            .toList();
        List<OriginPoint> originPoints = origins
            .entrySet()
            .stream()
            .filter(entry -> entry.getValue() > 0)
            .map(entry -> new OriginPoint(entry.getKey().name(), entry.getValue()))
            .toList();

        List<Interaction> periodInteractions = interactionDAO
            .findByLeadBranchIdAndCreatedAtBetweenOrderByCreatedAtAsc(id, start, end);
        List<ChartPoint> points = pointsByPeriod(periodInteractions, start, end);
        List<ChartPoint> conversions = conversionsByPeriod(periodLeads, start, end);

        List<SellerRanking> team = userDAO
            .findByPrimaryBranchIdAndStatusOrderByNameAsc(
                id,
                br.com.leadflow.model.enums.UserStatus.ACTIVE
            )
            .stream()
            .filter(user -> user.getRole() == UserRole.SELLER)
            .map(user -> new SellerRanking(
                user.getId(),
                user.getName(),
                leadDAO.countByResponsibleUserIdAndCreatedAtBetween(user.getId(), start, end),
                interactionDAO.countByResponsibleUserIdAndCreatedAtBetween(user.getId(), start, end),
                leadDAO.countByResponsibleUserIdAndStageAndCreatedAtBetween(
                    user.getId(),
                    LeadStage.CUSTOMER,
                    start,
                    end
                ),
                value(interactionDAO.sumScoreAppliedByResponsibleUserBetween(user.getId(), start, end))
            ))
            .sorted((left, right) -> Long.compare(right.points(), left.points()))
            .toList();

        return new BranchDetails(
            branch.getId(),
            branch.getName(),
            branch.isActive(),
            summary.activeLeads(),
            summary.newLeads(),
            summary.interactions(),
            summary.points(),
            summary.conversions(),
            summary.conversionRate(),
            summary.members(),
            points,
            conversions,
            stagePoints,
            originPoints,
            team
        );
    }

    @Transactional
    public BranchSummary create(BranchRequest request) {
        User actor = accessService.currentUser();
        requireAdmin(actor);
        Branch branch = new Branch();
        branch.setName(request.name().trim());
        branch.setActive(request.active());
        branch.setCompany(actor.getCompany());
        branch = branchDAO.save(branch);
        return summary(branch, Instant.now().minusSeconds(30L * 86400), Instant.now());
    }

    @Transactional
    public BranchSummary update(Long id, BranchRequest request) {
        User actor = accessService.currentUser();
        requireAdmin(actor);
        Branch branch = branchDAO
            .findByIdAndCompanyId(id, actor.getCompany().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Filial não encontrada."));
        branch.setName(request.name().trim());
        branch.setActive(request.active());
        return summary(branch, Instant.now().minusSeconds(30L * 86400), Instant.now());
    }

    public BranchSummary summary(Branch branch, Instant from, Instant to) {
        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minusSeconds(30L * 86400) : from;

        long active = leadDAO.countByBranchIdAndStageNotAndCreatedAtBetween(
            branch.getId(),
            LeadStage.LOST,
            start,
            end
        );
        long fresh = leadDAO.countByBranchIdAndCreatedAtBetween(branch.getId(), start, end);
        long interactions = interactionDAO.countByLeadBranchIdAndCreatedAtBetween(branch.getId(), start, end);
        long points = value(interactionDAO.sumScoreAppliedByBranchBetween(branch.getId(), start, end));

        List<Lead> leads = leadDAO.findByBranchIdOrderByCreatedAtDesc(branch.getId());
        long conversions = leads
            .stream()
            .filter(lead -> lead.getStage() == LeadStage.CUSTOMER && within(lead.getCreatedAt(), start, end))
            .count();
        double rate = fresh == 0 ? 0 : (conversions * 100.0 / fresh);

        return new BranchSummary(
            branch.getId(),
            branch.getName(),
            branch.isActive(),
            active,
            fresh,
            interactions,
            points,
            conversions,
            round(rate),
            userDAO.countByPrimaryBranchId(branch.getId())
        );
    }

    private List<Branch> branches(User actor) {
        if (actor.getRole() == UserRole.ADMIN) {
            return branchDAO.findByCompanyIdOrderByNameAsc(actor.getCompany().getId());
        }
        List<Long> ids = accessService.authorizedBranchIds(actor);
        return branchDAO
            .findAllById(ids)
            .stream()
            .sorted(java.util.Comparator.comparing(Branch::getName))
            .toList();
    }

    private List<ChartPoint> pointsByPeriod(
        List<Interaction> interactions,
        Instant start,
        Instant end
    ) {
        List<PeriodBucket> buckets = periodBuckets(start, end);
        for (Interaction interaction : interactions) {
            LocalDate date = interaction.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
            addToBucket(buckets, date, interaction.getScoreApplied());
        }
        return chart(buckets);
    }

    private List<ChartPoint> conversionsByPeriod(
        List<Lead> leads,
        Instant start,
        Instant end
    ) {
        List<PeriodBucket> buckets = periodBuckets(start, end);
        for (Lead lead : leads) {
            if (lead.getStage() != LeadStage.CUSTOMER) {
                continue;
            }
            LocalDate date = lead.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
            addToBucket(buckets, date, 1);
        }
        return chart(buckets);
    }

    private List<PeriodBucket> periodBuckets(Instant start, Instant end) {
        LocalDate startDate = start.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate endDate = end.atZone(ZoneOffset.UTC).toLocalDate();
        int bucketDays = bucketDays(startDate, endDate);
        List<PeriodBucket> buckets = new ArrayList<>();

        LocalDate cursor = startDate;
        while (!cursor.isAfter(endDate)) {
            LocalDate bucketEnd = cursor.plusDays(bucketDays - 1L);
            if (bucketEnd.isAfter(endDate)) {
                bucketEnd = endDate;
            }
            buckets.add(new PeriodBucket(cursor, bucketEnd, 0));
            cursor = bucketEnd.plusDays(1);
        }
        return buckets;
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

    private void addToBucket(List<PeriodBucket> buckets, LocalDate date, long value) {
        for (int index = 0; index < buckets.size(); index++) {
            PeriodBucket bucket = buckets.get(index);
            if (!date.isBefore(bucket.start()) && !date.isAfter(bucket.end())) {
                buckets.set(index, new PeriodBucket(bucket.start(), bucket.end(), bucket.value() + value));
                return;
            }
        }
    }

    private List<ChartPoint> chart(List<PeriodBucket> buckets) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        return buckets
            .stream()
            .map(bucket -> new ChartPoint(
                bucket.start().equals(bucket.end())
                    ? bucket.start().format(formatter)
                    : bucket.start().format(formatter) + "–" + bucket.end().format(formatter),
                bucket.value()
            ))
            .toList();
    }

    private boolean within(Instant value, Instant start, Instant end) {
        return !value.isBefore(start) && !value.isAfter(end);
    }

    private void requireAdmin(User actor) {
        if (actor.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedBusinessException("Somente Administradores podem gerenciar filiais.");
        }
    }

    private long value(Long value) {
        return value == null ? 0 : value;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record PeriodBucket(LocalDate start, LocalDate end, long value) {}
}
