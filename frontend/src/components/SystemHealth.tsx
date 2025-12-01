import { useEffect, useState } from 'react';
import api, { type SystemMetrics } from '../services/api';

const SystemHealth = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const intervalId: number = window.setInterval(async () => {
      if (!isMounted) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getSystemMetrics();
        if (!isMounted) return;
        setMetrics(data);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load system metrics';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }, 5000);

    // initial fetch
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getSystemMetrics();
        if (!isMounted) return;
        setMetrics(data);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load system metrics';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const tiles = metrics
    ? [
        {
          label: 'CPU Usage',
          value: `${metrics.cpu_usage.toFixed(1)}%`,
        },
        {
          label: 'Memory Used',
          value: `${metrics.memory.percent.toFixed(1)}%`,
        },
        {
          label: 'Disk Used',
          value: `${metrics.disk.percent.toFixed(1)}%`,
        },
        {
          label: 'DB Latency',
          value: `${metrics.db_latency_ms.toFixed(2)} ms`,
        },
        {
          label: 'Error Rate',
          value: `${(metrics.error_rate * 100).toFixed(1)}%`,
        },
        {
          label: 'Queue Length',
          value: String(metrics.queue_length),
        },
      ]
    : [];

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          System Health
        </h3>
        {loading && (
          <span className="text-xs text-text-secondary">Refreshing...</span>
        )}
      </div>
      {error && (
        <div className="mb-3 text-xs text-red-500">
          {error}
        </div>
      )}
      {!metrics && !loading && !error && (
        <div className="text-sm text-text-secondary">No data available</div>
      )}
      {metrics && (
        <div className="grid grid-cols-2 gap-2">
          {tiles.map((metric) => (
            <div
              key={metric.label}
              className="border border-default rounded p-2 text-center flex flex-col items-center justify-center bg-gray-50"
            >
              <div className="font-bold text-text-primary text-base">
                {metric.value}
              </div>
              <div className="text-xs text-text-secondary uppercase mt-1">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
