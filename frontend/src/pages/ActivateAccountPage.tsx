import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Field, Input, LoadingPanel } from '../components/ui';
import { ApiError, invitationApi } from '../services/api';
import { roleLabels } from '../services/format';
import type { InvitationValidationResponse } from '../types';

type ValidationState = 'loading' | 'valid' | 'invalid';
function strength(value: string) { let s=0; if(value.length>=8)s++; if(/[A-Z]/.test(value))s++; if(/[a-z]/.test(value))s++; if(/\d/.test(value))s++; if(/[^A-Za-z0-9]/.test(value))s++; return s<3?'Fraca':s<5?'Boa':'Forte'; }

export function ActivateAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const started = useRef(false);
  const [validationState, setValidationState] = useState<ValidationState>('loading');
  const [invitation, setInvitation] = useState<InvitationValidationResponse | null>(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Ativar conta • LeadFlow';
    if (started.current) return;
    started.current = true;
    if (!token) { setValidationState('invalid'); setError('O link de ativação não possui um token válido.'); return; }
    invitationApi.validate(token)
      .then((response) => { if (!response.valid) { setValidationState('invalid'); setError('Este convite não é mais válido.'); return; } setInvitation(response); setValidationState('valid'); })
      .catch((cause) => { setValidationState('invalid'); setError((cause as ApiError).message); });
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setFieldError('');
    if (password !== confirmPassword) { setFieldError('As senhas não coincidem.'); return; }
    setSaving(true);
    try { await invitationApi.accept({ token, password, confirmPassword }); setSuccess(true); }
    catch (cause) { const apiError = cause as ApiError; setError(apiError.message); setFieldError(apiError.fieldErrors.password ?? apiError.fieldErrors.confirmPassword ?? ''); }
    finally { setSaving(false); }
  };

  return <div className="lf-auth">
    <aside className="lf-auth-brand-panel">
      <div className="lf-auth-brand"><span className="lf-brand-mark">LF</span><strong>LeadFlow</strong></div>
      <div><h1>Ative sua conta e entre para a equipe.</h1><p>Confirme os dados do convite e defina sua própria senha para acessar o LeadFlow.</p></div>
      <div className="lf-auth-note">Convite seguro • Senha definida pelo usuário • Token de uso único</div>
    </aside>
    <main className="lf-auth-form-panel"><div className="lf-auth-form">
      <div className="lf-auth-mobile-brand">LeadFlow</div>
      <div><h1>Ativar conta</h1><p>Valide seu convite e escolha a senha de acesso.</p></div>
      {validationState === 'loading' && <LoadingPanel />}
      {validationState === 'invalid' && <><Alert tone="error">{error || 'Este convite é inválido ou expirou.'}</Alert><Button variant="secondary" size="lg" onClick={() => navigate('/login', { replace: true })}>Voltar para o login</Button></>}
      {validationState === 'valid' && invitation && !success && <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
        <Alert>Convite encontrado. Confira os dados abaixo antes de ativar a conta.</Alert>
        <div className="lf-settings-list">
          <div><div><strong>Nome</strong><span>{invitation.name}</span></div></div>
          <div><div><strong>E-mail</strong><span>{invitation.email}</span></div></div>
          <div><div><strong>Empresa</strong><span>{invitation.companyName}</span></div></div>
          <div><div><strong>Perfil</strong><span>{roleLabels[invitation.role]}</span></div></div>
          <div><div><strong>Filial principal</strong><span>{invitation.primaryBranchName || 'Não informada'}</span></div></div>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Nova senha" error={fieldError} helper={`Força: ${strength(password)}. Use 8+ caracteres com maiúscula, minúscula, número e símbolo.`}><Input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Field label="Confirmar nova senha"><Input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></Field>
        <Button size="lg" type="submit" disabled={saving}>{saving ? 'Ativando conta...' : 'Ativar minha conta'}</Button>
      </form>}
      {validationState === 'valid' && success && <><Alert>Conta ativada com sucesso. Agora você já pode entrar com o e-mail do convite e a senha que acabou de definir.</Alert><Button size="lg" onClick={() => navigate('/login', { replace: true })}>Entrar no LeadFlow</Button></>}
    </div></main>
  </div>;
}
