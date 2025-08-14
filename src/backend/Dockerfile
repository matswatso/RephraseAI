# src/backend/Dockerfile
FROM python:3.11-slim

# (optional) tools so pip can build wheels if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

#install the dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copies all backend code
COPY . .

# flask port
EXPOSE 5000

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "server:app"]
