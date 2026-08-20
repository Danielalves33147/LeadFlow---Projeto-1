import React from 'react';

type PasswordRule = {
  label: string;
  valid: boolean;
};

export function passwordRules(value: string): PasswordRule[] {
  return [
    { label: '8 ou mais caracteres', valid: value.length >= 8 },
    { label: '1 letra maiúscula', valid: /[A-Z]/.test(value) },
    { label: '1 letra minúscula', valid: /[a-z]/.test(value) },
    { label: '1 número', valid: /\d/.test(value) },
    { label: '1 símbolo', valid: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function isStrongPassword(value: string) {
  return passwordRules(value).every((rule) => rule.valid);
}

function strength(value: string) {
  const score = passwordRules(value).filter((rule) => rule.valid).length;

  if (!value) {
    return { label: 'Aguardando senha', level: 'empty', score } as const;
  }

  if (score <= 2) {
    return { label: 'Fraca', level: 'weak', score } as const;
  }

  if (score <= 4) {
    return { label: 'Média', level: 'medium', score } as const;
  }

  return { label: 'Forte', level: 'strong', score } as const;
}

export function PasswordStrength({ value }: { value: string }) {
  const rules = passwordRules(value);
  const current = strength(value);

  return (
    <div className="lf-password-strength" data-level={current.level} aria-live="polite">
      <div className="lf-password-strength-head">
        <span>Força da senha</span>
        <strong>{current.label}</strong>
      </div>

      <div className="lf-password-strength-bar" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className={index < current.score ? 'active' : ''} />
        ))}
      </div>

      <div className="lf-password-rules">
        {rules.map((rule) => (
          <span
            key={rule.label}
            className={`lf-password-rule ${rule.valid ? 'valid' : 'missing'}`}
          >
            <span aria-hidden="true">{rule.valid ? '✓' : '•'}</span>
            {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
}
