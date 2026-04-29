#!/usr/bin/env python3
"""Build APPENDIX section in the reference (vigilantaireport) style."""
import base64
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SNIP = ROOT / 'html' / 'snippets'
SHOTS = ROOT / 'screenshots'
OUT = ROOT / 'appendix.html'


def b64(img_path: Path) -> str:
    data = img_path.read_bytes()
    return 'data:image/png;base64,' + base64.b64encode(data).decode('ascii')


def code_plain(filename: str) -> str:
    """Render code as plain serif text with 1.5 line spacing (reference style)."""
    src = (SNIP / filename).read_text()
    return f'<div class="code-plain">{html.escape(src)}</div>'


def figure(img_file: str, fig_no: int, caption_text: str) -> str:
    data_uri = b64(SHOTS / img_file)
    return f'''
    <div class="fig-wrap">
      <img src="{data_uri}" alt="{html.escape(caption_text)}"/>
      <p class="fig-caption"><em>Figure {fig_no}: {html.escape(caption_text)}</em></p>
    </div>
    '''


HEAD = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Shifty — Appendix</title>
<style>
@page {
  size: A4;
  margin: 25mm 25mm 22mm 25mm;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

body {
  font-family: 'Times New Roman', 'Liberation Serif', serif;
  font-size: 12pt;
  line-height: 1.5;
  color: #000;
  text-align: justify;
}

/* ---------- APPENDIX page title ---------- */
h1.appendix-title {
  font-size: 14pt;
  font-weight: bold;
  text-align: center;
  margin: 0 0 24pt 0;
  line-height: 1.5;
}

/* ---------- "Appendix A: TITLE" subsection heading ---------- */
h2.app-sub {
  font-size: 12pt;
  font-weight: bold;
  text-align: left;
  margin: 20pt 0 12pt 0;
  page-break-after: avoid;
  line-height: 1.5;
}

/* ---------- Body paragraphs ---------- */
p {
  margin: 0 0 8pt 0;
  text-align: justify;
  line-height: 1.5;
}

/* ---------- Code rendered as plain serif text with 1.5 spacing (no box) ---------- */
.code-plain {
  font-family: 'Times New Roman', 'Liberation Serif', serif;
  font-size: 12pt;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
  margin: 0 0 14pt 0;
  page-break-inside: auto;
}

/* ---------- Figures and captions (italic centered) ---------- */
.fig-wrap {
  margin: 14pt 0;
  text-align: center;
  page-break-inside: avoid;
}
.fig-wrap img {
  max-width: 100%;
  max-height: 200mm;
  border: 1px solid #999;
}
p.fig-caption {
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  font-style: italic;
  text-align: center;
  margin: 6pt 0 0 0;
  line-height: 1.4;
}

/* ---------- Intro paragraph indent matches reference body ---------- */
p.intro { text-indent: 0.2in; }
</style>
</head>
<body>
'''

FOOT = '\n</body>\n</html>\n'


def build() -> None:
    parts = []

    # -------- Appendix title page --------
    parts.append('<h1 class="appendix-title">APPENDIX</h1>')

    parts.append('''
    <p class="intro">This appendix contains the supporting source code listings
    and running-system snapshots for the Shifty project. The code modules are
    organised by subsystem and the snapshots illustrate the end-user
    experience across the principal surfaces of the application.</p>
    ''')

    # -------- Appendix A: User & Auth schema --------
    parts.append('<h2 class="app-sub">Appendix A: USER SCHEMA AND PASSWORD HASHING</h2>')
    parts.append(code_plain('04_user_model.js'))

    # -------- Appendix B: Auth controllers --------
    parts.append('<h2 class="app-sub">Appendix B: AUTHENTICATION CONTROLLERS</h2>')
    parts.append(code_plain('05_auth_controller.js'))

    # -------- Appendix C: Auth middleware --------
    parts.append('<h2 class="app-sub">Appendix C: TOKEN VERIFYING MIDDLEWARE</h2>')
    parts.append(code_plain('06_auth_middleware.js'))

    # -------- Appendix D: Booking schema --------
    parts.append('<h2 class="app-sub">Appendix D: BOOKING SCHEMA AND INVENTORY MODEL</h2>')
    parts.append(code_plain('07_booking_model.js'))

    # -------- Appendix E: Redux booking slice --------
    parts.append('<h2 class="app-sub">Appendix E: BOOKING DRAFT STATE MANAGEMENT</h2>')
    parts.append(code_plain('12_booking_slice.js'))

    # -------- Appendix F: Address map screen --------
    parts.append('<h2 class="app-sub">Appendix F: ADDRESS MAP SELECTION SCREEN</h2>')
    parts.append(code_plain('11_address_map_screen.js'))

    # -------- Appendix G: Login screen --------
    parts.append('<h2 class="app-sub">Appendix G: MOBILE LOGIN SCREEN IMPLEMENTATION</h2>')
    parts.append(code_plain('10_login_screen.js'))

    # -------- Appendix H: RF trainer --------
    parts.append('<h2 class="app-sub">Appendix H: RANDOM FOREST PACKAGE RECOMMENDER</h2>')
    parts.append(code_plain('08_train_rf.py'))

    # -------- Appendix I: XGBoost trainer --------
    parts.append('<h2 class="app-sub">Appendix I: XGBOOST DYNAMIC PRICING MODEL</h2>')
    parts.append(code_plain('09_train_xgb.py'))

    # -------- Appendix J: Live tracking --------
    parts.append('<h2 class="app-sub">Appendix J: LIVE TRACKING SOCKET GATEWAY</h2>')
    parts.append(code_plain('13_tracking_socket.js'))

    # -------- Appendix K: Rasa actions --------
    parts.append('<h2 class="app-sub">Appendix K: CONVERSATIONAL ASSISTANT ACTIONS</h2>')
    parts.append(code_plain('14_rasa_actions.py'))

    # -------- Appendix L: Payment controller --------
    parts.append('<h2 class="app-sub">Appendix L: RAZORPAY PAYMENT CONTROLLER</h2>')
    parts.append(code_plain('15_payment_controller.js'))

    # -------- Appendix M: Snapshots of running system --------
    parts.append('<h2 class="app-sub">Appendix M: SNAPSHOTS OF SHIFTY RUNNING SYSTEM</h2>')

    parts.append('''
    <p class="intro">The following snapshots are taken from the running
    Shifty prototype. They cover the landing page, the booking planner, the
    price prediction screen, the payment review screen, and the
    authentication flows.</p>
    ''')

    parts.append(figure('01_landing_full.png', 12,
                        'Landing Page of the Shifty Web Prototype'))
    parts.append(figure('02_plan.png', 13,
                        'Booking Planner Capturing Itinerary and Inventory'))
    parts.append(figure('03_predict.png', 14,
                        'Price Prediction Screen Showing Model-Generated Quote'))
    parts.append(figure('04_payments.png', 15,
                        'Payment Review Screen Prior to Gateway Hand-off'))
    parts.append(figure('05_signin.png', 16,
                        'Sign-in Screen for Secure Access in Shifty System'))
    parts.append(figure('06_signup.png', 17,
                        'Account Creation Screen with Inline Validation'))

    OUT.write_text(HEAD + '\n'.join(parts) + FOOT, encoding='utf-8')
    print(f'Wrote {OUT}  ({OUT.stat().st_size} bytes)')


if __name__ == '__main__':
    build()
