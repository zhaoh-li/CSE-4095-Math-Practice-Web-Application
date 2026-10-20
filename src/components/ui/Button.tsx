import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary';

interface StyleOptions {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
}

function buttonClassName({ variant = 'primary', fullWidth, className }: StyleOptions) {
  return [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleOptions;

/** A styled <button> for actions on the current page. */
export function Button({ variant, fullWidth, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClassName({ variant, fullWidth, className })} {...rest} />
  );
}

type ButtonLinkProps = LinkProps & StyleOptions;

/** A link that looks like a button, for moving to another page. */
export function ButtonLink({ variant, fullWidth, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClassName({ variant, fullWidth, className })} {...rest} />;
}
