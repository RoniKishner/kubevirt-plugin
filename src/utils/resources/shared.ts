import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import {
  V1beta1DataImportCron,
  V1beta1DataSource,
} from '@kubevirt-ui/kubevirt-api/containerized-data-importer/models';
import { V1beta1Condition, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { ALL_NAMESPACES_SESSION_KEY } from '@kubevirt-utils/hooks/constants';
import { TemplateModel } from '@kubevirt-utils/models';
import {
  AccessReviewResourceAttributes,
  K8sModel,
  K8sResourceKind,
  K8sVerb,
  Operator,
  OwnerReference,
  WatchK8sResults,
} from '@openshift-console/dynamic-plugin-sdk';

import { isDataSourceReady } from '../../views/datasources/utils';

import { isEmpty } from './../utils/utils';
import { getDataImportCronFromDataSource } from './bootableresources/helpers';
import {
  isDataSourceCloning,
  isDataSourceUploading,
} from './template/hooks/useVmTemplateSource/utils';
import { TEMPLATE_TYPE_LABEL } from './template';

/**
 * A selector for a resource's description
 * @param {K8sResourceCommon} entity
 * @returns {string} the description for the resource
 */
export const getDescription = (entity: K8sResourceCommon): string =>
  entity?.metadata?.annotations?.description;

/**
 * A selector for a resource's labels
 * @param entity {K8sResourceCommon} - entity to get labels from
 * @param defaultValue {{ [key: string]: string }} - default value to return if no labels are found
 * @returns {{ [key: string]: string }} the labels for the resource
 */
export const getLabels = (
  entity: K8sResourceCommon,
  defaultValue?: { [key: string]: string },
): { [key: string]: string } => entity?.metadata?.labels || defaultValue;

/**
 * A selector for the resource's annotations
 * @param entity {K8sResourceCommon} - entity to get annotations from
 * @param defaultValue {{ [key: string]: string }} - default value to return if no annotations are found
 * @returns {{ [key: string]: string }} the annotations for the resource
 */
export const getAnnotations = (
  entity: K8sResourceCommon,
  defaultValue?: { [key: string]: string },
): { [key: string]: string } => entity?.metadata.annotations || defaultValue;

/**
 * function for getting an entity's annotation
 * @param entity - entity to get annotation from
 * @param annotationName - name of the annotation to get
 * @param defaultValue - default value to return if annotation is not found
 * @returns the annotation value or defaultValue if not found
 */
export const getAnnotation = (
  entity: K8sResourceCommon,
  annotationName: string,
  defaultValue?: string,
): string => entity?.metadata?.annotations?.[annotationName] ?? defaultValue;

/**
 * function for getting an entity's label
 * @param {K8sResourceCommon} entity - entity to get label from
 * @param {string} label - name of the label to get
 * @param {string} defaultValue - default value to return if label is not found
 * @returns the label value or defaultValue if not found
 */
export const getLabel = (entity: K8sResourceCommon, label: string, defaultValue?: string): string =>
  entity?.metadata?.labels?.[label] ?? defaultValue;

type ResourceUrlProps = {
  activeNamespace?: string;
  model: K8sModel;
  resource?: K8sResourceCommon;
};

/**
 * function for getting a resource URL
 * @param {ResourceUrlProps} urlProps - object with model, resource to get the URL from (optional) and active namespace/project name (optional)
 * @returns {string} the URL for the resource
 */
export const getResourceUrl = (urlProps: ResourceUrlProps): string => {
  const { activeNamespace, model, resource } = urlProps;

  if (!model) return null;
  const { crd, namespaced, plural } = model;

  const namespace =
    resource?.metadata?.namespace ||
    (activeNamespace !== ALL_NAMESPACES_SESSION_KEY && activeNamespace);
  const namespaceUrl = namespace ? `ns/${namespace}` : 'all-namespaces';

  const ref = crd ? `${model.apiGroup || 'core'}~${model.apiVersion}~${model.kind}` : plural || '';
  const name = resource?.metadata?.name || '';

  return `/k8s/${namespaced ? namespaceUrl : 'cluster'}/${ref}/${name}`;
};

/**
 * function for getting a condition's reason
 * @param condition - condition to check
 * @returns condition's reason
 */
export const getConditionReason = (condition: V1beta1Condition): string => condition?.reason;

/**
 * function for checking if a condition is true
 * @param condition - condition to check
 * @returns true if condition is true, false otherwise
 */
export const isConditionStatusTrue = (condition: V1beta1Condition): boolean =>
  condition?.status === 'True';

/**
 * A selector for a resource's conditions
 * @param entity - entity to get condition from
 * @returns array of conditions
 */
export const getStatusConditions = (entity): V1beta1Condition[] => entity?.status?.conditions ?? [];

/**
 * A selector for a resource's conditions based on type
 * @param entity - entity to get condition from
 * @param type - type of the condition
 * @returns condition based on type
 */
export const getStatusConditionsByType = (entity, type: string): V1beta1Condition =>
  getStatusConditions(entity)?.find((condition) => condition?.type === type);

/**
 * function for creating a resource's owner reference from a resource
 * @param {K8sResourceCommon} owner resource to create an owner reference from
 * @param opts optional addinional options
 * @param {boolean} opts.blockOwnerDeletion http://kubevirt.io/api-reference/v0.51.0/definitions.html#_k8s_io_apimachinery_pkg_apis_meta_v1_ownerreference
 * @param {boolean} opts.controller http://kubevirt.io/api-reference/v0.51.0/definitions.html#_k8s_io_apimachinery_pkg_apis_meta_v1_ownerreference
 * @returns a resource's owner reference
 */
export const buildOwnerReference = (
  owner: K8sResourceCommon,
  opts: { blockOwnerDeletion?: boolean; controller?: boolean } = { blockOwnerDeletion: true },
): OwnerReference => ({
  apiVersion: owner?.apiVersion,
  blockOwnerDeletion: opts && opts.blockOwnerDeletion,
  controller: opts && opts.controller,
  kind: owner?.kind,
  name: owner?.metadata?.name,
  uid: owner?.metadata?.uid,
});

/**
 * function to compare two OwnerReference objects
 * @param {OwnerReference} obj first object to compare
 * @param {OwnerReference} otherObj second object to compare
 * @returns a boolean indicating if the objects are equal
 */
export const compareOwnerReferences = (obj: OwnerReference, otherObj: OwnerReference): boolean => {
  if (obj === otherObj) {
    return true;
  }
  if (!obj || !otherObj) {
    return false;
  }

  return (
    obj?.uid === otherObj?.uid ||
    obj?.name === otherObj?.name ||
    obj?.apiVersion === otherObj?.apiVersion ||
    obj?.kind === otherObj?.kind
  );
};

/**
 * function to build AccessReviewResourceAttributes from a resource
 * @param model - k8s model
 * @param obj - resource
 * @param verb - verb
 * @param subresource - subresource
 * @returns AccessReviewResourceAttributes
 */
export const asAccessReview = (
  model: K8sModel,
  obj: K8sResourceCommon,
  verb: K8sVerb,
  subresource?: string,
): AccessReviewResourceAttributes => {
  if (!obj) {
    return null;
  }
  return {
    group: model.apiGroup,
    name: obj?.metadata?.name,
    namespace: obj?.metadata?.namespace,
    resource: model.plural,
    subresource,
    verb,
  };
};

/**
 * Provides apiVersion for a k8s model.
 * @param model k8s model
 * @returns The apiVersion for the model i.e `group/version`.
 * */
export const getAPIVersionForModel = (model: K8sModel): string =>
  !model?.apiGroup ? model.apiVersion : `${model.apiGroup}/${model.apiVersion}`;

/**
 * Get vm printable status
 * @date 7/6/2022 - 11:23:32 AM
 *
 * @param {V1VirtualMachine} vm - vm to get status from
 * @returns {*}
 */
export const getVMStatus = (vm: V1VirtualMachine) => vm?.status?.printableStatus;

export const getVMSnapshottingStatus = (vm: V1VirtualMachine) => vm?.status?.snapshotInProgress;

export const getVMRestoringStatus = (vm: V1VirtualMachine) => vm?.status?.restoreInProgress;

/**
 * Get allowed resource for project
 * @date 7/6/2022 - 11:23:32 AM
 *
 * @param {string[]} projectNames - project names
 * @param {K8sModel} model - k8s model
 * @returns {*}
 */
export const getAllowedResources = (projectNames: string[], model: K8sModel) => {
  return Object.fromEntries(
    (projectNames || []).map((projName) => [
      `${projName}/${model.plural}`,
      {
        groupVersionKind: modelToGroupVersionKind(model),
        isList: true,
        namespace: projName,
        namespaced: true,
      },
    ]),
  );
};

/**
 * Get allowed resources data
 * @date 7/6/2022 - 11:23:32 AM
 *
 * @param {WatchK8sResults<{
    [key: string]: K8sResourceCommon[];
  }>} resources - resources
 * @param {K8sModel} model - k8s model
 * @returns {{ data: any; loaded: any; loadError: any; }}
 */
export const getAllowedResourceData = (
  resources: WatchK8sResults<{
    [key: string]: K8sResourceCommon[];
  }>,
  model: K8sModel,
) => {
  const resourcesArray = Object.entries(resources)
    .map(([key, { data, loaded, loadError }]) => {
      if (loaded && key?.includes(model.plural) && !isEmpty(data)) {
        return { data, loaded, loadError };
      }
    })
    .filter(Boolean);

  const resourceData = (resourcesArray || []).map(({ data }) => data).flat();
  const resourceLoaded = (resourcesArray || [])
    .map(({ loaded }) => loaded)
    ?.every((vmLoaded) => vmLoaded);
  const resourceLoadError = (resourcesArray || [])
    .map(({ loadError }) => loadError)
    ?.filter(Boolean)
    ?.join('');
  return { data: resourceData, loaded: resourceLoaded, loadError: resourceLoadError };
};

/**
 * Get allowed templates resources
 * @date 7/6/2022 - 11:23:32 AM
 *
 * @param {string[]} projectNames - project names
 * @returns {*}
 */
export const getAllowedTemplateResources = (projectNames: string[]) => {
  const TemplateModelGroupVersionKind = modelToGroupVersionKind(TemplateModel);
  return Object.fromEntries(
    (projectNames || []).map((projName) => [
      `${projName}/${TemplateModel.plural}`,
      {
        groupVersionKind: TemplateModelGroupVersionKind,
        isList: true,
        namespace: projName,
        selector: {
          matchExpressions: [
            {
              key: TEMPLATE_TYPE_LABEL,
              operator: Operator.Exists,
            },
          ],
        },
      },
    ]),
  );
};

/**
 *
 * @param resource k8s resource
 * @returns resource's name
 */
export const getName = <A extends K8sResourceCommon = K8sResourceCommon>(resource: A) =>
  resource?.metadata?.name;

/**
 *
 * @param resource k8s resource
 * @returns resource's namespace
 */
export const getNamespace = <A extends K8sResourceCommon = K8sResourceCommon>(resource: A) =>
  resource?.metadata?.namespace;

/**
 * function to get a resource's UID
 * @param {A extends K8sResourceCommon} resource the resource whose UID is to be returned
 * @returns {string} the resource's UID
 */
export const getUID = <A extends K8sResourceCommon = K8sResourceCommon>(resource: A): string =>
  resource?.metadata?.uid;

export type ResourceMap<A> = { [name: string]: A };
export type NamespacedResourceMap<A> = { [namespace: string]: ResourceMap<A> };

// Function overloads
export function convertResourceArrayToMap<A extends K8sResourceCommon = K8sResourceCommon>(
  resources: A[],
  isNamespaced: true,
): NamespacedResourceMap<A>;

export function convertResourceArrayToMap<A extends K8sResourceCommon = K8sResourceCommon>(
  resources: A[],
  isNamespaced?: false,
): ResourceMap<A>;

/**
 * convertResourceArrayToMap is a function that takes in an array of
 * K8sResourceCommon objects and an optional boolean value.
 * It returns an object with their metadata name as the key,
 * and the K8sResourceCommon object as the value.
 * If isNamespaced is true, then the name will be a combination of the namespace and name
 * of the K8sResourceCommon object. (for example: objName[namespace][name])
 * Otherwise, it will just be the name of the K8sResourceCommon object. (for example: objName[name])
 * @param {A extends K8sResourceCommon} resources - resources array
 * @param {boolean} isNamespaced - (optional) - a flag to indicate if the resource is namespace-scoped
 */
export function convertResourceArrayToMap<A extends K8sResourceCommon = K8sResourceCommon>(
  resources: A[],
  isNamespaced?: boolean,
): NamespacedResourceMap<A> | ResourceMap<A> {
  return (resources || []).reduce(
    (map, resource) => {
      const { name, namespace } = resource?.metadata || {};
      if (isNamespaced) {
        if (!map[namespace]) map[namespace] = {};
        (map[namespace] as ResourceMap<A>)[name] = resource;
        return map;
      }
      (map as ResourceMap<A>)[name] = resource;
      return map;
    },
    isNamespaced ? ({} as NamespacedResourceMap<A>) : ({} as ResourceMap<A>),
  );
}

/**
 * function to get all V1beta1DataSource objects with condition type 'Ready'and status to be 'True'
 * @param {V1beta1DataSource[]} dataSources list of DataSources to be filtered
 * @returns list of available/ready DataSources
 */
export const getAvailableDataSources = (dataSources: V1beta1DataSource[]): V1beta1DataSource[] =>
  dataSources?.filter((dataSource) => isDataSourceReady(dataSource));

export const isDataImportCronProgressing = (dataImportCron: V1beta1DataImportCron): boolean =>
  dataImportCron?.status?.conditions?.find((condition) => condition.type === 'UpToDate')?.reason ===
  'ImportProgressing';

/**
 * function to get all V1beta1DataSource objects with condition type 'Ready'and status 'True'
 * and/or also those with 'False' status but only 'CloneScheduled' or 'CloneInProgress' reason (cloning of the DS in progress)
 * @param {V1beta1DataSource[]} dataSources list of DataSources to be filtered
 * @param {V1beta1DataImportCron[]} dataImportCrons list of DataImportCrons related to DataSources
 * @returns list of available/ready/cloning DataSources
 */
export const getReadyOrCloningOrUploadingDataSources = (
  dataSources: V1beta1DataSource[],
  dataImportCrons: V1beta1DataImportCron[],
): V1beta1DataSource[] =>
  dataSources?.filter((dataSource) => {
    const dataImportCron = getDataImportCronFromDataSource(dataImportCrons, dataSource);

    return (
      isDataSourceReady(dataSource) ||
      isDataSourceCloning(dataSource) ||
      isDataSourceUploading(dataSource) ||
      isDataImportCronProgressing(dataImportCron)
    );
  });

/**
 *  A selector for the entity's status phase
 * @param {K8sResourceKind} entity - entity to get the status phase from
 * @returns status phase for the entity
 */
export const getStatusPhase = <T = string>(entity: K8sResourceKind): T => entity?.status?.phase;

/**
 * A selector for the entity's creation timestamp
 * @param {K8sResourceCommon} entity - entity to get the creation timestamp from
 * @returns {string} creation timestamp for the entity
 */
export const getCreationTimestamp = (entity: K8sResourceCommon): string =>
  entity?.metadata?.creationTimestamp;
