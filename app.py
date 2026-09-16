from pathlib import Path
import re

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="ALLUCO | Aluminium - Import - Export",
    page_icon="A",
    layout="wide",
    initial_sidebar_state="collapsed",
)

BASE_DIR = Path(__file__).resolve().parent
INDEX_FILE = BASE_DIR / "index.html"
CSS_FILE = BASE_DIR / "styles.css"
JS_FILE = BASE_DIR / "script.js"

missing = [p.name for p in (INDEX_FILE, CSS_FILE, JS_FILE) if not p.exists()]
if missing:
    st.error("Missing required file(s): " + ", ".join(missing))
    st.stop()

html = INDEX_FILE.read_text(encoding="utf-8")
css = CSS_FILE.read_text(encoding="utf-8")
js = JS_FILE.read_text(encoding="utf-8")

# Streamlit components run in an iframe. Inline local files so their relative
# paths never break inside the component.
html = re.sub(
    r'<link[^>]+href=["\'](?:\./)?styles\.css["\'][^>]*>',
    "",
    html,
    flags=re.IGNORECASE,
)
html = re.sub(
    r'<script[^>]+src=["\'](?:\./)?script\.js["\'][^>]*>\s*</script>',
    "",
    html,
    flags=re.IGNORECASE,
)

# GSAP is not required in the Streamlit build. Native reveal animations are
# used instead, which are more reliable in the component iframe.
html = re.sub(
    r'<script[^>]+src=["\']https://cdn\.jsdelivr\.net/npm/gsap[^"\']*["\'][^>]*>\s*</script>',
    "",
    html,
    flags=re.IGNORECASE,
)

html = html.replace("</head>", f"<style>\n{css}\n</style>\n</head>")
html = html.replace("</body>", f'<script type="module">\n{js}\n</script>\n</body>')

st.markdown(
    """
    <style>
      html, body, [data-testid="stAppViewContainer"], .stApp {
        margin: 0 !important;
        padding: 0 !important;
        background: #05080d !important;
        overflow: hidden !important;
      }

      [data-testid="stHeader"],
      [data-testid="stToolbar"],
      [data-testid="stDecoration"],
      [data-testid="stStatusWidget"],
      footer,
      #MainMenu {
        display: none !important;
      }

      [data-testid="stMain"] {
        padding: 0 !important;
        overflow: hidden !important;
      }

      [data-testid="stMainBlockContainer"],
      .block-container {
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      [data-testid="stVerticalBlock"] {
        gap: 0 !important;
      }

      iframe {
        position: fixed !important;
        inset: 0 !important;
        display: block !important;
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        border: 0 !important;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

components.html(
    html,
    height=1000,
    scrolling=True,
)
