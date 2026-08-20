import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { ApiError } from '../services/api';
import { formatCnpj } from '../services/format';
import { Alert, Button, Field, Input } from '../components/ui';
import { isStrongPassword, PasswordStrength } from '../components/PasswordStrength';


export function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', companyName: '', cnpj: '', password: '', confirm: '',
    acceptedTerms: false, acceptedPrivacy: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const set = (key: string, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setFields({});
    if (!isStrongPassword(form.password)) {
      setFields({ password: 'A senha ainda não atende a todos os requisitos de segurança.' });
      return;
    }
    if (form.password !== form.confirm) {
      setFields({ confirm: 'As senhas não coincidem.' });
      return;
    }
    setBusy(true);
    try {
      const response = await register({
        name: form.name,
        email: form.email,
        companyName: form.companyName,
        cnpj: form.cnpj,
        password: form.password,
        acceptedTerms: form.acceptedTerms,
        acceptedPrivacy: form.acceptedPrivacy,
      });
      navigate(`/confirmar-email?email=${encodeURIComponent(response.email)}`, { replace: true });
    } catch (cause) {
      const apiError = cause as ApiError;
      setError(apiError.message);
      setFields(apiError.fieldErrors);
    } finally {
      setBusy(false);
    }
  };

  return <div className="lf-auth">
    <aside className="lf-auth-brand-panel">
      <div className="lf-auth-brand"><span className="lf-brand-mark">LF</span><strong>LeadFlow</strong></div>
      <div><h1>Comece com uma base comercial organizada.</h1><p>Crie a conta principal da empresa e configure equipes, filiais e processos no mesmo ambiente.</p></div>
      <div className="lf-auth-note">Segurança por perfil • Histórico rastreável • Interface responsiva</div>
    </aside>
    <main className="lf-auth-form-panel">
      <form className="lf-auth-form register" onSubmit={submit}>
        <div className="lf-auth-mobile-brand">LeadFlow</div>
        <div><h1>Criar conta</h1><p>Informe os dados essenciais da empresa.</p></div>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="lf-form-grid">
          <Field label="Nome completo" error={fields.name}><Input required minLength={2} maxLength={120} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="E-mail corporativo" error={fields.email}><Input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Nome da empresa" error={fields.companyName}><Input required value={form.companyName} onChange={(e) => set('companyName', e.target.value)} /></Field>
          <Field label="CNPJ" error={fields.cnpj}><Input required placeholder="00.000.000/0000-00" value={form.cnpj} maxLength={18} onChange={(e) => set('cnpj', formatCnpj(e.target.value))} /></Field>
          <Field label="Senha" error={fields.password}>
            <>
              <Input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
              <PasswordStrength value={form.password} />
            </>
          </Field>
          <Field label="Confirmação da senha" error={fields.confirm}>
            <>
              <Input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
              {form.confirm && form.password !== form.confirm && <span className="lf-password-match lf-password-match-error">As senhas ainda não coincidem.</span>}
              {form.confirm && form.password === form.confirm && <span className="lf-password-match lf-password-match-ok">As senhas coincidem.</span>}
            </>
          </Field>
        </div>
        <div className="lf-legal-checks">
          <label className="lf-check"><input required type="checkbox" checked={form.acceptedTerms} onChange={(e) => set('acceptedTerms', e.target.checked)} /><span>Li e aceito os <button type="button" className="lf-link">Termos de Uso</button>.</span></label>
          <label className="lf-check"><input required type="checkbox" checked={form.acceptedPrivacy} onChange={(e) => set('acceptedPrivacy', e.target.checked)} /><span>Li e aceito a <button type="button" className="lf-link">Política de Privacidade</button>.</span></label>
        </div>
        <Button size="lg" type="submit" disabled={busy}>{busy ? 'Criando conta...' : 'Criar conta'}</Button>
        <p className="lf-auth-switch">Já possui uma conta? <Link to="/login">Entrar</Link></p>
      </form>
    </main>
  </div>;
}
