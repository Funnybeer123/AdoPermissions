import { Body1 } from '@fluentui/react-components';

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="empty-state" role="status">
      <strong>{title}</strong>
      {detail ? <Body1>{detail}</Body1> : null}
    </div>
  );
}

export function DisconnectedState({ reason }: { reason?: string }) {
  return (
    <EmptyState
      title="evanbeer is not connected"
      detail={
        reason
          ? `${reason}. Add a short-lived AZURE_DEVOPS_PAT environment secret. Azure DevOps users must already exist as Microsoft identities.`
          : 'Add a short-lived AZURE_DEVOPS_PAT environment secret to inventory the evanbeer organization. Stakeholder seats cannot be invented.'
      }
    />
  );
}
