#!/bin/bash
# Deploy the OpenAI Realtime voice bridge to Google Cloud Run
# Run this from the functions/ directory
# Usage: bash deploy-cloudrun.sh

set -e

PROJECT_ID="flacroncontrol"
SERVICE_NAME="voice-realtime-bridge"
REGION="us-central1"

echo "Deploying $SERVICE_NAME to Cloud Run..."

gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "OPENAI_API_KEY=$OPENAI_API_KEY" \
  --timeout 3600

echo ""
echo "Deployment complete!"
echo "Update TWILIO_STREAM_URL in your voice webhook to point to:"
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format "value(status.url)"
echo "/media-stream"
