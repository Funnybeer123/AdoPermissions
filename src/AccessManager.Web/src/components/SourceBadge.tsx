import { Badge } from '@fluentui/react-components';
import type { PermissionEffect, PermissionSource } from '../api/types';

const sourceLabel: Record<PermissionSource, string> = {
  DIRECT: 'DIRECT',
  INHERITED: 'INHERITED',
  GROUP: 'GROUP',
  TEAM: 'TEAM',
  ENTRA_GROUP: 'ENTRA GROUP',
  DENY: 'DENY',
  NOT_SET: 'NOT SET',
  UNKNOWN: 'UNKNOWN',
};

const sourceColor: Record<PermissionSource, 'danger' | 'warning' | 'success' | 'informative' | 'subtle'> = {
  DIRECT: 'warning',
  INHERITED: 'informative',
  GROUP: 'success',
  TEAM: 'informative',
  ENTRA_GROUP: 'informative',
  DENY: 'danger',
  NOT_SET: 'subtle',
  UNKNOWN: 'warning',
};

export function SourceBadge({ source }: { source: PermissionSource }) {
  return (
    <Badge appearance="tint" color={sourceColor[source]} className="source-badge">
      {sourceLabel[source]}
    </Badge>
  );
}

export function EffectBadge({ effect }: { effect: PermissionEffect }) {
  const color =
    effect === 'Allow' ? 'success' : effect === 'Deny' ? 'danger' : effect === 'Unknown' ? 'warning' : 'subtle';
  return (
    <Badge appearance="outline" color={color} className="source-badge">
      {effect}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
}: {
  severity: 'administrative' | 'high' | 'medium' | 'low' | 'info' | 'Low' | 'Medium' | 'High' | 'Administrative';
}) {
  const value = severity.toLowerCase();
  const color =
    value === 'administrative' || value === 'high'
      ? 'danger'
      : value === 'medium'
        ? 'warning'
        : value === 'low'
          ? 'informative'
          : 'subtle';
  return (
    <Badge appearance="filled" color={color} className="source-badge">
      {severity}
    </Badge>
  );
}

export function ClassificationBadge({
  classification,
}: {
  classification: 'SAME' | 'GAINED' | 'LOST' | 'CHANGED' | 'UNKNOWN';
}) {
  const color =
    classification === 'LOST'
      ? 'danger'
      : classification === 'GAINED' || classification === 'CHANGED'
        ? 'warning'
        : classification === 'UNKNOWN'
          ? 'informative'
          : 'success';
  return (
    <Badge appearance="tint" color={color} className="source-badge">
      {classification}
    </Badge>
  );
}
