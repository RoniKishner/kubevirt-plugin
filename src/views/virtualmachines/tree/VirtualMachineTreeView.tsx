import React, { CSSProperties, FC, useMemo } from 'react';

import useIsSmallScreen from '@kubevirt-utils/hooks/useIsSmallScreen';
import useLocalStorage from '@kubevirt-utils/hooks/useLocalStorage';
import { getContentScrollableElement } from '@kubevirt-utils/utils/utils';
import { OnFilterChange } from '@openshift-console/dynamic-plugin-sdk';
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
} from '@patternfly/react-core';

import { useHideNamespaceBar } from '../hooks/useHideNamespaceBar';

import TreeViewContent from './components/TreeViewContent';
import { UseTreeViewData } from './hooks/useTreeViewData';
import useTreeViewSelect from './hooks/useTreeViewSelect';
import {
  CLOSED_DRAWER_SIZE,
  HIDE,
  OPEN_DRAWER_SIZE,
  PANEL_WIDTH_PROPERTY,
  SHOW,
  SHOW_TREE_VIEW,
  TREE_VIEW_LAST_WIDTH,
  TREE_VIEW_PANEL_ID,
} from './utils/constants';

import './VirtualMachineTreeView.scss';

type VirtualMachineTreeViewProps = {
  onFilterChange?: OnFilterChange;
} & UseTreeViewData;

const VirtualMachineTreeView: FC<VirtualMachineTreeViewProps> = ({
  children,
  hideSwitch,
  loaded,
  loadError,
  onFilterChange,
  treeData,
}) => {
  const isSmallScreen = useIsSmallScreen();

  const [drawerWidth, setDrawerWidth] = useLocalStorage(TREE_VIEW_LAST_WIDTH, OPEN_DRAWER_SIZE);
  const [drawerOpen, setDrawerOpen] = useLocalStorage(SHOW_TREE_VIEW, SHOW);

  const [selected, onSelect] = useTreeViewSelect(onFilterChange);

  const isOpen = useMemo(() => drawerOpen === SHOW, [drawerOpen]);
  useHideNamespaceBar();

  if (loadError) return <>{children}</>;

  const toggleDrawer = () => {
    const toggleOpen = !isOpen;
    setDrawerOpen(toggleOpen ? SHOW : HIDE);

    const drawerPanel = document.getElementById(TREE_VIEW_PANEL_ID);
    const size = toggleOpen ? OPEN_DRAWER_SIZE : CLOSED_DRAWER_SIZE;
    drawerPanel.style.setProperty(PANEL_WIDTH_PROPERTY, size);
    setDrawerWidth(size);
  };

  const heightStyles: CSSProperties = {
    height: getContentScrollableElement().offsetHeight || 0,
  };

  const widthStyles: any = {
    [PANEL_WIDTH_PROPERTY]: drawerWidth,
  };

  const styles = { ...widthStyles, ...heightStyles } as CSSProperties;

  const treeView = (
    <TreeViewContent
      hideSwitch={hideSwitch}
      isOpen={isOpen}
      isSmallScreen={isSmallScreen}
      loaded={loaded}
      onSelect={onSelect}
      selectedTreeItem={selected}
      toggleDrawer={toggleDrawer}
      treeData={treeData}
    />
  );

  return (
    <>
      {isSmallScreen && treeView}
      <Drawer data-test="vms-treeview" isExpanded={!isSmallScreen} isInline position="start">
        <DrawerContent
          panelContent={
            <DrawerPanelContent
              className="vms-tree-view"
              id={TREE_VIEW_PANEL_ID}
              isResizable={isOpen}
              onResize={(_, width: number) => setDrawerWidth(`${String(width)}px`)}
              style={styles}
            >
              {treeView}
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody style={heightStyles}>{children}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default VirtualMachineTreeView;
