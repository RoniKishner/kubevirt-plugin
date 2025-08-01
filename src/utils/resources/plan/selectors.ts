import { V1beta1Plan } from '@kubev2v/types';

export const getTargetCluster = (plan: V1beta1Plan) => plan?.spec?.provider?.destination?.name;

export const getTargetNamespace = (plan: V1beta1Plan) => plan?.spec?.targetNamespace;
