package br.com.leadflow.service;

import br.com.leadflow.dao.BranchDAO;
import br.com.leadflow.dao.CompanyDAO;
import br.com.leadflow.dao.RefreshTokenDAO;
import br.com.leadflow.dao.UserBranchDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.dto.AuthDTOs.AuthResponse;
import br.com.leadflow.dto.AuthDTOs.AuthUser;
import br.com.leadflow.dto.AuthDTOs.LoginRequest;
import br.com.leadflow.dto.AuthDTOs.RegisterRequest;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.exception.DuplicateResourceException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.Company;
import br.com.leadflow.model.RefreshToken;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.security.LeadFlowPrincipal;
import br.com.leadflow.security.JwtService;
import br.com.leadflow.utils.TextUtils;
import br.com.leadflow.validation.CnpjValidator;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDAO userDAO;
    private final CompanyDAO companyDAO;
    private final BranchDAO branchDAO;
    private final UserBranchDAO userBranchDAO;
    private final RefreshTokenDAO refreshTokenDAO;
    private final AccessService accessService;
    private final long refreshExpirationSeconds;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(AuthenticationManager authenticationManager, PasswordEncoder passwordEncoder, JwtService jwtService,
                       UserDAO userDAO, CompanyDAO companyDAO, BranchDAO branchDAO, UserBranchDAO userBranchDAO,
                       RefreshTokenDAO refreshTokenDAO, AccessService accessService,
                       @Value("${leadflow.jwt.refresh-expiration-seconds}") long refreshExpirationSeconds) {
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDAO = userDAO;
        this.companyDAO = companyDAO;
        this.branchDAO = branchDAO;
        this.userBranchDAO = userBranchDAO;
        this.refreshTokenDAO = refreshTokenDAO;
        this.accessService = accessService;
        this.refreshExpirationSeconds = refreshExpirationSeconds;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = TextUtils.normalizedEmail(request.email());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = userDAO.findByEmailIgnoreCase(email).orElseThrow();
        if (user.getStatus() != UserStatus.ACTIVE) throw new BusinessException("ACCOUNT_INACTIVE", "Esta conta está inativa.");
        user.setLastLoginAt(Instant.now());
        return issue(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = TextUtils.normalizedEmail(request.email());
        String cnpj = TextUtils.digits(request.cnpj());
        if (!CnpjValidator.isValid(cnpj)) throw new BusinessException("INVALID_CNPJ", "Informe um CNPJ válido.");
        validatePassword(request.password());
        if (userDAO.existsByEmailIgnoreCase(email)) throw new DuplicateResourceException("Já existe uma conta com este e-mail.");
        if (companyDAO.existsByCnpj(cnpj)) throw new DuplicateResourceException("Já existe uma empresa com este CNPJ.");

        Company company = new Company();
        company.setName(request.companyName().trim());
        company.setCnpj(cnpj);
        company = companyDAO.save(company);

        Branch branch = new Branch();
        branch.setName("Filial Principal");
        branch.setCompany(company);
        branch = branchDAO.save(branch);

        User admin = new User();
        admin.setName(request.name().trim());
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(request.password()));
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setCompany(company);
        admin.setPrimaryBranch(branch);
        admin = userDAO.save(admin);

        return issue(admin);
    }

    @Transactional
    public AuthResponse refresh(String rawToken) {
        RefreshToken token = refreshTokenDAO.findByTokenHashAndRevokedFalse(hash(rawToken))
            .orElseThrow(() -> new BusinessException("INVALID_REFRESH_TOKEN", "Sessão inválida ou expirada."));
        if (token.getExpiresAt().isBefore(Instant.now()) || token.getUser().getStatus() != UserStatus.ACTIVE) {
            token.setRevoked(true);
            throw new BusinessException("INVALID_REFRESH_TOKEN", "Sessão inválida ou expirada.");
        }
        token.setRevoked(true);
        return issue(token.getUser());
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokenDAO.findByTokenHashAndRevokedFalse(hash(rawToken)).ifPresent(t -> t.setRevoked(true));
    }

    @Transactional(readOnly = true)
    public AuthUser me() { return toAuthUser(accessService.currentUser()); }

    private AuthResponse issue(User user) {
        LeadFlowPrincipal principal = new LeadFlowPrincipal(user);
        String access = jwtService.generate(principal);
        String rawRefresh = newRefreshToken();
        RefreshToken refresh = new RefreshToken();
        refresh.setUser(user);
        refresh.setTokenHash(hash(rawRefresh));
        refresh.setExpiresAt(Instant.now().plusSeconds(refreshExpirationSeconds));
        refresh.setRevoked(false);
        refreshTokenDAO.save(refresh);
        return new AuthResponse(access, rawRefresh, jwtService.getExpirationSeconds(), toAuthUser(user));
    }

    private AuthUser toAuthUser(User user) {
        var branchIds = accessService.authorizedBranchIds(user);
        return new AuthUser(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getStatus(),
            user.getCompany().getId(), user.getCompany().getName(),
            user.getPrimaryBranch() == null ? null : user.getPrimaryBranch().getId(),
            user.getPrimaryBranch() == null ? null : user.getPrimaryBranch().getName(), branchIds);
    }

    private String newRefreshToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    private void validatePassword(String password) {
        boolean strong = password != null && password.length() >= 8
            && password.chars().anyMatch(Character::isUpperCase)
            && password.chars().anyMatch(Character::isLowerCase)
            && password.chars().anyMatch(Character::isDigit)
            && password.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        if (!strong) throw new BusinessException("WEAK_PASSWORD", "A senha deve ter ao menos 8 caracteres, maiúscula, minúscula, número e símbolo.");
    }
}
