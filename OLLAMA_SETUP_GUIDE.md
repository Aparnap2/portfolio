# Ollama Setup Guide for Testing & Production

## Environment Configuration

### For Testing/Development (Current Setup)
```env
NODE_ENV=development
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b
```

### For Production
```env
NODE_ENV=production
GOOGLE_API_KEY=your_google_api_key
GEMINI_MODEL_NAME=gemini-2.5-flash
```

## How It Works

The chat API automatically selects the appropriate model based on `NODE_ENV`:

1. **Development Mode** (`NODE_ENV=development`):
   - Uses Ollama with `gemma3:1b` model
   - Connects to `http://localhost:11434`
   - Perfect for local testing without API costs

2. **Production Mode** (`NODE_ENV=production`):
   - Uses Google Generative AI with `gemini-2.5-flash` model
   - Requires valid `GOOGLE_API_KEY`
   - Optimized for production reliability and scalability

## Testing Commands

### Test Ollama Directly
```bash
curl http://localhost:11434/api/generate -d '{"model": "gemma3:1b", "prompt": "Hello, how are you?", "stream": false}'
```

### Test API Integration
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test message"}]}'
```

## Model Fallback Logic

The system includes intelligent fallback:

1. **Primary**: Try configured model (Ollama or Google AI)
2. **Fallback**: If primary fails, automatically switch to the other model
3. **Circuit Breaker**: Prevent cascading failures with timeout protection
4. **Error Recovery**: Automatic reinitialization on connection failures

## Key Features Implemented

✅ **Environment-based model selection**
✅ **Automatic fallback between Ollama and Google AI**
✅ **Proper async/await patterns** (fixed "Cannot read properties of undefined" error)
✅ **Singleton pattern for model reuse**
✅ **Connection testing during initialization**
✅ **Streaming responses with proper error handling**
✅ **Lead extraction and conversation summaries**
✅ **Rate limiting and concurrency control**

## Troubleshooting

### If Ollama doesn't work:
1. Check Docker container: `docker ps | grep ollama`
2. Verify model is pulled: `ollama list`
3. Test direct connection: `curl http://localhost:11434/api/tags`

### If Google AI doesn't work:
1. Verify API key is valid
2. Check model name: `gemini-2.5-flash`
3. Test API quota and billing

### Switching between environments:
```bash
# For testing
export NODE_ENV=development

# For production  
export NODE_ENV=production