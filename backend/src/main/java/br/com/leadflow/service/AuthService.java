package br.com.leadflow.service;

import br.com.leadflow.dao.BranchDAO;
import br.com.leadflow.dao.CompanyDAO;
import br.com.leadflow.dao.RefreshTokenDAO;
import br.com.leadflow.dao.PasswordChangeTokenDAO;
import br.com.leadflow.dao.UserBranchDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.dto.AuthDTOs.AuthResponse;
import br.com.leadflow.dto.AuthDTOs.AuthUser;
import br.com.leadflow.dto.AuthDTOs.LoginRequest;
import br.com.leadflow.dto.AuthDTOs.PasswordChangeConfirmRequest;
import br.com.leadflow.dto.AuthDTOs.PasswordChangeRequestResponse;
import br.com.leadflow.dto.AuthDTOs.PasswordResetConfirmRequest;
import br.com.leadflow.dto.AuthDTOs.PasswordResetRequest;
import br.com.leadflow.dto.AuthDTOs.PasswordResetRequestResponse;
import br.com.leadflow.dto.AuthDTOs.PasswordResetVerifyRequest;
import br.com.leadflow.dto.AuthDTOs.RegisterRequest;
import br.com.leadflow.dto.AuthDTOs.UpdateProfileRequest;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.exception.DuplicateResourceException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.Company;
import br.com.leadflow.model.RefreshToken;
import br.com.leadflow.model.PasswordChangeToken;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.security.LeadFlowPrincipal;
import br.com.leadflow.security.JwtService;
import br.com.leadflow.utils.TextUtils;
import br.com.leadflow.utils.SecureTokenUtils;
import br.com.leadflow.validation.CnpjValidator;

import br.com.leadflow.dto.AuthDTOs.RegisterResponse;

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
    private final EmailVerificationService emailVerificationService;
    private final UserBranchDAO userBranchDAO;
    private final RefreshTokenDAO refreshTokenDAO;
    private final PasswordChangeTokenDAO passwordChangeTokenDAO;
    private final AccessService accessService;
    private final EmailService emailService;
    private final long refreshExpirationSeconds;
    private final long passwordChangeExpirationSeconds;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
        AuthenticationManager authenticationManager,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        UserDAO userDAO,
        CompanyDAO companyDAO,
        BranchDAO branchDAO,
        EmailVerificationService emailVerificationService,
        UserBranchDAO userBranchDAO,
        RefreshTokenDAO refreshTokenDAO,
        PasswordChangeTokenDAO passwordChangeTokenDAO,
        AccessService accessService,
        EmailService emailService,
        @Value("${leadflow.jwt.refresh-expiration-seconds}") long refreshExpirationSeconds,
        @Value("${leadflow.account.password-change-expiration-seconds:900}") long passwordChangeExpirationSeconds
    ) {
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDAO = userDAO;
        this.companyDAO = companyDAO;
        this.branchDAO = branchDAO;
        this.emailVerificationService = emailVerificationService;
        this.userBranchDAO = userBranchDAO;
        this.refreshTokenDAO = refreshTokenDAO;
        this.passwordChangeTokenDAO = passwordChangeTokenDAO;
        this.accessService = accessService;
        this.emailService = emailService;
        this.refreshExpirationSeconds = refreshExpirationSeconds;
        this.passwordChangeExpirationSeconds = passwordChangeExpirationSeconds;
    }

    @Transactional
    public void verifyEmail(
        String token
    ) {
        emailVerificationService
            .verify(token);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = TextUtils.normalizedEmail(request.email());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = userDAO.findByEmailIgnoreCase(email).orElseThrow();
        if (user.getStatus() != UserStatus.ACTIVE)
            throw new BusinessException("ACCOUNT_INACTIVE", "Esta conta está inativa.");
        user.setLastLoginAt(Instant.now());
        return issue(user);
    }

    @Transactional
    public RegisterResponse register(
        RegisterRequest request
    ) {
        String email =
            TextUtils.normalizedEmail(
                request.email()
            );

        String cnpj =
            TextUtils.digits(
                request.cnpj()
            );

        if (!CnpjValidator.isValid(cnpj)) {
            throw new BusinessException(
                "INVALID_CNPJ",
                "Informe um CNPJ válido."
            );
        }

        validatePassword(
            request.password()
        );

        if (
            userDAO.existsByEmailIgnoreCase(
                email
            )
        ) {
            throw new DuplicateResourceException(
                "Já existe uma conta com este e-mail."
            );
        }

        if (
            companyDAO.existsByCnpj(cnpj)
        ) {
            throw new DuplicateResourceException(
                "Já existe uma empresa com este CNPJ."
            );
        }

        Company company = new Company();

        company.setName(
            request.companyName().trim()
        );

        company.setCnpj(cnpj);

        company =
            companyDAO.save(company);

        Branch branch = new Branch();

        branch.setName(
            "Filial Principal"
        );

        branch.setCompany(company);

        branch =
            branchDAO.save(branch);

        User admin = new User();

        admin.setName(
            request.name().trim()
        );

        admin.setEmail(email);

        admin.setPasswordHash(
            passwordEncoder.encode(
                request.password()
            )
        );

        admin.setRole(
            UserRole.ADMIN
        );

        admin.setStatus(
            UserStatus.PENDING_EMAIL_VERIFICATION
        );

        admin.setEmailVerifiedAt(null);

        admin.setCompany(company);
        admin.setPrimaryBranch(branch);

        admin =
            userDAO.save(admin);

        emailVerificationService
            .createVerification(admin);

        return new RegisterResponse(
            "Cadastro realizado. Confirme seu e-mail para ativar a conta.",
            admin.getEmail()
        );
    }

    @Transactional
    public AuthResponse refresh(String rawToken) {
        RefreshToken token = refreshTokenDAO
            .findByTokenHashAndRevokedFalse(hash(rawToken))
            .orElseThrow(() -> new BusinessException("INVALID_REFRESH_TOKEN", "Sessão inválida ou expirada."));
        if (token.getExpiresAt()
            .isBefore(Instant.now()) || token
            .getUser()
            .getStatus() != UserStatus
            .ACTIVE) {
                token
                    .setRevoked(true);
                throw new BusinessException("INVALID_REFRESH_TOKEN", "Sessão inválida ou expirada.");
            }
        token
            .setRevoked(true);
        return issue(token.getUser());
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokenDAO.findByTokenHashAndRevokedFalse(hash(rawToken)).ifPresent(t -> t.setRevoked(true));
    }

    @Transactional(readOnly = true)
    public AuthUser me() {
        return toAuthUser(accessService.currentUser());
    }

    @Transactional
    public AuthUser updateProfile(UpdateProfileRequest request) {
        User user = accessService.currentUser();
        String email = TextUtils.normalizedEmail(request.email());

        if (
            !email.equalsIgnoreCase(user.getEmail())
                && userDAO.existsByEmailIgnoreCase(email)
        ) {
            throw new DuplicateResourceException(
                "Já existe uma conta com este e-mail."
            );
        }

        user.setName(request.name().trim());
        user.setEmail(email);
        userDAO.save(user);

        return toAuthUser(user);
    }

    @Transactional
    public PasswordChangeRequestResponse requestPasswordChange() {
        User user = accessService.currentUser();
        createPasswordCode(user);

        return new PasswordChangeRequestResponse(
            maskEmail(user.getEmail()),
            passwordChangeExpirationSeconds
        );
    }

    @Transactional
    public PasswordResetRequestResponse requestPasswordReset(PasswordResetRequest request) {
        String email = TextUtils.normalizedEmail(request.email());

        userDAO.findByEmailIgnoreCase(email)
            .filter(user -> user.getStatus() == UserStatus.ACTIVE)
            .ifPresent(this::createPasswordCode);

        return new PasswordResetRequestResponse(
            "Se existir uma conta ativa com esse e-mail, enviaremos um código de recuperação.",
            passwordChangeExpirationSeconds
        );
    }

    @Transactional
    public void verifyPasswordReset(PasswordResetVerifyRequest request) {
        resolvePasswordResetToken(request.email(), request.token());
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        validatePassword(request.newPassword());
        PasswordChangeToken token = resolvePasswordResetToken(request.email(), request.token());
        User user = token.getUser();
        Instant now = Instant.now();

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        token.setUsedAt(now);
        userDAO.save(user);
        passwordChangeTokenDAO.save(token);

        // Uma recuperação de senha deve encerrar sessões antigas da conta.
        refreshTokenDAO.deleteByUserId(user.getId());
    }

    @Transactional
    public void confirmPasswordChange(PasswordChangeConfirmRequest request) {
        User user = accessService.currentUser();
        validatePassword(request.newPassword());

        PasswordChangeToken token = passwordChangeTokenDAO
            .findByTokenHashAndUsedAtIsNull(SecureTokenUtils.hash(request.token()))
            .orElseThrow(() -> new BusinessException(
                "INVALID_PASSWORD_CHANGE_TOKEN",
                "O código informado é inválido ou já foi utilizado."
            ));

        if (!token.getUser().getId().equals(user.getId())) {
            throw new BusinessException(
                "INVALID_PASSWORD_CHANGE_TOKEN",
                "O código informado é inválido ou já foi utilizado."
            );
        }

        Instant now = Instant.now();

        if (!token.getExpiresAt().isAfter(now)) {
            token.setUsedAt(now);
            passwordChangeTokenDAO.save(token);
            throw new BusinessException(
                "PASSWORD_CHANGE_TOKEN_EXPIRED",
                "O código para alteração de senha expirou. Solicite um novo código."
            );
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        token.setUsedAt(now);
        userDAO.save(user);
        passwordChangeTokenDAO.save(token);
    }

    private void createPasswordCode(User user) {
        Instant now = Instant.now();
        var previousTokens = passwordChangeTokenDAO.findByUserIdAndUsedAtIsNull(user.getId());

        for (PasswordChangeToken previous : previousTokens) {
            previous.setUsedAt(now);
        }

        if (!previousTokens.isEmpty()) {
            passwordChangeTokenDAO.saveAll(previousTokens);
        }

        String code;
        String hash;
        int attempts = 0;

        do {
            code = String.format("%06d", secureRandom.nextInt(1_000_000));
            hash = SecureTokenUtils.hash(code);
            attempts++;
        } while (passwordChangeTokenDAO.existsByTokenHash(hash) && attempts < 20);

        if (passwordChangeTokenDAO.existsByTokenHash(hash)) {
            throw new IllegalStateException("Não foi possível gerar um código de senha único.");
        }

        PasswordChangeToken token = new PasswordChangeToken();
        token.setUser(user);
        token.setTokenHash(hash);
        token.setExpiresAt(now.plusSeconds(passwordChangeExpirationSeconds));
        passwordChangeTokenDAO.save(token);

        emailService.sendPasswordChangeCode(user, code);
    }

    private PasswordChangeToken resolvePasswordResetToken(String rawEmail, String rawToken) {
        String email = TextUtils.normalizedEmail(rawEmail);
        PasswordChangeToken token = passwordChangeTokenDAO
            .findByTokenHashAndUsedAtIsNull(SecureTokenUtils.hash(rawToken))
            .orElseThrow(() -> invalidPasswordResetCode());

        User user = token.getUser();

        if (
            user.getStatus() != UserStatus.ACTIVE
                || !user.getEmail().equalsIgnoreCase(email)
        ) {
            throw invalidPasswordResetCode();
        }

        Instant now = Instant.now();

        if (!token.getExpiresAt().isAfter(now)) {
            token.setUsedAt(now);
            passwordChangeTokenDAO.save(token);
            throw new BusinessException(
                "PASSWORD_RESET_TOKEN_EXPIRED",
                "O código de recuperação expirou. Solicite um novo código."
            );
        }

        return token;
    }

    private BusinessException invalidPasswordResetCode() {
        return new BusinessException(
            "INVALID_PASSWORD_RESET_TOKEN",
            "O código informado é inválido para este e-mail."
        );
    }

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
            user.getCompany()
            .getId(), user
            .getCompany()
            .getName(), user
            .getPrimaryBranch() == null ? null : user
            .getPrimaryBranch()
            .getId(), user
            .getPrimaryBranch() == null ? null : user
            .getPrimaryBranch()
            .getName(), branchIds);
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
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');

        if (at <= 0) {
            return "***";
        }

        String local = email.substring(0, at);
        String domain = email.substring(at);
        String visible = local.length() <= 2
            ? local.substring(0, 1)
            : local.substring(0, 2);

        return visible + "***" + domain;
    }

    private void validatePassword(String password) {
        boolean strong = password != null && password
            .length() >= 8 && password
            .chars()
            .anyMatch(Character::isUpperCase) && password
            .chars()
            .anyMatch(Character::isLowerCase) && password
            .chars()
            .anyMatch(Character::isDigit) && password
            .chars()
            .anyMatch(c -> !Character.isLetterOrDigit(c));
        if (!strong)
            throw new BusinessException("WEAK_PASSWORD", "A senha deve ter ao menos 8 caracteres, maiúscula, minúscula, número e símbolo.");
    }
}
