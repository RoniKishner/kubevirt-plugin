import { CAPACITY_UNITS } from '@kubevirt-utils/components/CapacityInput/utils';
import { NumberOperator } from '@kubevirt-utils/utils/constants';

export type AdvancedSearchInputs = Partial<{
  clusters: string[];
  dateCreatedFrom: string;
  dateCreatedTo: string;
  description: string;
  ip: string;
  labelInputText: string;
  labels: string[];
  memory: {
    operator: NumberOperator;
    unit: CAPACITY_UNITS;
    value: number;
  };
  name: string;
  projects: string[];
  vCPU: {
    operator: NumberOperator;
    value: number;
  };
}>;

export type SearchSuggestResult = {
  resources: { cluster?: string; name: string; namespace?: string }[];
  resourcesMatching: Record<'description' | 'ip' | 'labels', number>;
};
