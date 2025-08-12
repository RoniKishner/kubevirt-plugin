export const isConnectionEncrypted = () => window.location.protocol === 'https:';

export const getConsoleBasePath = ({ apiPath = '/api/kubernetes', name, namespace }) =>
  `${apiPath}/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${name}`;

export const sleep = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const readFromClipboard = async () =>
  navigator.clipboard
    .readText()
    // eslint-disable-next-line no-console
    .catch((err) => console.error('Failed to read from clipboard', err));

export const writeToClipboard = async (text: string) =>
  navigator.clipboard
    .writeText(text)
    // eslint-disable-next-line no-console
    .catch((err) => console.error('Failed to write to clipboard', err));
