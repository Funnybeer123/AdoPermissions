import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function NotFoundPage() {
  return (
    <section>
      <PageHeader title="Not found" description="That route is not part of the Access Manager shell." />
      <p>
        Return to the <Link to="/">access overview</Link>.
      </p>
    </section>
  );
}
