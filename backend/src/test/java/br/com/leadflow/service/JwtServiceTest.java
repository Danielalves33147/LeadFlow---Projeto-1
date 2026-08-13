package br.com.leadflow.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.Company;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.security.JwtService;
import br.com.leadflow.security.LeadFlowPrincipal;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
    @Test void createsAndValidatesToken(){
        Company c=new Company();c.setId(10L);c.setName("Empresa");c.setCnpj("11222333000181");
        Branch b=new Branch();b.setId(20L);b.setName("Principal");b.setCompany(c);
        User u=new User();u.setId(30L);u.setName("Admin");u.setEmail("admin@test.com");u.setPasswordHash("hash");u.setCompany(c);u.setPrimaryBranch(b);u.setRole(UserRole.ADMIN);u.setStatus(UserStatus.ACTIVE);
        LeadFlowPrincipal p=new LeadFlowPrincipal(u);
        JwtService service=new JwtService("0123456789012345678901234567890123456789",900,new ObjectMapper());
        String token=service.generate(p);
        var claims=service.validate(token);
        assertEquals(30L,claims.userId());
        assertEquals("admin@test.com",claims.email());
        assertTrue(claims.expiresAt()>java.time.Instant.now().getEpochSecond());
    }
}
