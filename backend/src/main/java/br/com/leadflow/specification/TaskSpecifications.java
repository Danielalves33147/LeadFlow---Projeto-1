package br.com.leadflow.specification;

import br.com.leadflow.model.Task;
import br.com.leadflow.model.enums.TaskStatus;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class TaskSpecifications {
    private TaskSpecifications() {}
    public static Specification<Task> company(Long id) { return (r,q,c)->c.equal(r.get("lead").get("branch").get("company").get("id"), id); }
    public static Specification<Task> branches(List<Long> ids) { return (r,q,c)->r.get("lead").get("branch").get("id").in(ids); }
    public static Specification<Task> branch(Long id) { return id==null?Specification.unrestricted():(r,q,c)->c.equal(r.get("lead").get("branch").get("id"),id); }
    public static Specification<Task> lead(Long id) { return id==null?Specification.unrestricted():(r,q,c)->c.equal(r.get("lead").get("id"),id); }
    public static Specification<Task> responsible(Long id) { return id==null?Specification.unrestricted():(r,q,c)->c.equal(r.get("responsibleUser").get("id"),id); }
    public static Specification<Task> status(TaskStatus v) { return v==null?Specification.unrestricted():(r,q,c)->c.equal(r.get("status"),v); }
    public static Specification<Task> from(Instant v) { return v==null?Specification.unrestricted():(r,q,c)->c.greaterThanOrEqualTo(r.get("dueAt"),v); }
    public static Specification<Task> to(Instant v) { return v==null?Specification.unrestricted():(r,q,c)->c.lessThanOrEqualTo(r.get("dueAt"),v); }
}
