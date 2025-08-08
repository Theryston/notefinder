import yt_dlp
import os


def download_youtube_audio(url: str, output_path: str):
    cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
    if not os.path.exists(cookies_path):
        raise FileNotFoundError(f"Cookies file not found at {cookies_path}")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path,
        'cookiefile': cookies_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192'
        }],
        'quiet': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except:
        return False
    return True


def get_youtube_info(url: str) -> dict:
    """Return basic information about a YouTube video without downloading it.

    Keys: title, id, uploader, duration, webpage_url
    """
    info_opts = {
        'quiet': True,
        'skip_download': True,
        'nocheckcertificate': True,
    }
    # Use cookies if available to avoid age/bot checks
    cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
    if os.path.exists(cookies_path):
        info_opts['cookiefile'] = cookies_path

    try:
        with yt_dlp.YoutubeDL(info_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                'title': info.get('title'),
                'id': info.get('id'),
                'uploader': info.get('uploader'),
                'duration': info.get('duration'),
                'webpage_url': info.get('webpage_url') or url,
            }
    except Exception:
        return {
            'title': None,
            'id': None,
            'uploader': None,
            'duration': None,
            'webpage_url': url,
        }
