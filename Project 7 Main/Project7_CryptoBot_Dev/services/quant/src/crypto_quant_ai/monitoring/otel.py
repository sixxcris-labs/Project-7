
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

def init_tracer(service_name: str, otlp_endpoint: str = "http://otel-collector:4318/v1/traces"):
    provider = TracerProvider()
    trace.set_tracer_provider(provider)
    processor = SimpleSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint))
    provider.add_span_processor(processor)
    return trace.get_tracer(service_name)
