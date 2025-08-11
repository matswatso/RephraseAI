import os
import json
from pathlib import Path
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from openai import OpenAI

# --- Load .env from the project root no matter where we run from ---
ROOT = Path(__file__).resolve().parents[2]   # .../RephraseAI/
env_path = ROOT / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    print(f"WARNING: .env not found at {env_path}")

API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    print("no key for api")

client = OpenAI(api_key=API_KEY)

app = Flask(__name__)

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/rewrite")
def rewrite():
    try:
        body = request.get_json(force=True) or {}
        text = (body.get("text") or "").strip()
        if not text:
            return jsonify({"error": "Missing 'text'"}), 400

        system = (
            "Rewrite the user's text into four distinct styles: "
            "professional, casual, polite, and social-media. "
            "Return STRICT JSON with keys: professional, casual, polite, social. "
            "Do not include any prose or code fences—only JSON."
        )
        user = f'Text: """{text}"""'

        resp = client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            # NOTE: no response_format here for older SDKs
        )

        data = json.loads(resp.output_text)
        return jsonify({
            "professional": data.get("professional", ""),
            "casual":       data.get("casual", ""),
            "polite":       data.get("polite", ""),
            "social":       data.get("social", "")
        })
    except Exception as e:
        print("OpenAI/Server error:", repr(e))
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
