# Qwen AI DevOps Project

A containerized AI chat application built around the local **Qwen3.5-0.8B** language model. The project separates the user interface, HTTP gateway, and model inference service into independent Docker services connected through a private Docker network.

## What This Project Does

The application provides a browser-based chat interface. When a user submits a prompt:

1. The Next.js frontend sends the prompt to `/api/chat`.
2. The Express web server validates the request and forwards it to the AI server.
3. The FastAPI AI server formats the prompt with the Qwen chat template and generates a response.
4. The response travels back through the web server to the frontend.

The model runs locally in Docker. Prompts are not sent to a third-party hosted AI API by this project.

## Architecture

```text
Browser
   |
   | http://localhost:3001
   v
frontend (Next.js)
   |
   | WEB_SERVER_URL=http://web-server:3000
   v
web-server (Express) :3000
   |
   | AI_SERVER_URL=http://ai-server:8000
   v
ai-server (FastAPI + Transformers) :8000
   |
   v
Qwen3.5-0.8B model files
```

### Services

| Service | Technology | Container port | Host port | Responsibility |
| --- | --- | ---: | ---: | --- |
| `ai-server` | Python, FastAPI, Transformers, PyTorch | `8000` | `8000` | Loads Qwen and generates responses |
| `web-server` | Node.js, Express | `3000` | `3000` | Provides the API gateway and forwards chat requests |
| `frontend` | Next.js, React, TypeScript | `3000` | `3001` | Provides the browser chat interface |

All services are connected to the `qwen-network` Docker bridge network. The frontend is the only service most users need to open in a browser.

## Project Structure

```text
.
├── docker-compose.yml       # Builds and runs all services
├── ai-server/
│   ├── ai_server.py         # FastAPI endpoints and Qwen inference
│   ├── Dockerfile           # CPU PyTorch and Python image setup
│   ├── requirements.txt     # Python dependencies
│   └── models/              # Local Qwen3.5-0.8B model files
├── web-server/
│   ├── server.js            # Express gateway
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/page.tsx         # Chat interface
│   ├── Dockerfile           # Multi-stage Next.js production build
│   └── package.json
├── infrastructure/          # Infrastructure-related files
└── monitoring/              # Monitoring-related files
```

## Prerequisites

Install the following before running the project:

- Docker Desktop with Docker Compose support
- Git, if cloning the repository
- At least several gigabytes of free disk space for Docker images and the model
- Enough RAM for the Qwen model and CPU-based PyTorch inference

The AI image installs the CPU build of PyTorch. A GPU is not required by the current configuration, although CPU generation may be slower.

## Model Files

The AI server expects the model at:

```text
ai-server/models/Qwen3.5-0.8B
```

The directory must contain the model and tokenizer files, including `config.json`, `tokenizer.json`, `tokenizer_config.json`, and the `.safetensors` weights. The Compose file mounts this directory into the container as `/app/models` in read-only mode.

If the model is not present, obtain the permitted Qwen3.5-0.8B model files from their official source and place them in the directory above. Do not rename the directory unless you also update `MODEL_PATH` in `ai-server/ai_server.py`.

## Quick Start With Docker Compose

### 1. Clone and enter the project

```bash
git clone <repository-url>
cd qwen-ai-devops
```

If the project was provided as a folder or archive, simply open a terminal in the project root, the directory containing `docker-compose.yml`.

### 2. Confirm the model directory

On Windows PowerShell:

```powershell
Get-ChildItem .\ai-server\models\Qwen3.5-0.8B
```

On macOS/Linux:

```bash
ls ai-server/models/Qwen3.5-0.8B
```

### 3. Build and start the services

```bash
docker compose up --build -d
```

The first build can take time because it downloads the base images, Python dependencies, CPU PyTorch, Node dependencies, and Next.js build dependencies.

### 4. Follow startup logs

```bash
docker compose logs -f
```

Wait for the AI server log to report that the Qwen model loaded successfully. Press `Ctrl+C` to stop following logs; the containers continue running.

### 5. Open the application

Visit [http://localhost:3001](http://localhost:3001) and send a prompt in the chat interface.

## Verify the Services

Run these checks from the project root:

```bash
curl http://localhost:8000/health
curl http://localhost:3000/health
curl http://localhost:3001
```

Expected health responses include `"status":"healthy"` for the AI and web services. On Windows PowerShell, use `Invoke-RestMethod` if `curl` is unavailable:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:3000/health
```

Test the web API directly:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain what Docker Compose does in one sentence."}'
```

PowerShell equivalent:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3000/api/chat `
  -ContentType "application/json" `
  -Body '{"prompt":"Explain what Docker Compose does in one sentence."}'
```

The response has this shape:

```json
{
  "prompt": "Explain what Docker Compose does in one sentence.",
  "response": "..."
}
```

## API Reference

### AI server

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Returns a basic service message and model name |
| `GET` | `/health` | Reports AI service health |
| `POST` | `/generate` | Generates text from `{ "prompt": "..." }` |

### Web server

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Returns a basic gateway status message |
| `GET` | `/health` | Reports web gateway health |
| `POST` | `/api/chat` | Validates and forwards a prompt to the AI server |

The web server uses `AI_SERVER_URL` to locate the AI service. By default it uses `http://ai-server:8000`, which is the Compose service name and port.

## Useful Docker Commands

```bash
# Show running containers
docker compose ps

# View logs for one service
docker compose logs -f ai-server
docker compose logs -f web-server
docker compose logs -f frontend

# Restart one service
docker compose restart ai-server

# Stop containers without deleting them
docker compose stop

# Stop and remove containers and the Compose network
docker compose down

# Rebuild after changing source code or dependencies
docker compose up --build -d

# Remove containers and locally built images
docker compose down --rmi local
```

## Local Development Without Docker

Docker Compose is the recommended way to run the complete system. For development, services can also be run separately.

### Start the AI server

From `ai-server/`, create a Python environment and install the dependencies. Install the CPU PyTorch version used by the Dockerfile before installing the remaining requirements.

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

```bash
pip install torch==2.14.0+cpu --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
uvicorn ai_server:app --host 0.0.0.0 --port 8000
```

### Start the web server

In a second terminal:

```bash
cd web-server
npm ci
AI_SERVER_URL=http://localhost:8000 node server.js
```

On Windows PowerShell:

```powershell
cd web-server
npm ci
$env:AI_SERVER_URL = "http://localhost:8000"
node server.js
```

### Start the frontend

In a third terminal:

```bash
cd frontend
npm ci
npm run dev
```

The development frontend normally runs at [http://localhost:3000](http://localhost:3000). The current production Compose setup publishes the frontend at port `3001` to avoid conflicting with the web server.

## Frontend Commands

Run these from `frontend/`:

```bash
npm run dev     # Start the Next.js development server
npm run build   # Create a production build
npm run start   # Start the production build
npm run lint    # Run ESLint
```

## Troubleshooting

### The AI server keeps restarting

Check its logs:

```bash
docker compose logs ai-server
```

Common causes are missing model files, an incorrect model directory name, insufficient memory, or a failed dependency download.

### The frontend says it cannot connect to the AI server

Check all service states and logs:

```bash
docker compose ps
docker compose logs web-server ai-server
```

The web server must be able to resolve `ai-server` inside the `qwen-network`, and the AI server must finish loading the model before chat requests can succeed.

### A port is already in use

The default host ports are `3001`, `3000`, and `8000`. Stop the process using the port, or change the host-side value in `docker-compose.yml`. Keep the container-side ports and internal service URLs unchanged unless you also update the service configuration.

### Builds fail while downloading dependencies

Confirm Docker has internet access and retry:

```bash
docker compose build --no-cache
docker compose up -d
```

## Configuration Notes

- `MODEL_PATH` in `ai-server/ai_server.py` points to `./models/Qwen3.5-0.8B` inside the AI container.
- `AI_SERVER_URL` tells the web server where to forward generation requests.
- `WEB_SERVER_URL` is defined for the frontend container by Compose. The current frontend calls its relative `/api/chat` route, so requests stay on the frontend host.
- The AI server currently generates up to 80 new tokens with deterministic generation (`do_sample=False`).

## License and Model Terms

Review the included model license at `ai-server/models/Qwen3.5-0.8B/LICENSE` and the upstream Qwen project terms before redistributing or deploying the model.