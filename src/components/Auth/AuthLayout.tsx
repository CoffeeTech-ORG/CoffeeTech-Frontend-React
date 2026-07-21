import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../Logo/Logo';
import { LanguageSelector } from '../LanguageSelector';
import { useI18n } from '../../contexts/I18nContext';
import { AUTH_STACKED, useMediaQuery } from '../../hooks/useMediaQuery';
import './Auth.scss';

interface AuthLayoutProps {
  /** The form heading: "welcome back" or "create your account". */
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: React.ReactNode;
  /** The footer offering the other screen (register from sign-in, and vice versa). */
  footer: React.ReactNode;
}

/**
 * The shell for sign-in and register. Two even columns, brand on the left, form on the right. The
 * brand panel keeps THREE zones with `space-between` -- identity, promise, and a reserved third
 * zone -- for its balance; the third is left empty but kept, because with only two children
 * `space-between` pushes the promise against the bottom.
 *
 * The language selector lives here, from `components/LanguageSelector`, so that someone who opens
 * the app in the wrong language can change it before signing in -- the top bar is behind sign-in.
 * On mobile the brand becomes a top strip and the selector goes INSIDE it, rather than floating in
 * a corner of the white panel.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  onBack,
  children,
  footer,
}) => {
  const { t } = useI18n();
  // The same breakpoint `Auth.scss` uses. See `AUTH_STACKED`.
  const stacked = useMediaQuery(AUTH_STACKED);

  return (
    <div className="auth">
      <aside className="auth__brand">
        {/* Velo de rayas diagonales del prototipo: rompe el plano del degradado sin llamar la
            atención. Decorativo, así que no se anuncia. */}
        <span className="auth__veil" aria-hidden="true" />

        {/* Con el nombre: ésta es la única pantalla donde la aplicación tiene que decir cómo se
            llama, porque todavía no hay barra superior que lo diga. */}
        <div className="auth__identity">
          <Logo size="large" withName />
        </div>

        <div className="auth__promise">
          {/* La promesa del producto en una línea, en la serif de titulares por lo mismo que los
              veredictos: es lo que la aplicación afirma. */}
          <p className="auth__slogan">{t('auth.slogan')}</p>
          <p className="auth__pitch">{t('auth.pitch')}</p>
        </div>

        {stacked && (
          <div className="auth__lang auth__lang--onBrand">
            <LanguageSelector tone="dark" />
          </div>
        )}
      </aside>

      <main className="auth__panel">
        {onBack && (
          <button type="button" className="auth__back" onClick={onBack} aria-label={t('common.back')}>
            <ArrowLeft size={18} />
          </button>
        )}

        {!stacked && (
          <div className="auth__lang">
            <LanguageSelector tone="light" />
          </div>
        )}

        <div className="auth__form-area">
          <header className="auth__intro">
            <h1 className="auth__title">{title}</h1>
            <p className="auth__subtitle">{subtitle}</p>
          </header>

          {children}

          {/* Justo debajo del botón, no al fondo de la pantalla: quien no tiene cuenta lo descubre
              donde acaba de mirar, sin recorrer el resto de la vista. */}
          <footer className="auth__footer">{footer}</footer>
        </div>
      </main>
    </div>
  );
};
