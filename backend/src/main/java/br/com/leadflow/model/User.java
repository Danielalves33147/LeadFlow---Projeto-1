package br.com.leadflow.model;

import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;

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
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private UserStatus status = UserStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_branch_id")
    private Branch primaryBranch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(
        String passwordHash
    ) {
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(
        UserRole role
    ) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(
        UserStatus status
    ) {
        this.status = status;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(
        Company company
    ) {
        this.company = company;
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

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(
        Instant lastLoginAt
    ) {
        this.lastLoginAt = lastLoginAt;
    }

    public Instant getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    public void setEmailVerifiedAt(
        Instant emailVerifiedAt
    ) {
        this.emailVerifiedAt = emailVerifiedAt;
    }
}