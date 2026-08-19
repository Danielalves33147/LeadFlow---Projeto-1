package br.com.leadflow.service;

import br.com.leadflow.dao.BranchDAO;
import br.com.leadflow.dao.UserBranchDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.exception.ResourceNotFoundException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.security.SecurityUtils;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class AccessService {

    private final UserDAO userDAO;
    private final BranchDAO branchDAO;
    private final UserBranchDAO userBranchDAO;

    public AccessService(UserDAO userDAO, BranchDAO branchDAO, UserBranchDAO userBranchDAO) {
        this.userDAO = userDAO;
        this.branchDAO = branchDAO;
        this.userBranchDAO = userBranchDAO;
    }

    public User currentUser() {
        Long id = SecurityUtils.principal().getUserId();

            return userDAO
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado."));
    }

    public List<Long> authorizedBranchIds(User user) {
        if (user.getRole() == UserRole.ADMIN) {

                return branchDAO
                .findByCompanyIdOrderByNameAsc(user.getCompany()
                .getId())
                .stream()
                .map(Branch::getId)
                .toList();
        }
        if (user.getRole() == UserRole.MANAGER) {
            List<Long> ids = userBranchDAO
                .findByUserId(user.getId())
                .stream()
                .map(ub -> ub.getBranch().getId())
                .distinct()
                .toList();
            if (!ids.isEmpty()) return ids;
        }
        return user.getPrimaryBranch() == null ? List.of() : List.of(user.getPrimaryBranch()
            .getId());
    }

    public Branch requireBranch(Long branchId, User actor) {
        Branch branch = branchDAO
            .findByIdAndCompanyId(branchId, actor.getCompany()
            .getId())
            .orElseThrow(() -> new ResourceNotFoundException("Filial não encontrada."));
        if (actor.getRole() != UserRole.ADMIN && !authorizedBranchIds(actor)
            .contains(branchId)) {
                throw new AccessDeniedBusinessException("Você não possui acesso a esta filial.");
            }
        return branch;
    }

    public User requireCompanyUser(Long userId, User actor) {

            return userDAO
            .findByIdAndCompanyId(userId, actor.getCompany()
            .getId())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    public void assertLeadAccess(Lead lead, User actor) {
        if (!lead.getBranch()
            .getCompany()
            .getId()
            .equals(actor.getCompany()
            .getId())) throw new AccessDeniedBusinessException("Lead fora do seu contexto.");
        if (actor.getRole() == UserRole.ADMIN) return;
        if (actor.getRole() == UserRole.MANAGER && authorizedBranchIds(actor).contains(lead.getBranch()
            .getId())) return;
        if (actor.getRole() == UserRole.SELLER && lead.getResponsibleUser().getId().equals(actor.getId()))
            return;
        throw new AccessDeniedBusinessException("Você não possui acesso a este Lead.");
    }
}
