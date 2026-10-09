package com.example.cd2.repository;

import com.example.cd2.entity.Agent;
import com.example.cd2.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AgentRepository extends JpaRepository<Agent, Long>  {

    Optional<Agent> findFirstByDepartmentAndStatus(String department, String status);

    @Query("SELECT a FROM Agent a JOIN FETCH a.account WHERE a.department = :department")
    List<Agent> findAgentsWithAccountByDepartment(@Param("department") String department);
}
