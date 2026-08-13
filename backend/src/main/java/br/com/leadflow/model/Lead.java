package br.com.leadflow.model;

import br.com.leadflow.model.enums.LeadOrigin;
import br.com.leadflow.model.enums.LeadStage;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "leads")
public class Lead extends BaseEntity {
    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(length = 180)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LeadOrigin origin = LeadOrigin.OTHER;

    @Column(length = 8)
    private String cep;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeadStage stage = LeadStage.NEW;

    @Column(nullable = false)
    private int score = 0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false, updatable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsible_user_id", nullable = false)
    private User responsibleUser;

    @Column(name = "last_interaction_at")
    private Instant lastInteractionAt;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LeadOrigin getOrigin() { return origin; }
    public void setOrigin(LeadOrigin origin) { this.origin = origin; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public LeadStage getStage() { return stage; }
    public void setStage(LeadStage stage) { this.stage = stage; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public User getResponsibleUser() { return responsibleUser; }
    public void setResponsibleUser(User responsibleUser) { this.responsibleUser = responsibleUser; }
    public Instant getLastInteractionAt() { return lastInteractionAt; }
    public void setLastInteractionAt(Instant lastInteractionAt) { this.lastInteractionAt = lastInteractionAt; }
}
