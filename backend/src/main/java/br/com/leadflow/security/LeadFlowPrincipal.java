package br.com.leadflow.security;

import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class LeadFlowPrincipal implements UserDetails {
    private final Long userId;
    private final Long companyId;
    private final String email;
    private final String password;
    private final UserRole role;
    private final UserStatus status;

    public LeadFlowPrincipal(User user) {
        this.userId = user.getId();
        this.companyId = user.getCompany().getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.role = user.getRole();
        this.status = user.getStatus();
    }

    public Long getUserId() { return userId; }
    public Long getCompanyId() { return companyId; }
    public UserRole getRole() { return role; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority("ROLE_" + role.name())); }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return status == UserStatus.ACTIVE; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return status == UserStatus.ACTIVE; }
}
