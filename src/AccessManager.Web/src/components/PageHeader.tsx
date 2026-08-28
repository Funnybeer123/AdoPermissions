import type { ReactNode } from 'react';
import { Body1, Title2 } from '@fluentui/react-components';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <Title2 as="h1">{title}</Title2>
        {description ? <Body1 className="page-description">{description}</Body1> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
