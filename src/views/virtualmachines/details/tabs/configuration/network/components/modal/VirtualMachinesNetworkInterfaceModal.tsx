import React, { FC, useCallback } from 'react';

import {
  V1Interface,
  V1Network,
  V1VirtualMachine,
  V1VirtualMachineInstance,
} from '@kubevirt-ui/kubevirt-api/kubevirt';
import NetworkInterfaceModal from '@kubevirt-utils/components/NetworkInterfaceModal/NetworkInterfaceModal';
import {
  createInterface,
  createNetwork,
  updateVMNetworkInterfaces,
} from '@kubevirt-utils/components/NetworkInterfaceModal/utils/helpers';
import { getInterfaces, getNetworks } from '@kubevirt-utils/resources/vm';

type VirtualMachinesNetworkInterfaceModalProps = {
  headerText: string;
  isOpen: boolean;
  onAddNetworkInterface: (
    updatedNetworks: V1Network[],
    updatedInterfaces: V1Interface[],
  ) => Promise<V1VirtualMachine>;
  onClose: () => void;
  vm: V1VirtualMachine;
  vmi?: V1VirtualMachineInstance;
};

const VirtualMachinesNetworkInterfaceModal: FC<VirtualMachinesNetworkInterfaceModalProps> = ({
  headerText,
  isOpen,
  onAddNetworkInterface,
  onClose,
  vm,
}) => {
  const onSubmit = useCallback(
    ({
        interfaceLinkState,
        interfaceMACAddress,
        interfaceModel,
        interfaceType,
        networkName,
        nicName,
      }) =>
      () => {
        const resultNetwork = createNetwork(nicName, networkName);
        const resultInterface = createInterface({
          interfaceLinkState,
          interfaceMACAddress,
          interfaceModel,
          interfaceType,
          nicName,
        });

        const updatedNetworks: V1Network[] = [...(getNetworks(vm) || []), resultNetwork];
        const updatedInterfaces: V1Interface[] = [...(getInterfaces(vm) || []), resultInterface];
        return onAddNetworkInterface
          ? onAddNetworkInterface(updatedNetworks, updatedInterfaces)
          : updateVMNetworkInterfaces(vm, updatedNetworks, updatedInterfaces);
      },
    [onAddNetworkInterface, vm],
  );

  return (
    <NetworkInterfaceModal
      headerText={headerText}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      vm={vm}
    />
  );
};

export default VirtualMachinesNetworkInterfaceModal;
