package br.com.leadflow.dao;

import br.com.leadflow.model.Branch;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchDAO extends JpaRepository<Branch, Long> {

    List<Branch> findByCompanyIdOrderByNameAsc(Long companyId);
    List<Branch> findByCompanyIdAndActiveTrueOrderByNameAsc(Long companyId);
    Optional<Branch> findByIdAndCompanyId(Long id, Long companyId);
    long countByCompanyId(Long companyId);
}
