
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function startOtel() {
  const url = process.env.OTLP_URL || 'http://otel-collector:4318/v1/traces';
  const exporter = new OTLPTraceExporter({ url });
  const sdk = new NodeSDK({ traceExporter: exporter, instrumentations: [getNodeAutoInstrumentations()] });
  sdk.start();
}
