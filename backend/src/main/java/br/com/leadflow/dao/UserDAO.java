package br.com.leadflow.dao;

import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDAO extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<User> findByIdAndCompanyId(Long id, Long companyId);
    List<User> findByCompanyIdOrderByNameAsc(Long companyId);
    List<User> findByCompanyIdAndRoleAndStatusOrderByNameAsc(Long companyId, UserRole role, UserStatus status);
    List<User> findByPrimaryBranchIdAndStatusOrderByNameAsc(Long branchId, UserStatus status);
    List<User> findByManagerIdOrderByNameAsc(Long managerId);
    long countByPrimaryBranchId(Long branchId);
}
