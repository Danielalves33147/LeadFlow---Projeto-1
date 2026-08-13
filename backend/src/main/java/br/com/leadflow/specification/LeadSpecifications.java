package br.com.leadflow.specification;

import br.com.leadflow.model.Lead;
import br.com.leadflow.model.enums.LeadOrigin;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.utils.TextUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class LeadSpecifications {
    private LeadSpecifications() {}

    public static Specification<Lead> company(Long companyId) {
        return (root, query, cb) -> cb.equal(root.get("branch").get("company").get("id"), companyId);
    }
    public static Specification<Lead> branchIds(List<Long> ids) {
        return (root, query, cb) -> root.get("branch").get("id").in(ids);
    }
    public static Specification<Lead> responsible(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("responsibleUser").get("id"), userId);
    }
    public static Specification<Lead> search(String value) {
        if (value == null || value.isBlank()) return Specification.unrestricted();
        String pattern = "%" + value.trim().toLowerCase() + "%";
        String phoneDigits = TextUtils.digits(value);
        String phonePattern = phoneDigits == null || phoneDigits.isBlank() ? pattern : "%" + phoneDigits + "%";
        return (root, query, cb) -> cb.or(
            cb.like(cb.lower(root.get("name")), pattern),
            cb.like(cb.lower(root.get("email")), pattern),
            cb.like(root.get("phone"), phonePattern)
        );
    }
    public static Specification<Lead> branch(Long id) { return id == null ? Specification.unrestricted() : (root, q, cb) -> cb.equal(root.get("branch").get("id"), id); }
    public static Specification<Lead> stage(LeadStage stage) { return stage == null ? Specification.unrestricted() : (root, q, cb) -> cb.equal(root.get("stage"), stage); }
    public static Specification<Lead> origin(LeadOrigin origin) { return origin == null ? Specification.unrestricted() : (root, q, cb) -> cb.equal(root.get("origin"), origin); }
    public static Specification<Lead> scoreMin(Integer value) { return value == null ? Specification.unrestricted() : (root,q,cb) -> cb.ge(root.get("score"), value); }
    public static Specification<Lead> scoreMax(Integer value) { return value == null ? Specification.unrestricted() : (root,q,cb) -> cb.le(root.get("score"), value); }
    public static Specification<Lead> createdFrom(Instant value) { return value == null ? Specification.unrestricted() : (root,q,cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), value); }
    public static Specification<Lead> createdTo(Instant value) { return value == null ? Specification.unrestricted() : (root,q,cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), value); }
}
