#!/bin/bash

set -e

export ON_CI="ON_CI"
download_virtctl()
{
  #VIRTCTL_LATEST=$(curl -fsSL -H 'Accept: application/json' https://github.com/kubevirt/kubevirt/releases/latest | jq -r '.tag_name' | tr -d 'v')
  VIRTCTL_DOWNLOAD_URL="https://github.com/kubevirt/kubevirt/releases/download/${VIRTCTL_VERSION}/virtctl-${VIRTCTL_VERSION}"
  VIRTCTL_X86_64="${VIRTCTL_DOWNLOAD_URL}-linux-x86_64"
  VIRTCTL_AMD64="${VIRTCTL_DOWNLOAD_URL}-linux-amd64"

  # Install virtctl binary and add to PATH
  mkdir virtctl

  # --quiet as wget logs an URL that should not be logged since it provides access to download a file (it is a presigned URL)
  wget ${VIRTCTL_AMD64} -O virtctl/virtctl --quiet || wget ${VIRTCTL_X86_64} -O virtctl/virtctl --quiet
  [[ ! -f "virtctl/virtctl" ]] && echo "ERROR: virtctl binary is unavailable for download" && exit 1

  chmod +x virtctl/virtctl

  export PATH="${PATH}:$(pwd)/virtctl"
}
# ----------------------------------------------------------------------------------------------------
# Install HCO (kubevirt and helper operators)

export HCO_IMAGE_VER=${HCO_IMAGE_VER:-"1.14.0-unstable"}
export HCO_GIT_TAG=${HCO_GIT_TAG:-"main"}
export HCO_SUBSCRIPTION_CHANNEL=${HCO_SUBSCRIPTION_CHANNEL:-"candidate-v1.14"}
export VIRTCTL_VERSION="v1.4.0"
export HPP_VERSION="release-v0.21"


tee <<EOF | oc apply -f -
apiVersion: operators.coreos.com/v1alpha1
kind: CatalogSource
metadata:
  name: hco-unstable-catalog-source
  namespace: openshift-marketplace
spec:
  sourceType: grpc
  image: quay.io/kubevirt/hyperconverged-cluster-index:${HCO_IMAGE_VER}
  displayName: Kubevirt Hyperconverged Cluster Operator
  publisher: Kubevirt Project
EOF

tee <<EOF | oc apply -f -
apiVersion: v1
kind: Namespace
metadata:
    name: kubevirt-hyperconverged
---
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
    name: kubevirt-hyperconverged-group
    namespace: kubevirt-hyperconverged
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
    name: hco-operatorhub
    namespace: kubevirt-hyperconverged
spec:
    source: hco-unstable-catalog-source
    sourceNamespace: openshift-marketplace
    name: community-kubevirt-hyperconverged
    channel: ${HCO_SUBSCRIPTION_CHANNEL}
    config:
        selector:
          matchLabels:
            name: hyperconverged-cluster-operator
        env:
        - name: KVM_EMULATION
          value: "true"
EOF

# wait for install plan and pods to be created
sleep 90

# Wait for hco deployments to be ready
oc wait deployments \
  --selector="operators.coreos.com/community-kubevirt-hyperconverged.kubevirt-hyperconverged" \
  --namespace=kubevirt-hyperconverged \
  --for=condition=Available \
  --timeout=10m

# Wait for HCO CR to be created
export hco_cr_is_created="false"

for i in {1..20}
do
  echo "Attempt ${i}/20"
  if oc apply -f ./cypress/fixtures/hco.yaml; then
    echo "HCO cr is created"
    export hco_cr_is_created="true"
    break
  fi
  sleep 30
done

if [[ "$hco_cr_is_created" == "false" ]]; then
  echo "Error: HCO CR didn't get created!!"
  exit 1
fi

# Wait for HCO to report it is available
oc wait -n kubevirt-hyperconverged hyperconverged kubevirt-hyperconverged  \
  --for=condition=Available \
  --timeout=15m

# ----------------------------------------------------------------------------------------------------
# Create storage class and storage namespace for testing
# Install HPP

# Deploy HPP CR
oc create -f \
  https://raw.githubusercontent.com/kubevirt/hostpath-provisioner-operator/${HPP_VERSION}/deploy/hostpathprovisioner_cr.yaml

# Create HPP StorageClass
oc create -f \
  https://raw.githubusercontent.com/kubevirt/hostpath-provisioner-operator/${HPP_VERSION}/deploy/storageclass-wffc-csi.yaml

# Set HPP as default StorageClass for the cluster
oc annotate storageclasses --all storageclass.kubernetes.io/is-default-class-
oc annotate storageclass hostpath-csi storageclass.kubernetes.io/is-default-class='true'

# ----------------------------------------------------------------------------------------------------
# Download virtctl tool if needed
command -v virtctl &> /dev/null || download_virtctl

# ----------------------------------------------------------------------------------------------------
# Change console branding
oc patch Console.operator.openshift.io cluster --patch '{ "spec": { "customization": {"brand": "okd" } } }' --type=merge
