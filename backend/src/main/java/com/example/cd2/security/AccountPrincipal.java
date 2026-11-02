package com.example.cd2.security;

import com.example.cd2.entity.UserAccount;
import com.example.cd2.enums.AccountRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public class AccountPrincipal implements UserDetails {

    private final Long accountId;
    private final String email;
    private final String passwordHash;
    private final AccountRole role;
    private final boolean enabled;
    private final boolean locked;
    private final Long staffId;
    private final Long customerId;

    public AccountPrincipal(UserAccount a) {
        this.accountId = a.getId();
        this.email = a.getEmail();
        this.passwordHash = a.getPasswordHash();
        this.role = a.getRole();
        this.enabled = a.isEnabled();
        this.locked = a.getLockedUntil() != null && a.getLockedUntil().isAfter(Instant.now());
        this.staffId = a.getStaff() != null ? a.getStaff().getId() : null;
        this.customerId = a.getCustomer() != null ? a.getCustomer().getId() : null;
    }

    public Long getAccountId() { return accountId; }
    public AccountRole getRole() { return role; }
    public Long getStaffId() { return staffId; }
    public Long getCustomerId() { return customerId; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return !locked; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return enabled; }
}
