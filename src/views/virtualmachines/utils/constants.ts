import { STATIC_SEARCH_FILTERS } from '@kubevirt-utils/components/ListPageFilter/constants';

export const OBJECTS_FETCHING_LIMIT = 10000;

export const booleanTextIds = {
  no: 'no',
  yes: 'yes',
};

export enum VirtualMachineRowFilterType {
  Cluster = 'cluster',
  CPU = 'cpu',
  DateCreatedFrom = 'dateCreatedFrom',
  DateCreatedTo = 'dateCreatedTo',
  Description = 'description',
  InstanceType = 'instanceType',
  IP = 'ip',
  LiveMigratable = 'live-migratable',
  Memory = 'memory',
  Node = 'node',
  OS = 'os',
  Project = 'project',
  Status = 'status',
  StorageClassName = 'storageclassname',
  Template = 'template',
}

export const validSearchQueryParams: string[] = [
  STATIC_SEARCH_FILTERS.name,
  STATIC_SEARCH_FILTERS.labels,
  VirtualMachineRowFilterType.Description,
  VirtualMachineRowFilterType.Project,
  VirtualMachineRowFilterType.IP,
  VirtualMachineRowFilterType.DateCreatedFrom,
  VirtualMachineRowFilterType.DateCreatedTo,
  VirtualMachineRowFilterType.CPU,
  VirtualMachineRowFilterType.Memory,
  VirtualMachineRowFilterType.Cluster,
];
