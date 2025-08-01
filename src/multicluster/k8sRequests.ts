import {
  k8sCreate,
  k8sDelete,
  k8sGet,
  k8sPatch,
  k8sUpdate,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  fleetK8sCreate,
  fleetK8sDelete,
  fleetK8sGet,
  fleetK8sPatch,
  fleetK8sUpdate,
  getFleetK8sAPIPath,
  OptionsCreate,
  OptionsDelete,
  OptionsGet,
  OptionsPatch,
  OptionsUpdate,
} from '@stolostron/multicluster-sdk';

import { BASE_K8S_API_PATH } from './constants';

export const getKubevirtBaseAPIPath = async (cluster?: string) => {
  if (!cluster) return BASE_K8S_API_PATH;

  return await getFleetK8sAPIPath(cluster);
};

export const kubevirtK8sPatch = async <R extends K8sResourceCommon>(
  options: OptionsPatch<R>,
): Promise<R> => {
  if (options?.cluster) {
    const object = await fleetK8sPatch(options);

    if (object) object.cluster = options?.cluster;
    return object;
  }

  return k8sPatch(options);
};

export const kubevirtK8sUpdate = async <R extends K8sResourceCommon>(
  options: OptionsUpdate<R>,
): Promise<R> => {
  if (options?.cluster || options?.data?.cluster) {
    const object = await fleetK8sUpdate(options);

    if (object) object.cluster = options?.cluster || options?.data?.cluster;
    return object;
  }

  return k8sUpdate(options);
};

export const kubevirtK8sGet = async <R extends K8sResourceCommon>(
  options: OptionsGet,
): Promise<R> => {
  if (options?.cluster) {
    const object = await fleetK8sGet<R>(options);

    if (object) {
      object.cluster = options?.cluster;
    }
    return object;
  }

  return k8sGet(options) as Promise<R>;
};

export const kubevirtK8sDelete = async <R extends K8sResourceCommon>(
  options: OptionsDelete<R>,
): Promise<R> => {
  if (options?.cluster || options?.resource?.cluster) {
    const object = await fleetK8sDelete(options);

    if (object) object.cluster = options?.cluster || options?.resource?.cluster;
    return object;
  }

  return k8sDelete(options);
};

export const kubevirtK8sCreate = async <R extends K8sResourceCommon>(
  options: OptionsCreate<R>,
): Promise<R> => {
  if (options?.cluster || options?.data?.cluster) {
    const object = await fleetK8sCreate(options);

    if (object) object.cluster = options?.cluster || options?.data?.cluster;
    return object;
  }

  return k8sCreate(options);
};
