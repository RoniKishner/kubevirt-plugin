import React, { FC, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';

import DataVolumeModel from '@kubevirt-ui/kubevirt-api/console/models/DataVolumeModel';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1beta1DataVolume } from '@kubevirt-ui/kubevirt-api/containerized-data-importer/models';
import { IoK8sApiCoreV1PersistentVolumeClaim } from '@kubevirt-ui/kubevirt-api/kubernetes';
import {
  V1beta1VirtualMachineSnapshot,
  V1VirtualMachine,
} from '@kubevirt-ui/kubevirt-api/kubevirt';
import ConfirmActionMessage from '@kubevirt-utils/components/ConfirmActionMessage/ConfirmActionMessage';
import { GracePeriodInput } from '@kubevirt-utils/components/GracePeriodInput/GracePeriodInput';
import TabModal from '@kubevirt-utils/components/TabModal/TabModal';
import { ALL_NAMESPACES_SESSION_KEY } from '@kubevirt-utils/hooks/constants';
import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import { buildOwnerReference } from '@kubevirt-utils/resources/shared';
import { getCluster } from '@multicluster/helpers/selectors';
import { kubevirtK8sDelete } from '@multicluster/k8sRequests';
import { getVMListNamespacesURL, getVMListURL } from '@multicluster/urls';
import { useLastNamespace } from '@openshift-console/dynamic-plugin-sdk-internal';
import { ButtonVariant, Stack, StackItem } from '@patternfly/react-core';
import { deselectVM, isVMSelected } from '@virtualmachines/list/selectedVMs';

import DeleteOwnedResourcesMessage from './components/DeleteOwnedResourcesMessage';
import useDeleteVMResources from './hooks/useDeleteVMResources';
import {
  deleteSecrets,
  removeDataVolumeTemplatesToVM,
  updateSnapshotResources,
  updateVolumeResources,
} from './utils/helpers';
import { DEFAULT_GRACE_PERIOD } from './constants';

type DeleteVMModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vm: V1VirtualMachine;
};

const DeleteVMModal: FC<DeleteVMModalProps> = ({ isOpen, onClose, vm }) => {
  const { t } = useKubevirtTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [gracePeriodCheckbox, setGracePeriodCheckbox] = useState<boolean>(false);
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState<number>(
    vm?.spec?.template?.spec?.terminationGracePeriodSeconds || DEFAULT_GRACE_PERIOD,
  );

  const [volumesToSave, setVolumesToSave] = useState<
    (IoK8sApiCoreV1PersistentVolumeClaim | V1beta1DataVolume)[]
  >([]);

  const [snapshotsToSave, setSnapshotsToSave] = useState<V1beta1VirtualMachineSnapshot[]>([]);

  const { dataVolumes, loaded, pvcs, secrets, snapshots } = useDeleteVMResources(vm);
  const [lastNamespace] = useLastNamespace();

  const onDelete = async (updatedVM: V1VirtualMachine) => {
    const vmOwnerRef = buildOwnerReference(updatedVM);

    await removeDataVolumeTemplatesToVM(
      vm,
      volumesToSave.filter((volume) => volume.kind === DataVolumeModel.kind) as V1beta1DataVolume[],
    );

    await Promise.allSettled(updateVolumeResources(volumesToSave, vmOwnerRef));

    await Promise.allSettled(updateSnapshotResources(snapshotsToSave, vmOwnerRef));

    await Promise.allSettled(deleteSecrets(secrets));

    await kubevirtK8sDelete({
      cluster: getCluster(updatedVM),
      json: gracePeriodCheckbox
        ? { apiVersion: 'v1', gracePeriodSeconds, kind: 'DeleteOptions' }
        : null,
      model: VirtualMachineModel,
      resource: updatedVM,
    });

    if (isVMSelected(updatedVM)) {
      deselectVM(updatedVM);
    }

    if (!location.pathname.endsWith('/search')) {
      const cluster = getCluster(vm);
      const vmListURL =
        lastNamespace === ALL_NAMESPACES_SESSION_KEY
          ? getVMListURL(cluster)
          : getVMListNamespacesURL(cluster, lastNamespace);

      navigate(`${vmListURL}${location.search}${location.hash}`);
    }
  };

  return (
    <TabModal<V1VirtualMachine>
      headerText={t('Delete VirtualMachine?')}
      isOpen={isOpen}
      obj={vm}
      onClose={onClose}
      onSubmit={onDelete}
      submitBtnText={t('Delete')}
      submitBtnVariant={ButtonVariant.danger}
      titleIconVariant="warning"
    >
      <Stack hasGutter>
        <StackItem>
          <ConfirmActionMessage obj={vm} />
        </StackItem>
        <GracePeriodInput
          gracePeriodSeconds={gracePeriodSeconds}
          isChecked={gracePeriodCheckbox}
          onCheckboxChange={setGracePeriodCheckbox}
          setGracePeriodSeconds={setGracePeriodSeconds}
        />
        <DeleteOwnedResourcesMessage
          dataVolumes={dataVolumes}
          loaded={loaded}
          pvcs={pvcs}
          setSnapshotsToSave={setSnapshotsToSave}
          setVolumesToSave={setVolumesToSave}
          snapshots={snapshots}
          snapshotsToSave={snapshotsToSave}
          volumesToSave={volumesToSave}
        />
      </Stack>
    </TabModal>
  );
};

export default DeleteVMModal;
