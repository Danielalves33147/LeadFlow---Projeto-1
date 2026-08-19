import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { fmtNumber } from '../services/format';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <button
      className={`lf-btn lf-btn-${variant} ${
        size === 'sm' ? 'lf-btn-sm' : size === 'lg' ? 'lf-btn-lg' : ''
      } ${className}`}
      {...props}
    />
  );
}

export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      className="lf-icon-btn"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`lf-card ${className}`}>{children}</section>;
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'info' | 'primary' | 'warning' | 'success' | 'danger' | 'neutral';
}) {
  return <span className={`lf-badge lf-badge-${tone}`}>{children}</span>;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="lf-page-header">
      <div className="lf-page-header-main">
        {breadcrumb && <div className="lf-breadcrumb">{breadcrumb}</div>}
        <h1 className="lf-page-title">{title}</h1>
        {description && <p className="lf-page-description">{description}</p>}
      </div>
      {actions && <div className="lf-page-actions">{actions}</div>}
    </header>
  );
}

export function Field({
  label,
  error,
  helper,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  children: ReactNode;
}) {
  const id = useId();

  return (
    <div className="lf-field" data-field-id={id}>
      <span className="lf-label">{label}</span>
      {children}
      {error && (
        <span className="lf-field-error" role="alert">
          {error}
        </span>
      )}
      {helper && !error && <span className="lf-helper">{helper}</span>}
    </div>
  );
}

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`lf-input ${props.className ?? ''}`} {...props} />
);

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`lf-select ${props.className ?? ''}`} {...props} />
);

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={`lf-textarea ${props.className ?? ''}`} {...props} />
);

export type SearchableSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Selecione',
  searchPlaceholder = 'Pesquisar...',
  emptyText = 'Nenhuma opção encontrada.',
  disabled = false,
  className = '',
  ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      normalizeSearch(option.label).includes(normalizedQuery),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const selectedIndex = filteredOptions.findIndex(
      (option) => option.value === value && !option.disabled,
    );

    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [open, filteredOptions, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const enabledOptions = filteredOptions.filter((option) => !option.disabled);

  const moveHighlight = (direction: 1 | -1) => {
    if (enabledOptions.length === 0) {
      return;
    }

    const currentValue = filteredOptions[highlightedIndex]?.value;
    const currentEnabledIndex = enabledOptions.findIndex(
      (option) => option.value === currentValue,
    );
    const nextEnabledIndex =
      currentEnabledIndex < 0
        ? direction > 0
          ? 0
          : enabledOptions.length - 1
        : (currentEnabledIndex + direction + enabledOptions.length) %
          enabledOptions.length;
    const nextValue = enabledOptions[nextEnabledIndex].value;
    const nextFilteredIndex = filteredOptions.findIndex(
      (option) => option.value === nextValue,
    );

    setHighlightedIndex(Math.max(0, nextFilteredIndex));
  };

  const choose = (option: SearchableSelectOption) => {
    if (option.disabled) {
      return;
    }

    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const handleKeyboard = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      const first = filteredOptions.findIndex((option) => !option.disabled);
      setHighlightedIndex(Math.max(0, first));
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      for (let index = filteredOptions.length - 1; index >= 0; index -= 1) {
        if (!filteredOptions[index].disabled) {
          setHighlightedIndex(index);
          break;
        }
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];

      if (option) {
        choose(option);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div
      ref={rootRef}
      className={`lf-searchable-select ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      <button
        type="button"
        className={`lf-searchable-select-trigger ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }

          if (event.key === 'Escape') {
            setOpen(false);
            setQuery('');
          }
        }}
      >
        <span className={selected ? '' : 'is-placeholder'}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className="lf-searchable-select-chevron"
          aria-hidden="true"
          viewBox="0 0 20 20"
        >
          <path d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="lf-searchable-select-menu">
          <div className="lf-searchable-select-search">
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <circle cx="9" cy="9" r="5" />
              <path d="M13 13l4 4" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyboard}
            />
          </div>

          <div className="lf-searchable-select-options" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="lf-searchable-select-empty">{emptyText}</div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  className={`lf-searchable-select-option ${
                    option.value === value ? 'is-selected' : ''
                  } ${index === highlightedIndex ? 'is-highlighted' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => choose(option)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="lf-empty">
      <div className="lf-empty-title">{title}</div>
      <p className="lf-empty-text">{text}</p>
      {action}
    </div>
  );
}

export function Alert({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'error' | 'warning';
}) {
  return (
    <div
      className={`lf-alert lf-alert-${tone}`}
      role={tone === 'error' ? 'alert' : undefined}
    >
      {children}
    </div>
  );
}

export function Skeleton({
  height = 20,
  width = '100%',
}: {
  height?: number;
  width?: string;
}) {
  return <div className="lf-skeleton" style={{ height, width }} />;
}

export function LoadingPanel() {
  return (
    <Card>
      <div style={{ display: 'grid', gap: 12 }}>
        <Skeleton height={24} width="35%" />
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton height={16} width="80%" />
      </div>
    </Card>
  );
}

export function KpiCard({
  label,
  value,
  variation = 0,
}: {
  label: string;
  value: number;
  variation?: number;
}) {
  const cls =
    variation > 0 ? 'lf-trend-up' : variation < 0 ? 'lf-trend-down' : '';

  return (
    <Card className="lf-kpi">
      <div className="lf-kpi-label">{label}</div>
      <div className="lf-kpi-value">{fmtNumber(value)}</div>
      <div className="lf-kpi-footer">
        <span className={cls}>
          {variation > 0 ? '↑' : variation < 0 ? '↓' : '→'}{' '}
          {Math.abs(variation).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
          })}
          %
        </span>
        <span>vs. período anterior</span>
      </div>
    </Card>
  );
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  onPage,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="lf-pagination">
      <span>
        {fmtNumber(totalElements)} registro{totalElements === 1 ? '' : 's'}
      </span>
      <span className="spacer" />
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 0}
        onClick={() => onPage(page - 1)}
      >
        Anterior
      </Button>
      <span>
        Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onPage(page + 1)}
      >
        Próxima
      </Button>
    </div>
  );
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'md',
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="lf-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`lf-modal ${
          size === 'sm' ? 'lf-modal-sm' : size === 'lg' ? 'lf-modal-lg' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="lf-modal-header">
          <div style={{ flex: 1 }}>
            <h2 className="lf-modal-title">{title}</h2>
            {description && <p className="lf-modal-description">{description}</p>}
          </div>
          <IconButton label="Fechar" onClick={onClose}>
            ×
          </IconButton>
        </div>
        <div className="lf-modal-body">{children}</div>
        {footer && <div className="lf-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  title,
  description,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="lf-drawer-backdrop" onClick={onClose} />
      <aside
        className="lf-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="lf-drawer-header">
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <h2 className="lf-modal-title">{title}</h2>
              {description && <p className="lf-modal-description">{description}</p>}
            </div>
            <IconButton label="Fechar" onClick={onClose}>
              ×
            </IconButton>
          </div>
        </div>
        <div className="lf-drawer-body">{children}</div>
        {footer && <div className="lf-drawer-footer">{footer}</div>}
      </aside>
    </>
  );
}

type Toast = {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
};

const ToastContext = createContext<{
  push: (type: Toast['type'], title: string, message?: string) => void;
}>({
  push: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback(
    (type: Toast['type'], title: string, message?: string) => {
      const id = Date.now() + Math.random();
      setItems((current) => [...current, { id, type, title, message }]);
      setTimeout(
        () => setItems((current) => current.filter((item) => item.id !== id)),
        type === 'error' ? 7000 : 4500,
      );
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="lf-toast-stack" aria-live="polite">
        {items.map((toast) => (
          <div key={toast.id} className={`lf-toast ${toast.type}`}>
            <div className="lf-toast-title">{toast.title}</div>
            {toast.message && (
              <div className="lf-toast-message">{toast.message}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
