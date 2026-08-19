package br.com.leadflow.dao;

import br.com.leadflow.model.Company;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyDAO extends JpaRepository<Company, Long> {

    Optional<Company> findByCnpj(String cnpj);
    boolean existsByCnpj(String cnpj);
}
