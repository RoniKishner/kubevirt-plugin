import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt/models';
import { ARCHITECTURES } from '@kubevirt-utils/constants/constants';

import { getArchitecture } from './selectors';

export const hasS390xArchitecture = (vm: V1VirtualMachine) =>
  getArchitecture(vm) === ARCHITECTURES.S390X;
