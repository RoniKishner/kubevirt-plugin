import React, { FC, useMemo } from 'react';

import { V1VirtualMachineInstance } from '@kubevirt-ui/kubevirt-api/kubevirt';
import SubTitleChartLabel from '@kubevirt-utils/components/Charts/ChartLabels/SubTitleChartLabel';
import TitleChartLabel from '@kubevirt-utils/components/Charts/ChartLabels/TitleChartLabel';
import ComponentReady from '@kubevirt-utils/components/Charts/ComponentReady/ComponentReady';
import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import useVMQueries from '@kubevirt-utils/hooks/useVMQueries';
import { getNamespace } from '@kubevirt-utils/resources/shared';
import { getVMIPod } from '@kubevirt-utils/resources/vmi';
import { humanizeCpuCores } from '@kubevirt-utils/utils/humanize.js';
import { getCluster } from '@multicluster/helpers/selectors';
import { K8sResourceCommon, PrometheusEndpoint } from '@openshift-console/dynamic-plugin-sdk';
import { ChartDonutUtilization } from '@patternfly/react-charts/victory';
import { useFleetPrometheusPoll } from '@stolostron/multicluster-sdk';
import useDuration from '@virtualmachines/details/tabs/metrics/hooks/useDuration';

type CPUUtilProps = {
  pods: K8sResourceCommon[];
  vmi: V1VirtualMachineInstance;
};

const CPUUtil: FC<CPUUtilProps> = ({ pods, vmi }) => {
  const { t } = useKubevirtTranslation();
  const vmiPod = useMemo(() => getVMIPod(vmi, pods), [pods, vmi]);
  const { currentTime } = useDuration();

  const queries = useVMQueries(vmi, vmiPod?.metadata?.name);

  const prometheusProps = {
    cluster: getCluster(vmi),
    endpoint: PrometheusEndpoint?.QUERY,
    endTime: currentTime,
    namespace: getNamespace(vmi),
  };

  const [dataCPURequested] = useFleetPrometheusPoll({
    ...prometheusProps,
    query: queries.CPU_REQUESTED,
  });

  const [dataCPUUsage] = useFleetPrometheusPoll({
    ...prometheusProps,
    query: queries?.CPU_USAGE,
  });

  const cpuUsage = humanizeCpuCores(+dataCPUUsage?.data?.result?.[0]?.value?.[1]).value;
  const cpuRequested = humanizeCpuCores(+dataCPURequested?.data?.result?.[0]?.value?.[1]).value;
  const averageCPUUsage = (cpuUsage / cpuRequested) * 100;
  const isReady = !Number.isNaN(cpuUsage) && !Number.isNaN(cpuRequested);

  return (
    <div className="util">
      <div className="util-upper">
        <div className="util-title">{t('CPU')}</div>
        <div className="util-summary" data-test-id="util-summary-cpu">
          <div className="util-summary-value">{`${isReady ? cpuUsage?.toFixed(2) : 0}m`}</div>
          <div className="util-summary-text pf-v6-u-text-color-subtle">
            <div>{t('Requested of ')}</div>
            <div>{`${isReady ? cpuRequested?.toFixed(2) : 0}m`}</div>
          </div>
        </div>
      </div>
      <div className="util-chart">
        <ComponentReady isReady={isReady}>
          <ChartDonutUtilization
            data={{
              x: t('CPU used'),
              y: (averageCPUUsage > 100 ? 100 : averageCPUUsage) || 0,
            }}
            animate
            constrainToVisibleArea
            labels={({ datum }) => (datum.x ? `${datum.x}: ${(cpuUsage || 0)?.toFixed(2)}m` : null)}
            style={{ labels: { fontSize: 20 } }}
            subTitle={t('Used')}
            subTitleComponent={<SubTitleChartLabel y={135} />}
            title={`${averageCPUUsage.toFixed(2) || 0}%`}
            titleComponent={<TitleChartLabel />}
          />
        </ComponentReady>
      </div>
    </div>
  );
};

export default CPUUtil;
