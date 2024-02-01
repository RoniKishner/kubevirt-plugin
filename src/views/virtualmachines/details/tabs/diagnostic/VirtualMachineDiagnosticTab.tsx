import React, { FC } from 'react';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';

import useDiagnosticData from './hooks/useDianosticData';
import VirtualMachineDiagnosticTabConditions from './tables/VirtualMachineDiagnosticTabConditions';
import VirtualMachineDiagnosticTabVolumeStatus from './tables/VirtualMachineDiagnosticTabVolumeStatus';

import './virtual-machine-diagnostic-tab.scss';

type VirtualMachineDiagnosticTabProps = {
  obj: V1VirtualMachine;
};

const VirtualMachineDiagnosticTab: FC<VirtualMachineDiagnosticTabProps> = ({ obj: vm }) => {
  const { conditions, volumeSnapshotStatuses } = useDiagnosticData(vm);

  return (
    <>
      <VirtualMachineDiagnosticTabConditions conditions={conditions} />
      <VirtualMachineDiagnosticTabVolumeStatus volumeSnapshotStatuses={volumeSnapshotStatuses} />
    </>
  );
};

export default VirtualMachineDiagnosticTab;
