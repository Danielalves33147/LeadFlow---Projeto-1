import React from 'react';

type PasswordRule = {
  label: string;
  valid: boolean;
};

export function passwordRules(value: string): PasswordRule[] {
  return [
    {
      label: '8 ou mais caracteres',
      valid: value.length >= 8,
    },
    {
      label: '1 letra maiúscula',
      valid: /[A-Z]/.test(value),
    },
    {
      label: '1 letra minúscula',
      valid: /[a-z]/.test(value),
    },
    {
      label: '1 número',
      valid: /\d/.test(value),
    },
    {
      label: '1 símbolo',
      valid: /[^A-Za-z0-9]/.test(value),
    },
  ];
}

export function isStrongPassword(value: string) {
  return passwordRules(value).every((rule) => rule.valid);
}

function getPasswordStrength(value: string) {
  const rules = passwordRules(value);
  const score = rules.filter((rule) => rule.valid).length;

  if (!value) {
    return {
      level: 'empty',
      label: '',
      message:
        'Use 8+ caracteres, maiúscula, minúscula, número e símbolo.',
    } as const;
  }

  if (score <= 2) {
    return {
      level: 'weak',
      label: 'Fraca',
      message:
        'Use 8+ caracteres, maiúscula, minúscula, número e símbolo.',
    } as const;
  }

  if (score <= 4) {
    const missingRules = rules
      .filter((rule) => !rule.valid)
      .map((rule) => rule.label);

    return {
      level: 'medium',
      label: 'Média',
      message:
        missingRules.length > 0
          ? `Falta ${missingRules[0].toLowerCase()}.`
          : 'Falta pouco para ficar segura.',
    } as const;
  }

  return {
    level: 'strong',
    label: 'Forte',
    message: 'Senha segura.',
  } as const;
}

export function PasswordStrength({
  value,
}: {
  value: string;
}) {
  const current = getPasswordStrength(value);

  return (
    <div
      className="lf-password-strength"
      data-level={current.level}
      aria-live="polite"
    >
      {current.label && (
        <>
          <strong className="lf-password-strength-status">
            {current.label}
          </strong>

          <span className="lf-password-strength-separator">
            ·
          </span>
        </>
      )}

      <span className="lf-password-strength-message">
        {current.message}
      </span>
    </div>
  );
}