FROM python:3.11.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FARMEASE_DOWNLOAD_MODELS=false

WORKDIR /app
COPY ml-service/requirements.txt ./
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt
COPY ml-service/ ./

EXPOSE 10000
RUN chmod +x start.sh
CMD ["./start.sh"]
