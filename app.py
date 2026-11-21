"""API de conversão de vídeos autorizados: YouTube público -> MP3/MP4.

ATENÇÃO: a confirmação de autorização é autodeclarada; operação pública exige
revisão legal da plataforma de origem, controle de abusos e monitoramento.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import threading
import time
from urllib.parse import parse_qs, urlsplit
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

DATA_DIR = Path(os.getenv('DATA_DIR', '/tmp/converter'))
ALLOWED_ORIGINS = [x.strip() for x in os.getenv('PUBLIC_ORIGINS', 'https://akillibrasil.com').split(',') if x.strip()]
MAX_DURATION = int(os.getenv('MAX_DURATION_SECONDS', '1200'))
MAX_BYTES = int(os.getenv('MAX_FILE_BYTES', '314572800'))
MAX_ACTIVE = int(os.getenv('MAX_ACTIVE_JOBS', '4'))
RATE_LIMIT_COUNT = int(os.getenv('RATE_LIMIT_COUNT', '3'))
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW_SECONDS', '600'))
TTL_SECONDS = int(os.getenv('FILE_TTL_SECONDS', '1800'))
TRUST_PROXY = os.getenv('TRUST_PROXY', 'false').lower() == 'true'
VALID_ID = re.compile(r'^[A-Za-z0-9_-]{11}$')

app = FastAPI(title='Conversor de mídia — API', version='1.0.0', docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=['GET', 'POST'], allow_headers=['Content-Type'], max_age=600)

class ConversionRequest(BaseModel):
    url: str = Field(min_length=15, max_length=500)
    format: str
    quality: int = 720
    authorized: bool = False

@dataclass
class Job:
    id: str
    format: str
    quality: int
    status: str = 'queued'
    title: str = ''
    message: str = ''
    file: Path | None = None
    created: float = field(default_factory=time.monotonic)
    completed: float | None = None

jobs: dict[str, Job] = {}
clients: dict[str, deque[float]] = defaultdict(deque)
lock = threading.RLock()
executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix='converter')


def canonical_video_url(raw: str) -> str:
    """Reconhece apenas IDs de vídeos; elimina querystrings, playlists e URLs arbitrárias (SSRF)."""
    try:
        parsed = urlsplit(raw.strip())
    except ValueError:
        raise ValueError('Link inválido.') from None
    try:
        invalid_authority = bool(parsed.username or parsed.password or parsed.port)
    except ValueError:
        raise ValueError('Link inválido.') from None
    if parsed.scheme not in ('https', 'http') or invalid_authority:
        raise ValueError('Use um link HTTP(S) válido do YouTube.')
    host = (parsed.hostname or '').lower()
    path = parsed.path
    video_id = None
    if host in ('youtu.be', 'www.youtu.be'):
        pieces = path.split('/')
        if len(pieces) == 2:
            video_id = pieces[1]
    elif host in ('youtube.com', 'www.youtube.com', 'm.youtube.com'):
        if path == '/watch':
            vals = parse_qs(parsed.query).get('v') or []
            video_id = vals[0] if len(vals) == 1 else None
        elif re.fullmatch(r'/(shorts|live|embed)/[A-Za-z0-9_-]{11}/?', path):
            video_id = path.split('/')[2]
    if not video_id or not VALID_ID.fullmatch(video_id):
        raise ValueError('Insira o link de um único vídeo do YouTube.')
    return 'https://www.youtube.com/watch?v=' + video_id


def _remote_ip(request: Request) -> str:
    if TRUST_PROXY:
        return request.headers.get('x-real-ip', '') or (request.client.host if request.client else 'unknown')
    return request.client.host if request.client else 'unknown'


def _cleanup() -> None:
    """Arquivos prontos e falhas expiram; conversões em execução não são interrompidas."""
    now = time.monotonic()
    stale: list[str] = []
    with lock:
        for job_id, job in jobs.items():
            if job.status in ('ready', 'error') and job.completed and now - job.completed > TTL_SECONDS:
                stale.append(job_id)
        for job_id in stale:
            jobs.pop(job_id, None)
        for ip in list(clients):
            while clients[ip] and now - clients[ip][0] > RATE_LIMIT_WINDOW:
                clients[ip].popleft()
            if not clients[ip]:
                clients.pop(ip, None)
    for job_id in stale:
        shutil.rmtree(DATA_DIR / job_id, ignore_errors=True)


def _run(args: list[str], timeout: int) -> str:
    """Sem shell e com encerramento de toda a árvore de processos em caso de timeout."""
    proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                            start_new_session=True, cwd=str(DATA_DIR))
    try:
        stdout, stderr = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.communicate()
        raise RuntimeError('O tempo de processamento foi excedido.') from None
    if proc.returncode != 0:
        raise RuntimeError('Este vídeo não pôde ser obtido. Ele pode estar restrito, indisponível ou bloqueado pela plataforma.')
    return stdout


def _process(job_id: str, source_url: str) -> None:
    folder = DATA_DIR / job_id
    try:
        folder.mkdir(mode=0o700, parents=True, exist_ok=False)
        with lock:
            jobs[job_id].status = 'processing'
            requested_format = jobs[job_id].format
            quality = jobs[job_id].quality
        base_cmd = ['yt-dlp', '--ignore-config', '--no-playlist', '--no-cache-dir',
                    '--no-warnings', '--no-progress', '--js-runtimes', 'node',
                    '--socket-timeout', '25', '--retries', '1', '--fragment-retries', '1']
        metadata = _run(base_cmd + ['--dump-single-json', '--skip-download', source_url], timeout=95)
        info = json.loads(metadata)
        duration = info.get('duration')
        if duration is None or not isinstance(duration, (int, float)) or duration <= 0:
            raise RuntimeError('Vídeos ao vivo ou sem duração conhecida não são aceitos.')
        if duration > MAX_DURATION:
            raise RuntimeError(f'O vídeo supera o limite de {MAX_DURATION // 60} minutos.')
        if info.get('is_live') or info.get('live_status') in ('is_live', 'is_upcoming'):
            raise RuntimeError('Transmissões ao vivo não são aceitas.')
        title = str(info.get('title') or 'Vídeo').strip()[:120]
        command = base_cmd + [
            '--no-overwrites', '--restrict-filenames', '--max-filesize', str(MAX_BYTES),
            '--paths', str(folder), '--output', 'media.%(ext)s'
        ]
        if requested_format == 'mp3':
            command += ['--format', 'bestaudio/best', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '192K']
        else:
            height = int(quality)
            selected = f'bestvideo[ext=mp4][height<={height}]+bestaudio[ext=m4a]/best[ext=mp4][height<={height}]'
            command += ['--format', selected, '--merge-output-format', 'mp4']
        _run(command + [source_url], timeout=310)
        extension = '.' + requested_format
        files = [p for p in folder.glob('media.*') if p.is_file() and p.suffix.lower() == extension]
        if not files:
            raise RuntimeError('Não foi possível produzir o formato solicitado neste vídeo.')
        file = max(files, key=lambda x: x.stat().st_size)
        if file.stat().st_size > MAX_BYTES:
            raise RuntimeError('O arquivo excede o limite de tamanho permitido.')
        with lock:
            job = jobs.get(job_id)
            if job:
                job.title = title
                job.file = file
                job.status = 'ready'
                job.completed = time.monotonic()
    except Exception as error:
        with lock:
            job = jobs.get(job_id)
            if job:
                job.message = str(error) if isinstance(error, RuntimeError) else 'Falha técnica ao processar este arquivo.'
                job.status = 'error'
                job.completed = time.monotonic()
        shutil.rmtree(folder, ignore_errors=True)


@app.on_event('startup')
async def on_start() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    async def janitor():
        while True:
            await asyncio.sleep(120)
            await asyncio.to_thread(_cleanup)
    app.state.janitor = asyncio.create_task(janitor())


@app.on_event('shutdown')
async def on_stop() -> None:
    app.state.janitor.cancel()
    executor.shutdown(wait=False, cancel_futures=True)


@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'converter', 'formats': ['mp3', 'mp4']}


@app.post('/api/convert', status_code=202)
def convert(payload: ConversionRequest, request: Request):
    if not payload.authorized:
        raise HTTPException(status_code=422, detail='É necessário confirmar a autorização de download.')
    if payload.format not in ('mp3', 'mp4') or payload.quality not in (480, 720, 1080):
        raise HTTPException(status_code=422, detail='Formato ou qualidade inválidos.')
    try:
        source_url = canonical_video_url(payload.url)
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err)) from None
    _cleanup()
    ip = _remote_ip(request)
    now = time.monotonic()
    with lock:
        recent = clients[ip]
        while recent and now - recent[0] > RATE_LIMIT_WINDOW:
            recent.popleft()
        if len(recent) >= RATE_LIMIT_COUNT:
            raise HTTPException(status_code=429, detail='Limite de solicitações atingido. Tente novamente mais tarde.')
        active = sum(job.status in ('queued', 'processing') for job in jobs.values())
        if active >= MAX_ACTIVE:
            raise HTTPException(status_code=503, detail='Serviço ocupado. Tente novamente em instantes.')
        recent.append(now)
        job_id = str(uuid4())
        jobs[job_id] = Job(id=job_id, format=payload.format, quality=payload.quality)
    executor.submit(_process, job_id, source_url)
    return {'job_id': job_id, 'status': 'queued'}


@app.get('/api/jobs/{job_id}')
def job_status(job_id: UUID):
    _cleanup()
    with lock:
        job = jobs.get(str(job_id))
        if not job:
            raise HTTPException(status_code=404, detail='Solicitação não encontrada ou expirada.')
        data = {'status': job.status, 'format': job.format, 'title': job.title}
        if job.status == 'ready':
            data['download_url'] = '/api/files/' + str(job_id)
        elif job.status == 'error':
            data['message'] = job.message
        return data


@app.get('/api/files/{job_id}')
def download(job_id: UUID):
    _cleanup()
    with lock:
        job = jobs.get(str(job_id))
        if not job or job.status != 'ready' or not job.file or not job.file.is_file():
            raise HTTPException(status_code=404, detail='Arquivo não encontrado ou expirado.')
        path = job.file
        extension = job.format
        safe_title = re.sub(r'[\\/\r\n\x00-\x1f]', '', job.title).strip(' .')[:90] or 'arquivo'
    media_type = 'audio/mpeg' if extension == 'mp3' else 'video/mp4'
    return FileResponse(path, filename=f'{safe_title}.{extension}', media_type=media_type,
                        headers={'Cache-Control': 'private, no-store, max-age=0',
                                 'X-Content-Type-Options': 'nosniff'})
