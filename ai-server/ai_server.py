from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_PATH = "./models/Qwen3.5-0.8B"

app = FastAPI(title="Qwen AI Server")

print("Loading Qwen 0.8B model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)

print("Qwen 0.8B model loaded successfully.")


class ChatRequest(BaseModel):
    prompt: str


@app.get("/")
def root():
    return {
        "message": "Qwen AI Server is running",
        "model": "Qwen3.5-0.8B"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "Qwen3.5-0.8B"
    }


@app.post("/generate")
def generate(request: ChatRequest):

    messages = [
        {
            "role": "user",
            "content": request.prompt
        }
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    inputs = tokenizer(
        text,
        return_tensors="pt"
    )

    outputs = model.generate(
        **inputs,
        max_new_tokens=80,
        do_sample=False
    )

    generated_tokens = outputs[0][inputs["input_ids"].shape[1]:]

    response = tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True
    ).strip()

    return {
        "prompt": request.prompt,
        "response": response
    }
