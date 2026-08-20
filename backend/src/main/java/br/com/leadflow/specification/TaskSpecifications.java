package br.com.leadflow.specification;

import br.com.leadflow.model.Task;
import br.com.leadflow.model.enums.TaskStatus;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

public final class TaskSpecifications {

    private TaskSpecifications() {
    }

    public static Specification<Task> company(Long id) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(
                root.get("lead")
                    .get("branch")
                    .get("company")
                    .get("id"),
                id
            );
    }

    public static Specification<Task> branches(List<Long> ids) {
        return (root, query, criteriaBuilder) ->
            root.get("lead")
                .get("branch")
                .get("id")
                .in(ids);
    }

    public static Specification<Task> branch(Long id) {
        return id == null
            ? Specification.unrestricted()
            : (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(
                    root.get("lead")
                        .get("branch")
                        .get("id"),
                    id
                );
    }

    public static Specification<Task> lead(Long id) {
        return id == null
            ? Specification.unrestricted()
            : (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(
                    root.get("lead").get("id"),
                    id
                );
    }

    public static Specification<Task> responsible(Long id) {
        return id == null
            ? Specification.unrestricted()
            : (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(
                    root.get("responsibleUser").get("id"),
                    id
                );
    }

    public static Specification<Task> responsibleIn(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return (root, query, criteriaBuilder) ->
                criteriaBuilder.disjunction();
        }

        return (root, query, criteriaBuilder) ->
            root.get("responsibleUser")
                .get("id")
                .in(ids);
    }

    public static Specification<Task> status(TaskStatus value) {
        return value == null
            ? Specification.unrestricted()
            : (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(
                    root.get("status"),
                    value
                );
    }

    public static Specification<Task> from(Instant value) {
        return value == null
            ? Specification.unrestricted()
            : (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(
                    root.get("dueAt"),
                    value
                );
    }

    public static Specification<Task> to(Instant value) {
        return value == null
            ? Specification.unrestricted()
            : (root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(
                    root.get("dueAt"),
                    value
                );
    }
}