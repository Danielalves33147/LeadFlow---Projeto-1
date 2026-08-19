import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, LoadingPanel } from '../components/ui';
import { ApiError, authApi } from '../services/api';

type State = 'waiting' | 'verifying' | 'success' | 'error';

export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const email = searchParams.get('email')?.trim() ?? '';
  const started = useRef(false);
  const [state, setState] = useState<State>(token ? 'verifying' : 'waiting');
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'Confirmar e-mail • LeadFlow';
    if (!token || started.current) return;
    started.current = true;
    authApi.verifyEmail(token)
      .then((response) => { setMessage(response.message); setState('success'); })
      .catch((cause) => { setMessage((cause as ApiError).message); setState('error'); });
  }, [token]);

  return <div className="lf-auth">
    <aside className="lf-auth-brand-panel">
      <div className="lf-auth-brand"><span className="lf-brand-mark">LF</span><strong>LeadFlow</strong></div>
      <div><h1>Confirme seu e-mail para ativar a conta.</h1><p>A conta principal só é liberada depois que o endereço de e-mail é confirmado.</p></div>
      <div className="lf-auth-note">Verificação de e-mail • Token de uso único • Conta protegida</div>
    </aside>
    <main className="lf-auth-form-panel"><div className="lf-auth-form">
      <div className="lf-auth-mobile-brand">LeadFlow</div>
      <div><h1>Confirmação de e-mail</h1><p>{state === 'waiting' ? 'Enviamos um link de confirmação para o e-mail informado.' : 'Estamos validando o link de confirmação da sua conta.'}</p></div>
      {state === 'waiting' && <Alert>Cadastro realizado com sucesso. Confira sua caixa de entrada{email ? ` em ${email}` : ''} e clique no link recebido.</Alert>}
      {state === 'verifying' && <LoadingPanel />}
      {state === 'success' && <><Alert>{message || 'E-mail confirmado com sucesso.'}</Alert><Button size="lg" onClick={() => navigate('/login', { replace: true })}>Ir para o login</Button></>}
      {state === 'error' && <><Alert tone="error">{message || 'Não foi possível confirmar este e-mail.'}</Alert><Button variant="secondary" size="lg" onClick={() => navigate('/login', { replace: true })}>Voltar para o login</Button></>}
      {state === 'waiting' && <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>Voltar para o login</Button>}
    </div></main>
  </div>;
}
