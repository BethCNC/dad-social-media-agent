# To run this code you need to install the following dependencies:
# pip install google-genai python-dotenv
#
# Usage:
#   python3 ai_studio_code.py "Your prompt here"
#   python3 ai_studio_code.py "Your prompt" --temperature 0.7
#   python3 ai_studio_code.py "Your prompt" --include-thoughts

import argparse
import base64
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load .env file from project root
PROJECT_ROOT = Path(__file__).parent
ENV_FILE = PROJECT_ROOT / ".env"
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=False)

def generate(prompt: str, temperature: float = None, include_thoughts: bool = False, file_paths: list = None):
    """
    Generate content using Gemini 3.0 Pro.
    
    Args:
        prompt: The text prompt to send to the model
        temperature: Optional temperature (0.0-2.0) to control randomness
        include_thoughts: Whether to include the model's thinking process
        file_paths: Optional list of file paths to include in the prompt
    """
    # If file paths provided, read and prepend to prompt
    if file_paths:
        file_contents = []
        for file_path in file_paths:
            path = Path(file_path)
            if not path.exists():
                print(f"Warning: File not found: {file_path}", file=sys.stderr)
                continue
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    file_contents.append(f"\n\n--- Content from {file_path} ---\n{content}")
            except Exception as e:
                print(f"Warning: Could not read {file_path}: {e}", file=sys.stderr)
        
        if file_contents:
            prompt = "".join(file_contents) + "\n\n--- Your Task ---\n" + prompt
    # Try GEMINI_API_KEY first, then fall back to GOOGLE_API_KEY
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "API key not found! Please set GEMINI_API_KEY or GOOGLE_API_KEY "
            f"in your environment or .env file at {ENV_FILE}"
        )
    
    client = genai.Client(
        api_key=api_key,
    )

    model = "gemini-3-pro-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]
    
    # Configure generation settings
    config_kwargs = {}
    if temperature is not None:
        config_kwargs["temperature"] = temperature
    if include_thoughts:
        config_kwargs["thinking_config"] = types.ThinkingConfig(includeThoughts=True)
    
    generate_content_config = types.GenerateContentConfig(**config_kwargs)

    # Stream the response
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")
    print()  # Add newline at the end

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate content using Google Gemini 3.0 Pro",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 ai_studio_code.py "Write a short greeting about wellness"
  python3 ai_studio_code.py "Explain quantum computing" --temperature 0.7
  python3 ai_studio_code.py "Solve this math problem" --include-thoughts
        """
    )
    parser.add_argument(
        "prompt",
        nargs="?",
        default="Write a short, friendly greeting about wellness and energy.",
        help="The prompt to send to the model (default: wellness greeting)"
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=None,
        help="Temperature (0.0-2.0) to control randomness. Lower = more focused, Higher = more creative"
    )
    parser.add_argument(
        "--include-thoughts",
        action="store_true",
        help="Include the model's thinking process in the output"
    )
    parser.add_argument(
        "--file",
        action="append",
        dest="files",
        help="Include file contents in the prompt (can be used multiple times)"
    )
    
    args = parser.parse_args()
    
    try:
        generate(
            prompt=args.prompt,
            temperature=args.temperature,
            include_thoughts=args.include_thoughts,
            file_paths=args.files or []
        )
    except KeyboardInterrupt:
        print("\n\nInterrupted by user", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)
