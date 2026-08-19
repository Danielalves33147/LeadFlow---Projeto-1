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
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.Interaction;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.LeadOrigin;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.model.enums.UserRole;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
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
        if (actor.getRole() == UserRole.SELLER) throw new AccessDeniedBusinessException("Vendedores não acessam Filiais.");
        return branches(actor)
            .stream()
            .map(b -> summary(b, from, to))
            .toList();
    }

    @Transactional(readOnly = true)
    public BranchDetails get(Long id, Instant from, Instant to) {
        User actor = accessService.currentUser();
        if (actor.getRole() == UserRole.SELLER) throw new AccessDeniedBusinessException("Vendedores não acessam Filiais.");
        Branch b = accessService.requireBranch(id, actor);
        BranchSummary s = summary(b, from, to);
        List<Lead> leads = leadDAO.findByBranchIdOrderByCreatedAtDesc(id);
        Map<LeadStage, Long> stages = new EnumMap<>(LeadStage.class);
        Map<LeadOrigin, Long> origins = new EnumMap<>(LeadOrigin.class);
        for (LeadStage st : LeadStage.values()) stages.put(st, 0L);
        for (LeadOrigin o : LeadOrigin.values()) origins.put(o, 0L);
        for (Lead l : leads) {
            stages.merge(l.getStage(), 1L, Long::sum);
            origins.merge(l.getOrigin(), 1L, Long::sum);
        }
        List<StagePoint> stagePoints = stages
            .entrySet()
            .stream()
            .map(e -> new StagePoint(e.getKey().name(), e.getValue()))
            .toList();
        List<OriginPoint> originPoints = origins
            .entrySet()
            .stream()
            .filter(e -> e.getValue() > 0)
            .map(e -> new OriginPoint(e.getKey().name(), e.getValue()))
            .toList();
        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minusSeconds(30L * 86400) : from;
        List<ChartPoint> points = pointsByDay(interactionDAO.findByLeadBranchIdAndCreatedAtBetweenOrderByCreatedAtAsc(id,
                start, end));
        List<ChartPoint> conversions = groupByDay(leads, true);
        List<SellerRanking> team = userDAO
            .findByPrimaryBranchIdAndStatusOrderByNameAsc(id, br.com.leadflow.model.enums.UserStatus.ACTIVE)
            .stream()
            .filter(u -> u.getRole() == UserRole.SELLER)
            .map(u -> new SellerRanking(u.getId(), u.getName(), leadDAO.countByResponsibleUserId(u.getId()),
                interactionDAO.countByResponsibleUserId(u.getId()), leadDAO.countByResponsibleUserIdAndStage(u.getId(),
                LeadStage.CUSTOMER), value(leadDAO.sumScoreByUser(u.getId()))))
            .sorted((a, c) -> Long.compare(c.points(), a.points()))
            .toList();

            return new BranchDetails(b.getId(), b.getName(), b.isActive(), s.activeLeads(), s.newLeads(), s.interactions(),
            s.points(), s.conversions(), s.conversionRate(), s.members(), points, conversions, stagePoints,
            originPoints, team);
    }

    @Transactional
    public BranchSummary create(BranchRequest request) {
        User actor = accessService.currentUser();
        requireAdmin(actor);
        Branch b = new Branch();
        b.setName(request.name().trim());
        b.setActive(request.active());
        b.setCompany(actor.getCompany());
        b = branchDAO.save(b);
        return summary(b, Instant.now().minusSeconds(30L * 86400), Instant.now());
    }

    @Transactional
    public BranchSummary update(Long id, BranchRequest request) {
        User actor = accessService.currentUser();
        requireAdmin(actor);
        Branch b = branchDAO
            .findByIdAndCompanyId(id, actor.getCompany()
            .getId())
            .orElseThrow(() -> new ResourceNotFoundException("Filial não encontrada."));
        b.setName(request.name().trim());
        b.setActive(request.active());
        return summary(b, Instant.now().minusSeconds(30L * 86400), Instant.now());
    }

    public BranchSummary summary(Branch b, Instant from, Instant to) {
        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minusSeconds(30L * 86400) : from;
        long active = leadDAO.countByBranchIdAndStageNot(b.getId(), LeadStage.LOST);
        long fresh = leadDAO.countByBranchIdAndCreatedAtBetween(b.getId(), start, end);
        long interactions = interactionDAO.countByLeadBranchIdAndCreatedAtBetween(b.getId(), start, end);
        long points = value(interactionDAO.sumScoreAppliedByBranchBetween(b.getId(), start, end));
        List<Lead> leads = leadDAO.findByBranchIdOrderByCreatedAtDesc(b.getId());
        long conversions = leads
            .stream()
            .filter(l -> l.getStage() == LeadStage.CUSTOMER && !l.getCreatedAt()
            .isBefore(start) && !l.getCreatedAt().isAfter(end))
            .count();
        double rate = fresh == 0 ? 0 : (conversions * 100.0 / fresh);

            return new BranchSummary(b.getId(), b.getName(), b.isActive(), active, fresh, interactions, points,
            conversions, round(rate), userDAO.countByPrimaryBranchId(b.getId()));
    }

    private List<Branch> branches(User actor) {
        if (actor.getRole() == UserRole.ADMIN)
            return branchDAO.findByCompanyIdOrderByNameAsc(actor.getCompany().getId());
        List<Long> ids = accessService.authorizedBranchIds(actor);

            return branchDAO
            .findAllById(ids)
            .stream()
            .sorted(java.util.Comparator.comparing(Branch::getName))
            .toList();
    }

    private List<ChartPoint> groupByDay(List<Lead> leads, boolean conversions) {
        Map<LocalDate, Long> map = lastSevenDays();
        for (Lead l : leads) {
            LocalDate d = l.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
            if (map.containsKey(d) && (!conversions || l.getStage() == LeadStage.CUSTOMER)) map.merge(d, 1L,
                Long::sum);
        }
        return chart(map);
    }

    private List<ChartPoint> pointsByDay(List<Interaction> interactions) {
        Map<LocalDate, Long> map = lastSevenDays();
        for (Interaction i : interactions) {
            LocalDate d = i.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
            if (map.containsKey(d)) map.merge(d, (long) i.getScoreApplied(), Long::sum);
        }
        return chart(map);
    }

    private Map<LocalDate, Long> lastSevenDays() {
        Map<LocalDate, Long> map = new LinkedHashMap<>();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (int i = 6;
            i >= 0;
            i--) map.put(today.minusDays(i), 0L);
        return map;
    }

    private List<ChartPoint> chart(Map<LocalDate, Long> map) {
        DateTimeFormatter f = DateTimeFormatter.ofPattern("dd/MM");

            return map
            .entrySet()
            .stream()
            .map(e -> new ChartPoint(e.getKey().format(f), e.getValue()))
            .toList();
    }

    private void requireAdmin(User actor) {
        if (actor.getRole() != UserRole.ADMIN)
            throw new AccessDeniedBusinessException("Somente Administradores podem gerenciar filiais.");
    }

    private long value(Long v) {
        return v == null ? 0 : v;
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
