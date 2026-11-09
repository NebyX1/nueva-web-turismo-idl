FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 FLASK_ENV=production HOST=0.0.0.0 PORT=5000
WORKDIR /app
COPY backend/requirements-lock.txt backend/requirements-lock.txt
RUN pip install --no-cache-dir -r backend/requirements-lock.txt
COPY backend backend
COPY scripts scripts
COPY data data
RUN python scripts/prepare_models.py
RUN groupadd --gid 10001 gianna && useradd --uid 10001 --gid 10001 --create-home gianna \
    && mkdir -p storage logs && chown -R gianna:gianna storage logs
USER 10001:10001
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/api/ready', timeout=4)"
CMD ["python", "-m", "backend.app.main"]
