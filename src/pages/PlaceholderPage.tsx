import { ButtonLink } from '../components/ui/Button';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

/** Temporary page for routes whose features are built in later phases. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>
      <ButtonLink to="/" variant="secondary">
        Back to Home
      </ButtonLink>
    </section>
  );
}
