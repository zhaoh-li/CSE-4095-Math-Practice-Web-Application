import { ButtonLink } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>Oops! We couldn't find that page.</p>
      <ButtonLink to="/">Go to Home</ButtonLink>
    </section>
  );
}
