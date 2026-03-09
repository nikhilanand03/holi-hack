"""Stage 5: Text-to-speech via Azure Cognitive Services."""

from __future__ import annotations

import time
from pathlib import Path

import azure.cognitiveservices.speech as speechsdk

import config

MAX_RETRIES = 5
INITIAL_BACKOFF = 2  # seconds


def synthesize_scene(
    text: str, output_path: Path, voice: str = "en-US-AndrewMultilingualNeural"
) -> Path:
    """Generate an MP3 file from *text* using Azure TTS with retry on 429."""
    for attempt in range(MAX_RETRIES):
        speech_config = speechsdk.SpeechConfig(
            subscription=config.get("azure_tts_key"),
            region=config.get("azure_tts_region"),
        )
        speech_config.set_speech_synthesis_output_format(
            speechsdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3
        )
        speech_config.speech_synthesis_voice_name = voice

        audio_config = speechsdk.audio.AudioOutputConfig(filename=str(output_path))
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config, audio_config=audio_config
        )

        result = synthesizer.speak_text_async(text).get()
        if result.reason != speechsdk.ResultReason.Canceled:
            return output_path

        detail = result.cancellation_details
        error_msg = detail.error_details or ""

        # Retry on rate-limit (429) errors
        if "429" in error_msg and attempt < MAX_RETRIES - 1:
            wait = INITIAL_BACKOFF * (2 ** attempt)
            time.sleep(wait)
            continue

        raise RuntimeError(f"TTS failed: {detail.reason} — {error_msg}")

    raise RuntimeError("TTS failed: max retries exceeded")


def synthesize_all(
    narrations: list[str], output_dir: Path, voice: str = "en-US-AndrewMultilingualNeural"
) -> list[Path]:
    """Generate MP3 files for all narrations."""
    output_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for i, text in enumerate(narrations, 1):
        out = output_dir / f"scene_{i:03d}.mp3"
        synthesize_scene(text, out, voice)
        paths.append(out)
    return paths
