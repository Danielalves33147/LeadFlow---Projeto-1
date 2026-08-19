package br.com.leadflow.model;

import br.com.leadflow.model.enums.InvitationStatus;
import br.com.leadflow.model.enums.UserRole;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "user_invitations")
public class UserInvitation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "company_id",
        nullable = false
    )
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "invited_by_user_id",
        nullable = false
    )
    private User invitedBy;

    @Column(
        nullable = false,
        length = 120
    )
    private String name;

    @Column(
        nullable = false,
        length = 180
    )
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(
        nullable = false,
        length = 20
    )
    private UserRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_branch_id")
    private Branch primaryBranch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(
        name = "token_hash",
        nullable = false,
        unique = true,
        length = 64
    )
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(
        nullable = false,
        length = 20
    )
    private InvitationStatus status;

    @Column(
        name = "expires_at",
        nullable = false
    )
    private Instant expiresAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_invitation_branches",
        joinColumns = @JoinColumn(
            name = "invitation_id"
        ),
        inverseJoinColumns = @JoinColumn(
            name = "branch_id"
        )
    )
    private Set<Branch> authorizedBranches = new HashSet<>();

    public Company getCompany() {
        return company;
    }

    public void setCompany(
        Company company
    ) {
        this.company = company;
    }

    public User getInvitedBy() {
        return invitedBy;
    }

    public void setInvitedBy(
        User invitedBy
    ) {
        this.invitedBy = invitedBy;
    }

    public String getName() {
        return name;
    }

    public void setName(
        String name
    ) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(
        String email
    ) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(
        UserRole role
    ) {
        this.role = role;
    }

    public Branch getPrimaryBranch() {
        return primaryBranch;
    }

    public void setPrimaryBranch(
        Branch primaryBranch
    ) {
        this.primaryBranch = primaryBranch;
    }

    public User getManager() {
        return manager;
    }

    public void setManager(
        User manager
    ) {
        this.manager = manager;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(
        String tokenHash
    ) {
        this.tokenHash = tokenHash;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(
        InvitationStatus status
    ) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(
        Instant expiresAt
    ) {
        this.expiresAt = expiresAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(
        Instant acceptedAt
    ) {
        this.acceptedAt = acceptedAt;
    }

    public Set<Branch> getAuthorizedBranches() {
        return authorizedBranches;
    }

    public void setAuthorizedBranches(
        Set<Branch> authorizedBranches
    ) {
        this.authorizedBranches = authorizedBranches;
    }
}