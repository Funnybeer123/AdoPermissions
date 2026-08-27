import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { AccessNode } from '../api/types';
import { EffectBadge, SourceBadge } from './SourceBadge';

function collectIds(nodes: AccessNode[], into: string[] = []): string[] {
  for (const node of nodes) {
    if (node.children?.length) {
      into.push(node.id);
      collectIds(node.children, into);
    }
  }
  return into;
}

export function AccessTree({ nodes, label }: { nodes: AccessNode[]; label: string }) {
  const treeId = useId();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectIds(nodes)));

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="access-tree" role="tree" aria-label={label} id={treeId}>
      {nodes.map((node) => (
        <AccessTreeItem key={node.id} node={node} depth={0} expanded={expanded} onToggle={toggle} />
      ))}
    </div>
  );
}

function AccessTreeItem({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: AccessNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isOpen = expanded.has(node.id);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (hasChildren) {
        onToggle(node.id);
      }
    }
    if (event.key === 'ArrowRight' && hasChildren && !isOpen) {
      event.preventDefault();
      onToggle(node.id);
    }
    if (event.key === 'ArrowLeft' && hasChildren && isOpen) {
      event.preventDefault();
      onToggle(node.id);
    }
  }

  return (
    <div
      className="access-node"
      role="treeitem"
      aria-expanded={hasChildren ? isOpen : undefined}
      aria-level={depth + 1}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ paddingLeft: `${depth * 18 + 8}px` }}
    >
      <div className="access-node-row">
        {hasChildren ? (
          <button
            type="button"
            className="tree-toggle"
            aria-label={isOpen ? `Collapse ${node.label}` : `Expand ${node.label}`}
            onClick={() => onToggle(node.id)}
          >
            {isOpen ? '▾' : '▸'}
          </button>
        ) : (
          <span className="tree-toggle spacer" aria-hidden="true">
            •
          </span>
        )}
        <span className="access-node-label">
          {node.label}
          {node.unsupported ? <span className="unsupported-flag"> unsupported fact</span> : null}
        </span>
        {node.source ? <SourceBadge source={node.source} /> : null}
        {node.effect ? <EffectBadge effect={node.effect} /> : null}
      </div>
      {node.explanation || node.via?.length || node.note ? (
        <div className="access-node-meta">
          {node.via?.length ? <p className="via-path">via {node.via.join(' → ')}</p> : null}
          {node.explanation ? <p>{node.explanation}</p> : null}
          {node.note ? <p>{node.note}</p> : null}
        </div>
      ) : null}
      {hasChildren && isOpen
        ? node.children?.map((child) => (
            <AccessTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))
        : null}
    </div>
  );
}
