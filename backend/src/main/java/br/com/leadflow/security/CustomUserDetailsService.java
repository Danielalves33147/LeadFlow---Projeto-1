package br.com.leadflow.security;

import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.model.User;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserDAO userDAO;

    public CustomUserDetailsService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userDAO
            .findByEmailIgnoreCase(username)
            .orElseThrow(() -> new UsernameNotFoundException("Credenciais inválidas."));
        return new LeadFlowPrincipal(user);
    }

    @Transactional(readOnly = true)
    public LeadFlowPrincipal loadById(Long id) {
        User user = userDAO.findById(id)
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));
        return new LeadFlowPrincipal(user);
    }
}
