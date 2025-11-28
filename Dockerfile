# Dockerfile for PsyFi
# Applied Alchemy Labs
# Production-ready container for consciousness field simulation

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml README.md ./

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -e .

# Copy application code
COPY psyfi_core/ ./psyfi_core/
COPY psyfi_api/ ./psyfi_api/
COPY docs/ ./docs/

# Create non-root user
RUN useradd -m -u 1000 psyfi && \
    chown -R psyfi:psyfi /app

USER psyfi

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["uvicorn", "psyfi_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
