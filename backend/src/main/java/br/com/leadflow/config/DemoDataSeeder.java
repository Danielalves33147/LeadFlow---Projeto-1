package br.com.leadflow.config;

import br.com.leadflow.dao.*;
import br.com.leadflow.model.*;
import br.com.leadflow.model.enums.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "leadflow.demo.seed", havingValue = "true", matchIfMissing = true)
public class DemoDataSeeder implements ApplicationRunner {

    private final CompanyDAO companyDAO;
    private final BranchDAO branchDAO;
    private final UserDAO userDAO;
    private final UserBranchDAO userBranchDAO;
    private final LeadDAO leadDAO;
    private final ScoreRuleDAO scoreRuleDAO;
    private final InteractionDAO interactionDAO;
    private final TaskDAO taskDAO;
    private final LeadHistoryDAO historyDAO;
    private final NotificationDAO notificationDAO;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
        CompanyDAO companyDAO,
        BranchDAO branchDAO,
        UserDAO userDAO,
        UserBranchDAO userBranchDAO,
        LeadDAO leadDAO,
        ScoreRuleDAO scoreRuleDAO,
        InteractionDAO interactionDAO,
        TaskDAO taskDAO,
        LeadHistoryDAO historyDAO,
        NotificationDAO notificationDAO,
        PasswordEncoder passwordEncoder
    ) {
        this.companyDAO = companyDAO;
        this.branchDAO = branchDAO;
        this.userDAO = userDAO;
        this.userBranchDAO = userBranchDAO;
        this.leadDAO = leadDAO;
        this.scoreRuleDAO = scoreRuleDAO;
        this.interactionDAO = interactionDAO;
        this.taskDAO = taskDAO;
        this.historyDAO = historyDAO;
        this.notificationDAO = notificationDAO;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (companyDAO.count() > 0) {
            return;
        }
        String password = passwordEncoder.encode("LeadFlow123!");
        Company company = new Company();
        company.setName("LeadFlow Demonstração");
        company.setCnpj("11222333000181");
        company = companyDAO.save(company);
        List<Branch> branches = new ArrayList<>();
        for (String name : List.of("Filial Alfa", "Filial Beta", "Filial Gama", "Filial Delta")) {
            Branch b = new Branch();
            b.setName(name);
            b.setCompany(company);
            b.setActive(true);
            branches.add(branchDAO.save(b));
        }
        User admin = user("Administrador LeadFlow", "administrador@leadflow.com.br", UserRole.ADMIN, company,
            branches.get(0), null, password);
        User manager1 = user("Marina Costa", "gerente@leadflow.com.br", UserRole.MANAGER, company, branches.get(0),
            null, password);
        User manager2 = user("Rafael Oliveira", "gerente2@leadflow.com.br", UserRole.MANAGER, company, branches.get(2),
            null, password);
        for (Branch b : branches) {
            UserBranch ub = new UserBranch();
            ub.setUser(b.getId() <= branches.get(1).getId() ? manager1 : manager2);
            ub.setBranch(b);
            userBranchDAO.save(ub);
        }
        String[] sellerNames = {
            "Lucas Santos", "Camila Rocha", "Felipe Almeida", "Bruna Melo", "Diego Souza", "Aline Nunes", "Caio Martins", "Juliana Freitas"
        };
        List<User> sellers = new ArrayList<>();
        for (int i = 0;
            i < sellerNames.length;
            i++) {
            Branch b = branches.get(i % branches.size());
            User m = i % branches.size() < 2 ? manager1 : manager2;
            String email = i == 0 ? "vendedor@leadflow.com.br" : "vendedor" + (i + 1) + "@leadflow.com.br";
            sellers.add(user(sellerNames[i], email, UserRole.SELLER, company, b, m, password));
        }
        seedRules(company);
        LeadStage[] stages = LeadStage.values();
        LeadOrigin[] origins = LeadOrigin.values();
        InteractionChannel[] channels = InteractionChannel.values();
        InteractionType[] types = InteractionType.values();
        Instant now = Instant.now();
        for (int i = 1;
            i <= 32;
            i++) {
            Branch b = branches.get((i - 1) % branches.size());
            List<User> branchSellers = sellers.stream()
                .filter(s -> s.getPrimaryBranch().getId().equals(b.getId()))
                .toList();
            User seller = branchSellers.get(i % branchSellers.size());
            Lead l = new Lead();
            l.setName("Lead Empresa " + String.format("%02d", i));
            l.setEmail("contato" + i + "@empresa" + i + ".com.br");
            l.setPhone("7199" + String.format("%07d", 1000000 + i));
            l.setCep("42850000");
            l.setBranch(b);
            l.setResponsibleUser(seller);
            l.setOrigin(origins[i % origins.length]);
            l.setStage(stages[i % stages.length]);
            l.setScore(10 + (i * 7) % 150);
            l.setLastInteractionAt(now.minus(i % 12, ChronoUnit.DAYS).minus(i, ChronoUnit.HOURS));
            l = leadDAO.save(l);
            LeadHistory h = new LeadHistory();
            h.setLead(l);
            h.setPerformedBy(admin);
            h.setEventType(HistoryEventType.CREATED);
            h.setNewValue(l.getName());
            h.setDescription("Lead criado nos dados de demonstração.");
            historyDAO.save(h);
            int interactionCount = 1 + (i % 3);
            for (int j = 0;
                j < interactionCount;
                j++) {
                Interaction in = new Interaction();
                in.setLead(l);
                in.setResponsibleUser(seller);
                in.setChannel(channels[(i + j) % channels.length]);
                in.setType(types[(i + j) % types.length]);
                in.setNotes("Contato comercial registrado para demonstração.");
                in.setScoreApplied((j + 1) * 5);
                in.setScoreRuleName("Regra demo");
                interactionDAO.save(in);
            }
            Task t = new Task();
            t.setLead(l);
            t.setResponsibleUser(seller);
            t.setTitle(i % 4 == 0 ? "Enviar proposta comercial" : "Realizar follow-up");
            t.setDescription("Tarefa de acompanhamento do Lead.");
            t.setDueAt(i % 6 == 0 ? now.minus(1, ChronoUnit.DAYS) : now.plus((i % 10) + 1, ChronoUnit.DAYS));
            t.setStatus(i % 6 == 0 ? TaskStatus.OVERDUE : (i % 7 == 0 ? TaskStatus.COMPLETED : TaskStatus.PENDING));
            if (t.getStatus() == TaskStatus.COMPLETED) {
                t.setCompletedAt(now.minus(1, ChronoUnit.DAYS));
            }
            taskDAO.save(t);
        }
        Notification n = new Notification();
        n.setUser(admin);
        n.setType(NotificationType.INTERACTION_CREATED);
        n.setTitle("Ambiente de demonstração pronto");
        n.setMessage("Os dados iniciais do LeadFlow foram carregados com sucesso.");
        n.setRead(false);
        notificationDAO.save(n);
    }

    private User user(
        String name,
        String email,
        UserRole role,
        Company c,
        Branch b,
        User manager,
        String password
    ) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPasswordHash(password);
        u.setRole(role);
        u.setStatus(UserStatus.ACTIVE);
        u.setCompany(c);
        u.setPrimaryBranch(b);
        u.setManager(manager);
        return userDAO.save(u);
    }

    private void seedRules(Company c) {
        InteractionType[] types = InteractionType.values();
        int[] values = {
            5, 5, 10, 20, 15, 8, 50, 0
        };
        for (int i = 0;
            i < types.length;
            i++) {
            ScoreRule r = new ScoreRule();
            r.setName("Pontuação — " + types[i].name());
            r.setCompany(c);
            r.setInteractionType(types[i]);
            r.setOperation(values[i] == 0 ? ScoreOperation.SET : ScoreOperation.ADD);
            r.setValue(values[i]);
            r.setStatus(ScoreRuleStatus.ACTIVE);
            scoreRuleDAO.save(r);
        }
    }
}
