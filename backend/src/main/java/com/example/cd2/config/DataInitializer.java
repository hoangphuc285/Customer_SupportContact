package com.example.cd2.config;

import com.example.cd2.entity.*;
import com.example.cd2.enums.AccountRole;
import com.example.cd2.enums.StaffRole;
import com.example.cd2.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Tao tai khoan mau (nhan vien + khach hang) khi khoi dong, chi tao neu chua ton tai. */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserAccountRepository accounts;
    private final StaffRepository staffRepo;
    private final CustomerRepository customerRepo;
    private final DepartmentRepository departmentRepo;
    private final PasswordEncoder encoder;

    @Value("${app.seed.enabled:true}")
    private boolean enabled;

    @Value("${app.seed.password:ChangeMe@123}")
    private String seedPassword;

    public DataInitializer(UserAccountRepository accounts, StaffRepository staffRepo,
                           CustomerRepository customerRepo, DepartmentRepository departmentRepo,
                           PasswordEncoder encoder) {
        this.accounts = accounts;
        this.staffRepo = staffRepo;
        this.customerRepo = customerRepo;
        this.departmentRepo = departmentRepo;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) return;
        seedStaff("admin@support.local", "Quan tri he thong", AccountRole.ADMIN, StaffRole.ADMIN, "SUPPORT");
        seedStaff("manager@support.local", "Quan ly CSKH", AccountRole.MANAGER, StaffRole.MANAGER, "SUPPORT");
        seedStaff("teamlead@support.local", "Truong nhom CSKH", AccountRole.TEAM_LEAD, StaffRole.TEAM_LEAD, "SUPPORT");
        seedStaff("agent@support.local", "Nhan vien CSKH", AccountRole.AGENT, StaffRole.AGENT, "SUPPORT");
        seedStaff("tech@support.local", "Ky thuat vien", AccountRole.TECHNICIAN, StaffRole.TECHNICIAN, "TECH");
        seedCustomer("customer@example.com", "Khach hang mau");
        log.warn("Da tao tai khoan mau voi mat khau mac dinh - hay DOI MAT KHAU truoc khi trien khai that.");
    }

    private void seedStaff(String email, String name, AccountRole role, StaffRole staffRole, String deptCode) {
        if (accounts.existsByEmailIgnoreCase(email)) return;
        Staff s = staffRepo.findByEmail(email).orElseGet(() -> {
            Staff n = new Staff();
            n.setFullName(name);
            n.setEmail(email);
            n.setRole(staffRole);
            departmentRepo.findByCode(deptCode).ifPresent(n::setDepartment);
            return staffRepo.save(n);
        });
        UserAccount a = new UserAccount();
        a.setEmail(email);
        a.setPasswordHash(encoder.encode(seedPassword));
        a.setRole(role);
        a.setStaff(s);
        accounts.save(a);
    }

    private void seedCustomer(String email, String name) {
        if (accounts.existsByEmailIgnoreCase(email)) return;
        Customer c = customerRepo.findByEmail(email).orElseGet(() -> {
            Customer n = new Customer();
            n.setFullName(name);
            n.setEmail(email);
            return customerRepo.save(n);
        });
        UserAccount a = new UserAccount();
        a.setEmail(email);
        a.setPasswordHash(encoder.encode(seedPassword));
        a.setRole(AccountRole.CUSTOMER);
        a.setCustomer(c);
        accounts.save(a);
    }
}
