package br.com.leadflow.specification;

import br.com.leadflow.model.Interaction;
import br.com.leadflow.model.enums.InteractionChannel;
import br.com.leadflow.model.enums.InteractionType;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

public final class InteractionSpecifications {

    private InteractionSpecifications() {}public static Specification<Interaction> company(Long id) {
        return (r, q, c) -> c.equal(r.get("lead")
            .get("branch")
            .get("company")
            .get("id"), id);
    }

    public static Specification<Interaction> branches(List<Long> ids) {
        return (r, q, c) -> r.get("lead").get("branch").get("id").in(ids);
    }

    public static Specification<Interaction> branch(Long id) {

            return id == null ? Specification.unrestricted() : (r, q, c) -> c.equal(r.get("lead")
            .get("branch")
            .get("id"), id);
    }

    public static Specification<Interaction> lead(Long id) {
        return id == null ? Specification.unrestricted() : (r, q, c) -> c.equal(r.get("lead")
            .get("id"), id);
    }

    public static Specification<Interaction> responsible(Long id) {

            return id == null ? Specification.unrestricted() : (r, q, c) -> c.equal(r.get("responsibleUser")
            .get("id"), id);
    }

    public static Specification<Interaction> channel(InteractionChannel v) {
        return v == null ? Specification.unrestricted() : (r, q, c) -> c.equal(r.get("channel"), v);
    }

    public static Specification<Interaction> type(InteractionType v) {
        return v == null ? Specification.unrestricted() : (r, q, c) -> c.equal(r.get("type"), v);
    }

    public static Specification<Interaction> from(Instant v) {

            return v == null ? Specification.unrestricted() : (r, q, c) -> c.greaterThanOrEqualTo(r.get("createdAt"),
            v);
    }

    public static Specification<Interaction> to(Instant v) {
        return v == null ? Specification.unrestricted() : (r, q, c) -> c.lessThanOrEqualTo(r.get("createdAt"),
            v);
    }
}
