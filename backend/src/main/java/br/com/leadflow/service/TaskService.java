package br.com.leadflow.service;

import br.com.leadflow.dao.TaskDAO;
import br.com.leadflow.dto.CommonDTOs.PageResponse;
import br.com.leadflow.dto.TaskDTOs.CancelTaskRequest;
import br.com.leadflow.dto.TaskDTOs.CreateTaskRequest;
import br.com.leadflow.dto.TaskDTOs.RescheduleTaskRequest;
import br.com.leadflow.dto.TaskDTOs.TaskResponse;
import br.com.leadflow.dto.TaskDTOs.UpdateTaskRequest;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.exception.ResourceNotFoundException;
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.Task;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.HistoryEventType;
import br.com.leadflow.model.enums.NotificationType;
import br.com.leadflow.model.enums.TaskStatus;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.specification.TaskSpecifications;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
    private final TaskDAO taskDAO;
    private final LeadService leadService;
    private final AccessService accessService;
    private final HistoryService historyService;
    private final NotificationService notificationService;

    public TaskService(TaskDAO taskDAO, LeadService leadService, AccessService accessService, HistoryService historyService, NotificationService notificationService) {
        this.taskDAO=taskDAO; this.leadService=leadService; this.accessService=accessService; this.historyService=historyService; this.notificationService=notificationService;
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> list(Long branchId, Long leadId, Long responsibleId, TaskStatus status, Instant from, Instant to, Pageable pageable){
        User actor=accessService.currentUser();
        Specification<Task> spec=Specification.where(TaskSpecifications.company(actor.getCompany().getId()));
        if(actor.getRole()==UserRole.SELLER) spec=spec.and(TaskSpecifications.responsible(actor.getId()));
        else if(actor.getRole()==UserRole.MANAGER) spec=spec.and(TaskSpecifications.branches(accessService.authorizedBranchIds(actor)));
        if(branchId!=null) accessService.requireBranch(branchId,actor);
        spec=spec.and(TaskSpecifications.branch(branchId)).and(TaskSpecifications.lead(leadId)).and(TaskSpecifications.responsible(responsibleId))
            .and(TaskSpecifications.status(status)).and(TaskSpecifications.from(from)).and(TaskSpecifications.to(to));
        Page<TaskResponse> page=taskDAO.findAll(spec,pageable).map(this::toResponse);
        return new PageResponse<>(page.getContent(),page.getNumber(),page.getSize(),page.getTotalElements(),page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> byLead(Long leadId){ User actor=accessService.currentUser(); leadService.requireLead(leadId,actor); return taskDAO.findByLeadIdOrderByDueAtAsc(leadId).stream().map(this::toResponse).toList(); }

    @Transactional
    public TaskResponse create(CreateTaskRequest request){
        User actor=accessService.currentUser(); Lead lead=leadService.requireLead(request.leadId(),actor);
        User responsible=resolveResponsible(request.responsibleUserId(),lead,actor);
        if(request.dueAt().isBefore(Instant.now().minusSeconds(60))) throw new BusinessException("INVALID_DUE_DATE","A data da tarefa não pode estar no passado.");
        Task task=new Task(); task.setTitle(request.title().trim()); task.setDescription(request.description()); task.setLead(lead); task.setResponsibleUser(responsible); task.setDueAt(request.dueAt()); task.setStatus(TaskStatus.PENDING); task=taskDAO.save(task);
        historyService.record(lead,actor,HistoryEventType.TASK_CREATED,null,task.getTitle(),"Tarefa criada para "+responsible.getName()+".");
        if(!responsible.getId().equals(actor.getId())) notificationService.create(responsible,NotificationType.TASK_DUE_SOON,"Nova tarefa atribuída",task.getTitle(),"TASK",task.getId());
        return toResponse(task);
    }

    @Transactional
    public TaskResponse update(Long id, UpdateTaskRequest request){
        User actor=accessService.currentUser(); Task task=requireTask(id,actor); ensureEditable(task);
        task.setTitle(request.title().trim()); task.setDescription(request.description()); task.setDueAt(request.dueAt());
        if(request.responsibleUserId()!=null) task.setResponsibleUser(resolveResponsible(request.responsibleUserId(),task.getLead(),actor));
        if(task.getStatus()==TaskStatus.OVERDUE && task.getDueAt().isAfter(Instant.now())) task.setStatus(TaskStatus.PENDING);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse complete(Long id){ User actor=accessService.currentUser(); Task t=requireTask(id,actor); ensureEditable(t); t.setStatus(TaskStatus.COMPLETED); t.setCompletedAt(Instant.now()); return toResponse(t); }

    @Transactional
    public TaskResponse cancel(Long id, CancelTaskRequest request){ User actor=accessService.currentUser(); Task t=requireTask(id,actor); ensureEditable(t); t.setStatus(TaskStatus.CANCELLED); t.setCancelReason(request.reason()); return toResponse(t); }

    @Transactional
    public TaskResponse reschedule(Long id, RescheduleTaskRequest request){ User actor=accessService.currentUser(); Task t=requireTask(id,actor); ensureEditable(t); if(request.dueAt().isBefore(Instant.now())) throw new BusinessException("INVALID_DUE_DATE","Escolha uma data futura para reagendar."); t.setDueAt(request.dueAt()); t.setStatus(TaskStatus.PENDING); return toResponse(t); }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void updateOverdueTasks(){
        List<Task> overdue=taskDAO.findByStatusAndDueAtBefore(TaskStatus.PENDING,Instant.now());
        for(Task t:overdue){ t.setStatus(TaskStatus.OVERDUE); notificationService.create(t.getResponsibleUser(),NotificationType.TASK_OVERDUE,"Tarefa atrasada",t.getTitle(),"TASK",t.getId()); }
    }

    private Task requireTask(Long id,User actor){ Task t=taskDAO.findById(id).orElseThrow(()->new ResourceNotFoundException("Tarefa não encontrada.")); accessService.assertLeadAccess(t.getLead(),actor); return t; }
    private void ensureEditable(Task t){ if(t.getStatus()==TaskStatus.COMPLETED||t.getStatus()==TaskStatus.CANCELLED) throw new BusinessException("TASK_CLOSED","Esta tarefa já foi encerrada."); }

    private User resolveResponsible(Long id,Lead lead,User actor){
        if(actor.getRole()==UserRole.SELLER) return actor;
        User target=id==null?lead.getResponsibleUser():accessService.requireCompanyUser(id,actor);
        if(target.getStatus()!=UserStatus.ACTIVE) throw new BusinessException("USER_INACTIVE","Usuário inativo não pode receber tarefas.");
        if(target.getPrimaryBranch()!=null && !target.getPrimaryBranch().getId().equals(lead.getBranch().getId()) && target.getRole()==UserRole.SELLER) throw new BusinessException("BRANCH_MISMATCH","O responsável deve pertencer à filial do Lead.");
        return target;
    }

    private TaskResponse toResponse(Task t){ return new TaskResponse(t.getId(),t.getTitle(),t.getDescription(),t.getLead().getId(),t.getLead().getName(),t.getResponsibleUser().getId(),t.getResponsibleUser().getName(),t.getLead().getBranch().getId(),t.getLead().getBranch().getName(),t.getDueAt(),t.getStatus(),t.getCompletedAt(),t.getCreatedAt()); }
}
