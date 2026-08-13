import React, { useEffect, useState } from 'react';
import { branchApi, leadApi, userApi, ApiError } from '../../services/api';
import { formatCep, formatPhone, originLabels } from '../../services/format';
import type { BranchSummary, LeadOrigin, LeadResponse, UserResponse } from '../../types';
import { Button, Drawer, Field, Input, Select, useToast } from '../ui';
import { useAuth } from '../../app/AuthContext';

const origins=Object.keys(originLabels) as LeadOrigin[];
export function LeadForm({open,onClose,onSaved,lead}:{open:boolean;onClose:()=>void;onSaved:(lead:LeadResponse)=>void;lead?:LeadResponse|null}){
 const toast=useToast(); const {user}=useAuth(); const [branches,setBranches]=useState<BranchSummary[]>([]); const [sellers,setSellers]=useState<UserResponse[]>([]); const [saving,setSaving]=useState(false); const [errors,setErrors]=useState<Record<string,string>>({});
 const [form,setForm]=useState({name:'',phone:'',email:'',origin:'WEBSITE' as LeadOrigin,cep:'',branchId:'',responsibleUserId:''});
 useEffect(()=>{if(!open)return;if(user?.role!=='SELLER')branchApi.list().then(setBranches).catch(()=>setBranches([]));else setBranches([]); if(lead)setForm({name:lead.name,phone:formatPhone(lead.phone),email:lead.email??'',origin:lead.origin,cep:formatCep(lead.cep),branchId:String(lead.branchId),responsibleUserId:String(lead.responsibleUserId)}); else setForm({name:'',phone:'',email:'',origin:'WEBSITE',cep:'',branchId:user?.role==='SELLER'?String(user.primaryBranchId??''):'',responsibleUserId:''})},[open,lead,user]);
 useEffect(()=>{const id=Number(form.branchId); if(!id||user?.role==='SELLER'){setSellers([]);return;} userApi.sellers(id).then(setSellers).catch(()=>setSellers([]))},[form.branchId,user]);
 const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setErrors({});setSaving(true);try{const payload={name:form.name.trim(),phone:form.phone.trim()||null,email:form.email.trim()||null,origin:form.origin,cep:form.cep.trim()||null};const saved=lead?await leadApi.update(lead.id,payload):await leadApi.create({...payload,branchId:Number(form.branchId),responsibleUserId:form.responsibleUserId?Number(form.responsibleUserId):null});toast.push('success',lead?'Lead atualizado':'Lead criado com sucesso',saved.name);onSaved(saved);onClose()}catch(e){const err=e as ApiError;setErrors(err.fieldErrors);toast.push('error','Não foi possível salvar',err.message)}finally{setSaving(false)}};
 return <Drawer open={open} title={lead?'Editar Lead':'Novo Lead'} description={lead?'Atualize as informações comerciais permitidas.':'Cadastre o Lead e defina sua filial e responsável.'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" form="lead-form" disabled={saving}>{saving?'Salvando...':lead?'Salvar alterações':'Criar Lead'}</Button></>}>
 <form id="lead-form" onSubmit={submit} className="lf-form-grid">
  <div className="span-2"><Field label="Nome do Lead" error={errors.name}><Input value={form.name} required minLength={2} maxLength={160} onChange={e=>set('name',e.target.value)} /></Field></div>
  <Field label="Telefone" error={errors.phone}><Input value={form.phone} maxLength={15} inputMode="tel" placeholder="(00) 00000-0000" onChange={e=>set('phone',formatPhone(e.target.value))} /></Field>
  <Field label="E-mail" error={errors.email}><Input type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></Field>
  <Field label="Origem" error={errors.origin}><Select value={form.origin} onChange={e=>set('origin',e.target.value)}>{origins.map(o=><option key={o} value={o}>{originLabels[o]}</option>)}</Select></Field>
  <Field label="CEP" error={errors.cep}><Input value={form.cep} maxLength={9} inputMode="numeric" placeholder="00000-000" onChange={e=>set('cep',formatCep(e.target.value))} /></Field>
  {!lead&&(user?.role==='SELLER'?<><Field label="Filial" helper="O Lead será criado na sua filial operacional."><Input value={user.primaryBranchName??'Filial não definida'} readOnly /></Field><Field label="Responsável" helper="O Lead será atribuído automaticamente a você."><Input value={user.name} readOnly /></Field></>:<><Field label="Filial" error={errors.branchId}><Select required value={form.branchId} onChange={e=>set('branchId',e.target.value)}><option value="">Selecione</option>{branches.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field><Field label="Responsável" error={errors.responsibleUserId} helper="Opcional; deve pertencer à filial selecionada."><Select value={form.responsibleUserId} onChange={e=>set('responsibleUserId',e.target.value)}><option value="">Definir automaticamente</option>{sellers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field></>)}
 </form></Drawer>
}
