package br.com.leadflow.dao;

import br.com.leadflow.model.UserBranch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBranchDAO extends JpaRepository<UserBranch, Long> {
    List<UserBranch> findByUserId(Long userId);
    boolean existsByUserIdAndBranchId(Long userId, Long branchId);
    void deleteByUserId(Long userId);
}
