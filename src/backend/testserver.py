import os
# uses fake key for test
os.environ.setdefault("OPENAI_API_KEY", "test")

import json, re, importlib

# not actually running flask app but import actual server
server = importlib.import_module("server")
app = server.app


#creating fake api responses
class FakeResp:
    def __init__(self, text):
        self.output_text = text

class FakeResponses:
    # fake stream of info (had to look up how to make)
    def stream(self, **responses):
        class _Stream:
            def __enter__(self_s): return self_s
            def __exit__(self_s, exc_type, exc, tb): pass
            def __iter__(self_s):
                chunks = [
                    "::professional\nHello everyone",
                    ", let's schedule a chat about it.\n",
                    "::casual\nHello There (;\n",
                    "::polite\nWhy hello there Anakin\n",
                    "::social\nYo wasgood team wanna chat?\n",
                ]
                Evt = type("Evt", (object,), {})
                for c in chunks:
                    e = Evt()
                    e.type = "response.output_text.delta"
                    e.delta = c
                    yield e
        return _Stream()

class FakeClient:
    def __init__(self):
        self.responses = FakeResponses()

server.client = FakeClient()
print("uses Fake OpenAI so that we arent using tokens.")

if __name__ == "__main__":
    app.run(port=5000, debug=True)
