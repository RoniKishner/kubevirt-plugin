import produce from 'immer';

import { ProcessedTemplatesModel, V1Template } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { DEFAULT_NAMESPACE } from '@kubevirt-utils/constants/constants';
import {
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
  replaceTemplateVM,
} from '@kubevirt-utils/resources/template';
import { getTemplateVirtualMachineObject } from '@kubevirt-utils/resources/template/utils/selectors';
import { k8sCreate, K8sModel } from '@openshift-console/dynamic-plugin-sdk';

import { createMultipleResources } from './utils';

type QuickCreateVMType = (inputs: {
  template: V1Template;
  models: { [key: string]: K8sModel };
  overrides: {
    namespace: string;
    name: string;
    startVM: boolean;
  };
}) => Promise<V1VirtualMachine>;

export const quickCreateVM: QuickCreateVMType = async ({
  template,
  models,
  overrides: { namespace = DEFAULT_NAMESPACE, name, startVM },
}) => {
  const processedTemplate = await k8sCreate<V1Template>({
    model: ProcessedTemplatesModel,
    data: { ...template, metadata: { ...template?.metadata, namespace } },
    ns: namespace,
    queryParams: {
      dryRun: 'All',
    },
  });

  const vm = getTemplateVirtualMachineObject(processedTemplate);

  const overridedVM = produce(vm, (draftVM) => {
    draftVM.metadata.namespace = namespace;
    draftVM.metadata.name = name;

    draftVM.metadata.labels[LABEL_USED_TEMPLATE_NAME] = processedTemplate.metadata.name;
    draftVM.metadata.labels[LABEL_USED_TEMPLATE_NAMESPACE] = template.metadata.namespace;
    if (startVM) {
      draftVM.spec.running = true;
    }
  });

  const { objects } = replaceTemplateVM(processedTemplate, overridedVM);

  const createdObjects = await createMultipleResources(objects, models, namespace);

  const createdVM = createdObjects.find(
    (object) => object.kind === VirtualMachineModel.kind,
  ) as V1VirtualMachine;

  return createdVM;
};
