# Use Python 3.11 slim as base image for better performance
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsox-fmt-all \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p uploads && mkdir -p data && chmod 755 uploads && chmod 755 data

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 notefinder && \
    chown -R notefinder:notefinder /app

# Switch to non-root user
USER notefinder

# Expose the port
EXPOSE 8000

# Run the application
CMD ["python", "server.py"]