
FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn pydantic prometheus-fastapi-instrumentator opentelemetry-sdk opentelemetry-exporter-otlp
COPY . /app
RUN if [ -f pyproject.toml ]; then pip install --no-cache-dir -e .; fi
ENV PYTHONPATH=/app/src:/app
EXPOSE 8001
CMD ["python", "-m", "crypto_quant_ai.api_service"]
