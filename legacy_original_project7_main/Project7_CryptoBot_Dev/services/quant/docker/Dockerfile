FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN pip install -e .
CMD ["python","scripts/run_smoke.py"]
