import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { accessClient } from '../api/client';
import type { SearchHit } from '../api/types';
import { DisconnectedState, EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      return;
    }
    let cancelled = false;
    void accessClient
      .search(query)
      .then((result) => {
        if (!cancelled) {
          setHits(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHits([]);
          setError(err instanceof Error ? err.message : 'Sandbox inventory is not connected');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const visibleHits = query.trim() ? hits : [];
  const emailHit = visibleHits.find(
    (hit) => hit.kind === 'user' && hit.subtitle.toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <section>
      <PageHeader
        title={query ? `Search: ${query}` : 'Search'}
        description="Search users, email, groups, teams, projects, repositories, pipelines, environments, and service connections."
      />
      {emailHit ? (
        <p className="email-jump">
          Email matched <Link to={emailHit.href}>{emailHit.title}</Link>. Open the access graph.
        </p>
      ) : null}
      {error ? (
        <DisconnectedState reason={error} />
      ) : query.trim() && visibleHits.length === 0 ? (
        <EmptyState title="No inventory matches" detail="Search a live display name, email, group, or project from evanbeer." />
      ) : (
        <ul className="search-results">
          {visibleHits.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <Link to={hit.href}>{hit.title}</Link>
              <span className="cell-sub">
                {hit.kind} · {hit.subtitle}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
