package com.example.cd2.repository;

import com.example.cd2.entity.Agent;
import com.example.cd2.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AgentRepository extends JpaRepository<Agent, Long>  {

    Optional<Object> findFirstByDepartmentAndStatus(String department, String available);
    Optional<Agent> findByEmail(String email);
}
