"""Inicia API com o binário FFmpeg do pacote Python, sem Docker nem apt."""
import os
from pathlib import Path
import imageio_ffmpeg
import uvicorn

ffmpeg_path = Path(imageio_ffmpeg.get_ffmpeg_exe())
if not ffmpeg_path.is_file():
    raise RuntimeError("FFmpeg não está disponível")
bin_dir = Path("/tmp/akilli-converter-bin")
bin_dir.mkdir(parents=True, exist_ok=True)
link = bin_dir / "ffmpeg"
if not link.exists():
    link.symlink_to(ffmpeg_path)
os.environ["PATH"] = str(bin_dir) + os.pathsep + os.environ.get("PATH", "")
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", "8080")), workers=1)
