package br.com.leadflow.service;

import br.com.leadflow.dto.CommonDTOs.PageResponse;
import br.com.leadflow.dto.DashboardDTOs.DashboardResponse;
import br.com.leadflow.dto.DashboardDTOs.EvolutionPoint;
import br.com.leadflow.dto.DashboardDTOs.Kpi;
import br.com.leadflow.dto.DashboardDTOs.RankingItem;
import br.com.leadflow.dto.DashboardDTOs.StageDistribution;
import br.com.leadflow.dto.InteractionDTOs.InteractionResponse;
import br.com.leadflow.dto.LeadDTOs.LeadSummary;
import br.com.leadflow.model.User;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
    private final LeadService leadService; private final InteractionService interactionService; private final RankingService rankingService; private final AccessService accessService;
    public DashboardService(LeadService leadService,InteractionService interactionService,RankingService rankingService,AccessService accessService){this.leadService=leadService;this.interactionService=interactionService;this.rankingService=rankingService;this.accessService=accessService;}

    @Transactional(readOnly=true)
    public DashboardResponse get(Long branchId,Instant from,Instant to){User actor=accessService.currentUser();Instant end=to==null?Instant.now():to;Instant start=from==null?end.minusSeconds(30L*86400):from;long duration=Math.max(1,end.getEpochSecond()-start.getEpochSecond());Instant prevStart=start.minusSeconds(duration);
        var all=leadService.list(null,branchId,null,null,null,null,null,null,null,PageRequest.of(0,10000,Sort.by(Sort.Direction.DESC,"createdAt"))).content();
        var currentNew=leadService.list(null,branchId,null,null,null,null,null,start,end,PageRequest.of(0,10000)).content();
        var previousNew=leadService.list(null,branchId,null,null,null,null,null,prevStart,start,PageRequest.of(0,10000)).content();
        var currentInteractions=interactionService.list(branchId,null,null,null,null,start,end,PageRequest.of(0,10000,Sort.by(Sort.Direction.DESC,"createdAt"))).content();
        var previousInteractions=interactionService.list(branchId,null,null,null,null,prevStart,start,PageRequest.of(0,10000)).content();
        long active=all.stream().filter(l->l.stage()!=LeadStage.LOST).count();long generated=currentInteractions.stream().mapToLong(InteractionResponse::scoreApplied).sum();long prevGenerated=previousInteractions.stream().mapToLong(InteractionResponse::scoreApplied).sum();
        Map<LeadStage,Long> stages=new EnumMap<>(LeadStage.class);for(LeadStage s:LeadStage.values())stages.put(s,0L);for(LeadSummary l:all)stages.merge(l.stage(),1L,Long::sum);List<StageDistribution> distribution=stages.entrySet().stream().map(e->new StageDistribution(e.getKey(),e.getValue())).toList();
        List<RankingItem> ranking=actor.getRole()==UserRole.SELLER?List.of():rankingService.ranking(start,end).stream().limit(5).map(r->new RankingItem(r.branchId(),r.branchName(),r.points(),r.conversions(),r.conversionRate(),r.trend())).toList();
        List<LeadSummary> recent=all.stream().limit(8).toList();
        return new DashboardResponse(new Kpi(active,0),new Kpi(currentNew.size(),variation(currentNew.size(),previousNew.size())),new Kpi(currentInteractions.size(),variation(currentInteractions.size(),previousInteractions.size())),new Kpi(generated,variation(generated,prevGenerated)),evolution(currentNew,currentInteractions),distribution,ranking,recent);
    }
    private List<EvolutionPoint> evolution(List<LeadSummary> leads,List<InteractionResponse> interactions){LocalDate today=LocalDate.now(ZoneOffset.UTC);Map<LocalDate,long[]> map=new LinkedHashMap<>();for(int i=6;i>=0;i--)map.put(today.minusDays(i),new long[3]);for(LeadSummary l:leads){LocalDate d=l.createdAt().atZone(ZoneOffset.UTC).toLocalDate();if(map.containsKey(d))map.get(d)[0]++;}for(InteractionResponse i:interactions){LocalDate d=i.createdAt().atZone(ZoneOffset.UTC).toLocalDate();if(map.containsKey(d)){map.get(d)[1]++;map.get(d)[2]+=i.scoreApplied();}}DateTimeFormatter f=DateTimeFormatter.ofPattern("dd/MM");List<EvolutionPoint> out=new ArrayList<>();map.forEach((d,v)->out.add(new EvolutionPoint(d.format(f),v[0],v[1],v[2])));return out;}
    private double variation(long current,long previous){if(previous==0)return current==0?0:100;return Math.round(((current-previous)*1000.0/Math.abs(previous)))/10.0;}
}
