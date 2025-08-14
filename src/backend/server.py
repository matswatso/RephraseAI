import os, json
from flask import Flask, request, Response, stream_with_context, jsonify
from dotenv import load_dotenv
from openai import OpenAI

# Load .env next to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise SystemExit("no key for api")

client = OpenAI(api_key=API_KEY)
app = Flask(__name__)

@app.post("/api/rewrite_stream")
def rewrite_stream():
    body = request.get_json(force=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Missing 'text'"}), 400

    system = (
        "Rewrite the user's text into four distinct styles."
        "\nReturn exactly four sections, each starting with these markers on their own line:"
        "\n::professional\n::casual\n::polite\n::social"
        "\nAfter each marker, continue with the rewrite as plain sentences."
        "\nDo NOT repeat or quote the input. Do NOT wrap outputs in brackets or quotes. No extra commentary."
    )
    user = f'Text: \"\"\"{text}\"\"\"'

    def token_stream():
        with client.responses.stream(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        ) as stream:
            for event in stream:
                if getattr(event, "type", "") == "response.output_text.delta":
                    yield event.delta  # send chunks immediately

    return Response(stream_with_context(token_stream()),
                    mimetype="text/plain; charset=utf-8")

if __name__ == "__main__":
    app.run(port=5000, debug=False)
