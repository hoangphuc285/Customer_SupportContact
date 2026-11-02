package com.example.cd2.security;

import com.example.cd2.repository.UserAccountRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountUserDetailsService implements UserDetailsService {

    private final UserAccountRepository accounts;

    public AccountUserDetailsService(UserAccountRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return accounts.findByEmailIgnoreCase(email)
                .map(AccountPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay tai khoan"));
    }
}
