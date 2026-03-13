import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")

supabase: Client | None = None

if url and key:
    supabase = create_client(url, key)

def get_supabase() -> Client:
    if supabase is None:
        raise RuntimeError(
            "Supabase client is not initialized. "
            "Please set SUPABASE_URL and SUPABASE_KEY environment variables."
        )
    return supabase
