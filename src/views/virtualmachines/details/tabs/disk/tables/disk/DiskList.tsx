import * as React from 'react';
import { printableVMStatus } from 'src/views/virtualmachines/utils';

import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import DiskModal from '@kubevirt-utils/components/DiskModal/DiskModal';
import { useModal } from '@kubevirt-utils/components/ModalProvider/ModalProvider';
import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import useDisksTableData from '@kubevirt-utils/resources/vm/hooks/disk/useDisksTableData';
import {
  k8sUpdate,
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';

import useDiskColumns from '../../hooks/useDiskColumns';
import useDisksFilters from '../../hooks/useDisksFilters';

import DiskListTitle from './DiskListTitle';
import DiskRow from './DiskRow';

type DiskListProps = {
  vm?: V1VirtualMachine;
};

const DiskList: React.FC<DiskListProps> = ({ vm }) => {
  const { t } = useKubevirtTranslation();
  const { createModal } = useModal();
  const columns = useDiskColumns();
  const [disks, loaded, loadError, vmi] = useDisksTableData(vm);
  const filters = useDisksFilters();
  const [data, filteredData, onFilterChange] = useListPageFilter(disks, filters);
  const headerText =
    vm?.status?.printableStatus === printableVMStatus.Running
      ? t('Add disk (hot plugged)')
      : t('Add disk');

  return (
    <>
      <ListPageBody>
        <ListPageCreateButton
          className="list-page-create-button-margin"
          onClick={() =>
            createModal(({ isOpen, onClose }) => (
              <DiskModal
                vm={vm}
                isOpen={isOpen}
                onClose={onClose}
                headerText={headerText}
                onSubmit={(obj) =>
                  k8sUpdate({
                    model: VirtualMachineModel,
                    data: obj,
                    ns: obj.metadata.namespace,
                    name: obj.metadata.name,
                  })
                }
              />
            ))
          }
        >
          {t('Add disk')}
        </ListPageCreateButton>
        <DiskListTitle />
        <ListPageFilter
          data={data}
          loaded={loaded}
          rowFilters={filters}
          onFilterChange={onFilterChange}
        />
        <VirtualizedTable
          data={filteredData}
          unfilteredData={data}
          loaded={loaded}
          loadError={loadError}
          columns={columns}
          Row={DiskRow}
          rowData={{ vm, vmi }}
        />
      </ListPageBody>
    </>
  );
};

export default DiskList;
