"""Non-secret, versioned runtime choices; read once, included in build identity."""
import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / '.env')
CONFIG = json.loads(Path(__file__).with_suffix('.json').read_text(encoding='utf-8'))
model = os.getenv('OLLAMA_MODEL', CONFIG['answer_model']).strip()
if not model or len(model) > 200 or any(character.isspace() for character in model):
    raise ValueError('OLLAMA_MODEL must be a nonempty Ollama model ID without whitespace (up to 200 characters).')
for field in ('router_model', 'answer_model', 'fallback_model'):
    CONFIG[field] = model
