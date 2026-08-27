import { Body1 } from '@fluentui/react-components';

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="empty-state" role="status">
      <strong>{title}</strong>
      {detail ? <Body1>{detail}</Body1> : null}
    </div>
  );
}
