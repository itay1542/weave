import {callOpVeryUnsafe, NodeOrVoidNode, varNode} from '@wandb/weave/core';
import produce from 'immer';
import React, {memo, useCallback, useMemo} from 'react';
import {Menu, Popup as SemanticPopup} from 'semantic-ui-react';
import styled from 'styled-components';

import {getFullChildPanel} from '../Panel2/ChildPanel';
import {emptyTable} from '../Panel2/PanelTable/tableState';
import {
  addChild,
  ensureDashboard,
  getPath,
  isGroupNode,
  makePanel,
  setPath,
} from '../Panel2/panelTree';
import {OutlinePanelProps} from './Outline';

const Popup = styled(SemanticPopup)`
  &&& {
    padding: 0;
  }
`;

export type OutlineItemMenuPopupProps = Pick<
  OutlinePanelProps,
  `config` | `localConfig` | `path` | `updateConfig` | `updateConfig2`
> & {goBackToOutline?: () => void; trigger: JSX.Element};

const OutlineItemMenuPopupComp: React.FC<OutlineItemMenuPopupProps> = ({
  config,
  localConfig,
  path,
  updateConfig,
  updateConfig2,
  goBackToOutline,
  trigger,
}) => {
  const handleDelete = useCallback(
    (ev: React.MouseEvent) => {
      ev.stopPropagation();

      updateConfig(
        produce(config, draft => {
          let cursor: any = draft;
          const remainingPath = path;
          while (remainingPath.length > 1) {
            const childPath = remainingPath.shift()!; // We'll always have an element to shift off here
            if (cursor.id === 'Group') {
              cursor = cursor.config.items[childPath];
            } else if (cursor.id === 'LabeledItem') {
              cursor = cursor.config[childPath];
            } else {
              throw new Error(
                `Outline delete failed: Cannot traverse config for panel id ${cursor.id}`
              );
            }
          }
          const lastStep = remainingPath.shift() as string;
          if (isGroupNode(cursor)) {
            delete cursor.config.items[lastStep];
            if (cursor.config?.gridConfig != null) {
              // Also remove from panelGrid.
              const index = cursor.config.gridConfig.panels.findIndex(
                p => p.id === lastStep
              );
              cursor.config.gridConfig.panels.splice(index, 1);
            }
          } else if (cursor.id === 'LabeledItem') {
            delete cursor.config[lastStep];
          } else {
            throw new Error(
              `Outline delete failed: Cannot traverse config for panel id ${cursor.id} (path = ${lastStep})`
            );
          }
        })
      );

      goBackToOutline?.();
    },
    [path, config, updateConfig, goBackToOutline]
  );

  const handleUnnest = useCallback(
    (panelPath: string[]) => {
      updateConfig2(oldConfig => {
        oldConfig = getFullChildPanel(oldConfig);
        const targetPanel = getPath(oldConfig, panelPath);
        if (!isGroupNode(targetPanel)) {
          throw new Error('Cannot unnest non-group panel');
        }
        const keys = Object.keys(targetPanel.config.items);
        if (keys.length === 0) {
          throw new Error('Cannot unnest empty group panel');
        }
        return setPath(oldConfig, panelPath, targetPanel.config.items[keys[0]]);
      });

      goBackToOutline?.();
    },
    [updateConfig2, goBackToOutline]
  );
  const handleSplit = useCallback(
    (panelPath: string[]) => {
      updateConfig2(oldConfig => {
        oldConfig = getFullChildPanel(oldConfig);
        const targetPanel = getPath(oldConfig, panelPath);
        const input = targetPanel.input_node;
        const splitPanel = makePanel(
          'Group',
          {
            items: {
              panel0: targetPanel,
              panel1: targetPanel,
            },
            layoutMode: 'vertical',
            equalSize: true,
          },
          input
        );

        return setPath(oldConfig, panelPath, splitPanel);
      });

      goBackToOutline?.();
    },
    [updateConfig2, goBackToOutline]
  );
  const handleAddToQueryBar = useCallback(
    (panelPath: string[]) => {
      updateConfig2(oldConfig => {
        oldConfig = getFullChildPanel(oldConfig);
        const targetPanel = getPath(oldConfig, panelPath);
        const input = targetPanel.input_node;
        const queryPanel = makePanel(
          'Query',
          {tableState: emptyTable()},
          input
        );

        const newTargetExpr = callOpVeryUnsafe('Query-selected', {
          self: varNode('any', 'panel0'),
        }) as NodeOrVoidNode;

        let root = setPath(oldConfig, panelPath, {
          ...targetPanel,
          input_node: newTargetExpr,
        });

        root = ensureDashboard(root);

        console.log('Query panel', queryPanel);

        root = addChild(root, ['sidebar'], queryPanel);

        return root;
      });
    },
    [updateConfig2]
  );
  const menuItems = useMemo(() => {
    const items = [
      {
        key: 'delete',
        content: 'Delete',
        icon: 'trash',
        onClick: handleDelete,
      },
    ];
    if (localConfig.id === 'Group') {
      items.push({
        key: 'unnest',
        content: 'Replace with first child',
        icon: 'level up',
        onClick: () => handleUnnest(path),
      });
    }
    items.push({
      key: 'split',
      content: 'Split',
      icon: 'columns',
      onClick: () => handleSplit(path),
    });
    if (path.find(p => p === 'main') != null && path.length > 1) {
      items.push({
        key: 'queryBar',
        content: 'Send to query bar',
        icon: 'arrow left',
        onClick: () => handleAddToQueryBar(path),
      });
    }
    return items;
  }, [
    handleAddToQueryBar,
    handleDelete,
    handleSplit,
    handleUnnest,
    localConfig.id,
    path,
  ]);

  return (
    <Popup
      basic
      on="click"
      position="bottom left"
      popperModifiers={{
        preventOverflow: {
          // prevent popper from erroneously constraining the popup to the
          // table header
          boundariesElement: 'viewport',
        },
      }}
      trigger={trigger}
      content={
        <Menu compact size="small" items={menuItems} secondary vertical />
      }
    />
  );
};

export const OutlineItemMenuPopup = memo(OutlineItemMenuPopupComp);
