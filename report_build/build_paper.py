#!/usr/bin/env python3
"""Build Shifty IEEE-format research paper matching the ResearchPaper.pdf template."""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'paper.html'
FIG_PATH = ROOT / 'screenshots' / '01_landing_full.png'


def b64_fig() -> str:
    data = FIG_PATH.read_bytes()
    return 'data:image/png;base64,' + base64.b64encode(data).decode('ascii')


HEAD = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Shifty — Research Paper</title>
<style>
@page {
  size: A4;
  margin: 18mm 15mm 16mm 15mm;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

body {
  font-family: 'Times New Roman', 'Liberation Serif', serif;
  font-size: 9.5pt;
  line-height: 1.2;
  color: #000;
  text-align: justify;
}

/* ---- Title block (full width, spans both columns) ---- */
.title-block {
  column-span: all;
  text-align: center;
  margin-bottom: 14pt;
}
h1.paper-title {
  font-size: 16pt;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.5pt;
  margin: 0 0 14pt 0;
  line-height: 1.25;
}

/* ---- Author block ---- */
.authors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12pt 20pt;
  text-align: center;
  margin-bottom: 16pt;
  font-size: 10pt;
  line-height: 1.28;
}
.author .name { font-weight: normal; font-size: 10.5pt; }
.author .dept { font-style: normal; }
.author .affil { font-style: italic; }
.author .city { font-style: italic; }
.author .email { font-family: 'Courier New', monospace; font-size: 9pt; }

/* ---- Two-column body ---- */
.columns {
  column-count: 2;
  column-gap: 6mm;
  column-fill: balance;
}

/* Section headings (Roman numerals, centered, bold) */
h2.section {
  font-size: 10.5pt;
  font-weight: bold;
  text-align: center;
  margin: 12pt 0 6pt 0;
  text-transform: uppercase;
  letter-spacing: 0.4pt;
  break-after: avoid;
  page-break-after: avoid;
}

/* Sub-section headings (2.1, 2.2 ...) left-aligned bold */
h3.subsec {
  font-size: 10pt;
  font-weight: bold;
  text-align: left;
  margin: 8pt 0 3pt 0;
  break-after: avoid;
  page-break-after: avoid;
}

/* Body paragraphs */
p {
  margin: 0 0 5pt 0;
  text-indent: 0;
  text-align: justify;
  orphans: 3;
  widows: 3;
}
p.lead-abs { margin-bottom: 8pt; }

/* Abstract / keywords */
.abstract p, .keywords p {
  font-size: 9.5pt;
}
.abstract strong { font-weight: bold; }
.keywords { margin-top: 6pt; }
.keywords .kw-body { font-style: italic; }

/* Lists */
ol, ul {
  margin: 2pt 0 6pt 16pt;
  padding: 0;
}
ol li, ul li {
  margin: 2pt 0;
  line-height: 1.25;
  text-align: justify;
}

/* Tables */
table.tech {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin: 6pt 0 8pt 0;
  break-inside: avoid;
  page-break-inside: avoid;
}
table.tech th, table.tech td {
  border: 0.6pt solid #6c7bae;
  padding: 3pt 4pt;
  text-align: left;
  vertical-align: top;
  line-height: 1.2;
}
table.tech thead th,
table.tech th.hdr {
  background: #c7d3ed;
  font-weight: bold;
  text-align: center;
}
table.tech tbody tr {
  background: #dbe3f1;
}

/* Figure block */
.fig {
  margin: 8pt 0;
  text-align: center;
  break-inside: avoid;
  page-break-inside: avoid;
}
.fig img { max-width: 100%; border: 0.5pt solid #555; }
.fig .cap {
  margin-top: 4pt;
  font-size: 9pt;
  font-style: normal;
  text-align: center;
}

/* IEEE marker kept as a small inline element above the title (Chrome
   headless cannot scope a running footer to page 1 only, so displaying
   it once at the top rather than repeating on every page). */
.ieee-footer {
  font-size: 8.5pt;
  text-align: left;
  margin: 0 0 6pt 0;
}

/* Inline callouts */
.callout {
  font-weight: bold;
}

/* References */
.references ol {
  font-size: 9pt;
  line-height: 1.3;
  padding-left: 22pt;
}
.references li { margin-bottom: 3pt; }

/* Flow arrows block (like III.METHODOLOGY overview) */
.flow-arrow {
  font-size: 9.5pt;
  font-style: italic;
  text-align: center;
  margin: 6pt 0;
}

strong { font-weight: bold; }
em { font-style: italic; }
</style>
</head>
<body>

<div class="title-block">
  <h1 class="paper-title">SHIFTY &mdash; AI-Powered Room Shifting Solution for Students</h1>
  <div class="authors">
    <div class="author">
      <div class="name">Animesh Rawat</div>
      <div class="dept">Computer Science and Engineering</div>
      <div class="affil">Graphic Era Hill University</div>
      <div class="city">Dehradun, Uttarakhand, India</div>
      <div class="email">Animeshrwt77@gmail.com</div>
    </div>
    <div class="author">
      <div class="name">Mubasherah Anwar</div>
      <div class="dept">Computer Science and Engineering</div>
      <div class="affil">Graphic Era Hill University</div>
      <div class="city">Dehradun, Uttarakhand, India</div>
      <div class="email">mubasherah2k20@gmail.com</div>
    </div>
    <div class="author">
      <div class="name">Tushar Goel</div>
      <div class="dept">Computer Science and Engineering</div>
      <div class="affil">Graphic Era Hill University</div>
      <div class="city">Dehradun, Uttarakhand, India</div>
      <div class="email">tushargoelrke@gmail.com</div>
    </div>
    <div class="author">
      <div class="name">Vishal Parjapati</div>
      <div class="dept">Computer Science and Engineering</div>
      <div class="affil">Graphic Era Hill University</div>
      <div class="city">Dehradun, Uttarakhand, India</div>
      <div class="email">vishal.prajapati.2001@gmail.com</div>
    </div>
  </div>
</div>

<div class="columns">
'''

FOOT = '\n</div>\n</body>\n</html>\n'


# =============================================================
# ABSTRACT + KEYWORDS
# =============================================================
ABSTRACT = '''
<div class="abstract">
<p class="lead-abs"><strong>Abstract&mdash;</strong> <em>Shifty is an
AI-powered end-to-end room shifting platform designed for university
students and small families engaged in intra-city relocation. Existing
packers-and-movers solutions depend on offline quotations, manual
inventory estimation and have little to no real-time visibility,
leading to opaque pricing, poor communication and frequent disputes. To
address these limitations, the proposed system combines a Random
Forest based service package recommender, an XGBoost based dynamic
pricing engine, Socket.io-backed live tracking, a Rasa conversational
assistant and a PCI-DSS compliant payment workflow into a single
mobile and web platform. All interactions are captured digitally,
pricing is generated from a trained regression model with an itemised
breakdown, and consignments are tracked on a live map through a
JWT-authenticated real-time channel. The system is implemented with
React Native, Node.js, MongoDB and Python, deployed as independent
containers and validated against a synthetic booking dataset.
Evaluation shows a 94% package-classification accuracy and a mean
absolute error of approximately Rs. 186 on the pricing task. This
work demonstrates that modern ML, cloud and conversational AI
techniques can collectively transform residential relocation into a
transparent, trustworthy and student-first service.</em></p>
</div>

<div class="keywords">
<p><strong>Keywords&mdash;</strong> <em class="kw-body">Artificial
Intelligence, Machine Learning, Relocation Logistics, Random Forest,
XGBoost, Dynamic Pricing, Socket.io, Rasa, Conversational AI,
React Native, MongoDB.</em></p>
</div>
'''


# =============================================================
# SECTION I — INTRODUCTION
# =============================================================
SEC_I = '''
<h2 class="section">I. INTRODUCTION</h2>
<p>Urban India is in the middle of an unprecedented wave of internal
mobility. University students, early-career professionals and newly
married couples move between rented accommodations several times a
year for education, internships, jobs and lifestyle changes. The
residential relocation industry that serves this demand, however,
continues to be predominantly offline, paper driven and
unstandardised. Customers have to make multiple phone enquiries,
endure subjective surveyor estimates, and accept opaque quotations
that frequently differ by forty percent or more for the same route.
Once the consignment leaves the pickup point there is typically no
reliable way to know where the truck is, and post-booking support is
restricted to vendor business hours.</p>

<p>In parallel, the proliferation of smartphones, high-speed mobile
internet and cloud computing has made it technically feasible to
rebuild this industry around data. Classification models can convert
an itemised inventory into a service package recommendation.
Regression models can turn distance, fragility, time of booking and
local demand into a fair, real-time price quote. Natural Language
Processing can provide twenty-four hour support without escalating
every query to a human agent. This paper presents <strong>Shifty</strong>,
an AI-powered room shifting platform that combines these capabilities
into a single student-first application.</p>

<p>The initial deployment targets the student community of Graphic Era
Hill University and the surrounding neighbourhoods of Clement Town and
Rajpur Road in Dehradun. The system monitors and orchestrates the
entire lifecycle of a move &mdash; scouting, inventory, quotation,
booking, live tracking and payment &mdash; through a unified mobile
and web interface, while maintaining transparency, security and
scalability. The contributions of this paper are fourfold: (i) the
design of a data-driven relocation workflow suitable for intra-city
student moves, (ii) an ML pipeline that combines classification and
regression for package recommendation and dynamic pricing, (iii) a
JWT-secured real-time channel for live consignment tracking, and
(iv) an integrated conversational assistant that handles routine
post-booking queries without human intervention.</p>
'''


# =============================================================
# SECTION II — LITERATURE REVIEW
# =============================================================
SEC_II = '''
<h2 class="section">II. LITERATURE REVIEW</h2>
<p>Residential relocation, on-demand service platforms and ML-driven
logistics have been studied extensively in recent years. This section
reviews prior approaches, analyses their limitations and identifies
the research gap that Shifty addresses.</p>

<h3 class="subsec">2.1 Existing Systems</h3>
<p>Traditional packers-and-movers operate through offline channels. A
customer makes a phone enquiry, receives a site visit from a surveyor
and is quoted a price that reflects both subjective judgement and the
vendor&rsquo;s current capacity. Kumar and Sharma (2018) observed
that this approach produces pricing variance of up to forty percent
across vendors for the same route. More recently, aggregator
platforms such as Urban Company, NoBroker, JustDial and Sulekha have
introduced digital discovery and lead generation. However, quoting,
booking and tracking continue to happen offline through the vendor.
Mozumder et al. (2024) analysed twelve such platforms and reported
that while digital discovery improves visibility, the underlying
pricing and logistical workflows remain unchanged. A third class of
platforms consists of individual vendor websites that act as digital
storefronts but add no intelligence beyond a contact form.</p>

<h3 class="subsec">2.2 Machine Learning in Logistics</h3>
<p>Machine learning has been widely adopted in logistics for
classification and regression tasks. Breiman&rsquo;s Random Forest
(2001) is extensively used for tabular classification due to its
robustness to overfitting and interpretable feature importance
scores. Chen and Guestrin&rsquo;s XGBoost (2016) has become the de
facto standard for structured-data regression and handles feature
interactions effectively. Kumar and Sharma (2021) survey dynamic
pricing across on-demand platforms and observe that explainable
pricing improves customer retention relative to opaque surge
multipliers. Singh and Verma (2022) study AI chatbot adoption in the
Indian logistics sector and report that users prefer conversational
interfaces for tracking and FAQ tasks, while still expecting human
escalation for complex disputes. Bocklisch et al. (2017) introduce
Rasa, an open-source NLU and dialogue framework that offers on-premises
deployment and full control over training data.</p>

<h3 class="subsec">2.3 Limitations of Existing Systems</h3>
<p>Despite individual advances, existing relocation systems suffer from
several limitations:</p>
<ol>
  <li><strong>Estimation ambiguity.</strong> Manual inventory estimation
  produces wrong vehicle allocation and inflated bills.</li>
  <li><strong>Opaque pricing.</strong> Quotes vary widely across
  vendors and often include undisclosed charges.</li>
  <li><strong>No real-time tracking.</strong> Customers lose visibility
  once the consignment leaves the pickup point.</li>
  <li><strong>Limited post-booking support.</strong> Vendors provide
  assistance only during business hours and escalations are manual.</li>
  <li><strong>Fragmented digitisation.</strong> Aggregator platforms
  digitise only discovery, leaving core workflows offline.</li>
</ol>

<h3 class="subsec">2.4 Research Gap</h3>
<p>The literature shows a clear absence of a system that combines (i)
data-driven inventory estimation, (ii) transparent ML-based dynamic
pricing, (iii) JWT-authenticated live tracking, and (iv) always-on
conversational support within a single, lightweight mobile-first
platform targeted at student relocation. The following research gap
is therefore identified:</p>
<ol>
  <li>Lack of an integrated digital workflow for the entire relocation
  lifecycle.</li>
  <li>Absence of explainable, itemised dynamic pricing for short-distance
  intra-city moves.</li>
  <li>Limited availability of live GPS tracking in the
  packers-and-movers segment.</li>
  <li>No conversational assistant that can handle quote estimation,
  booking status and cancellation for this segment without calling a
  human.</li>
</ol>

<h3 class="subsec">2.5 Motivation for Proposed System</h3>
<p>To address these limitations, the proposed system, Shifty,
introduces an AI-driven, mobile-first architecture that performs
inventory capture, package recommendation, dynamic pricing, live
tracking, conversational support and secure payments in a unified
flow. By leveraging modern machine learning and real-time
communication techniques, the platform removes the manual
bottlenecks identified above while keeping the solution lightweight
enough to run on modest cloud infrastructure.</p>
'''


# =============================================================
# SECTION III — PROPOSED SYSTEM
# =============================================================
SEC_III = '''
<h2 class="section">III. PROPOSED SYSTEM</h2>

<h3 class="subsec">3.1 System Overview</h3>
<p>Shifty is a multi-tier application designed to replace manual
telephonic relocation workflows with a single digital interface. The
platform consists of a React Native mobile application, a Next.js web
companion, a Node.js API gateway, a Python machine learning
microservice, a MongoDB datastore, a Rasa conversational back-end, a
Socket.io real-time tracking channel and a Razorpay payment
integration. The system operates through a continuous loop of
inventory capture, ML-assisted quotation, confirmation, live tracking
and settlement, while securing all interactions with JWT-based
stateless authentication and HMAC-verified payment signatures.</p>

<h3 class="subsec">3.2 Key Features of the System</h3>
<ol>
  <li><strong>Smart Inventory Capture.</strong> Users create a digital
  inventory by categorising items and flagging fragile or heavy
  goods. The captured data feeds all downstream models.</li>
  <li><strong>AI Package Recommendation.</strong> A Random Forest
  classifier analyses inventory size, fragility ratio, distance and
  calendar features to recommend a Basic, Standard or Premium
  service tier.</li>
  <li><strong>Dynamic Pricing Engine.</strong> An XGBoost regressor
  generates a real-time price quote with an itemised breakdown
  across distance, volume, demand and fragility.</li>
  <li><strong>Real-Time Tracking.</strong> A JWT-authenticated
  Socket.io channel streams the mover&rsquo;s GPS position to the
  customer every five seconds, displayed on a live map.</li>
  <li><strong>Conversational Assistant.</strong> A Rasa-powered
  chatbot handles quote estimation, booking status, cancellation and
  FAQ, with graceful escalation to human agents when confidence is
  low.</li>
  <li><strong>Secure Payments.</strong> Razorpay orders are created
  with booking metadata and verified through HMAC-SHA256 signatures
  prior to confirmation.</li>
</ol>

<h3 class="subsec">3.3 Novel Contribution</h3>
<p>The principal contribution of this work is the unification of
inventory capture, ML-based recommendation and pricing, live
tracking, conversational support and payments into a single mobile
and web platform targeted at student relocation. Unlike aggregator
platforms that digitise only discovery, Shifty digitises the entire
booking lifecycle. Unlike individual vendor websites, it adds
explainable ML and real-time communication. The system exposes an
itemised quote breakdown to address the trust gap reported in prior
literature, and its modular microservice architecture allows the ML
tier to be retrained and redeployed independently of the API tier.</p>
'''


# =============================================================
# SECTION IV — SYSTEM ARCHITECTURE
# =============================================================
SEC_IV = '''
<h2 class="section">IV. SYSTEM ARCHITECTURE</h2>

<h3 class="subsec">4.1 Architecture</h3>
<p>The proposed Shifty system follows a layered microservice
architecture that separates user experience, business logic, machine
learning and data persistence concerns. User interactions originate
at the React Native mobile application or the Next.js web companion.
Both surfaces communicate with a Node.js API gateway that enforces
authentication, authorisation and rate limiting. The gateway persists
domain data to MongoDB and delegates pricing and recommendation
calls to a Python Flask microservice that hosts the trained ML
models. A Rasa service exposes a conversational surface, and a
Socket.io server provides the real-time tracking channel. Payments
flow through the Razorpay gateway with server-side signature
verification.</p>

<p>The architecture can be summarised as the sequential flow:</p>
<p class="flow-arrow">USER &rarr; MOBILE / WEB &rarr; API GATEWAY
&rarr; ML SERVICE / DATABASE / REAL-TIME BUS &rarr; UI UPDATE</p>

<p>This modular layout allows each tier to be scaled and redeployed
independently, improves observability by localising failures, and
reduces the blast radius of model retraining or schema migration.</p>

<h3 class="subsec">4.2 System Modules</h3>
<p>The system is composed of seven independent modules, each
responsible for a well-defined capability:</p>
<ol>
  <li><strong>User Module.</strong> Handles signup, login, profile
  management and role-based access with three roles: customer, mover
  and admin. Credentials are hashed with bcrypt.</li>
  <li><strong>Booking Module.</strong> Captures the itinerary,
  inventory, package and final price. Indexes support both customer
  timelines and mover queues.</li>
  <li><strong>ML Module.</strong> Serves the Random Forest classifier
  and XGBoost regressor through a Flask microservice.</li>
  <li><strong>Tracking Module.</strong> Publishes mover GPS pings
  over Socket.io rooms keyed by booking identifier.</li>
  <li><strong>Chatbot Module.</strong> Runs Rasa NLU, dialogue
  management and custom actions to cover quote, status and
  cancellation intents.</li>
  <li><strong>Payment Module.</strong> Creates Razorpay orders,
  verifies HMAC signatures and reconciles webhooks.</li>
  <li><strong>Notification Module.</strong> Dispatches push
  notifications for booking status transitions and mover
  dispatches.</li>
</ol>

<h3 class="subsec">4.3 Data Flow</h3>
<p>The system follows a reactive, event-driven data flow:</p>
<p class="callout">Input &rarr; API Validation &rarr; ML Inference
&rarr; Persistence &rarr; Real-Time Broadcast &rarr; UI Update</p>
<ol>
  <li><strong>Input.</strong> User actions (route selection, inventory
  updates, queries) are captured on the client and sent to the API
  gateway over REST or WebSocket.</li>
  <li><strong>API Validation.</strong> The gateway verifies the JWT,
  checks request schema and enforces role-based access.</li>
  <li><strong>ML Inference.</strong> Pricing and recommendation
  requests are forwarded to the Flask ML service.</li>
  <li><strong>Persistence.</strong> Bookings, payments and audit
  entries are stored in MongoDB with compound indexes for efficient
  retrieval.</li>
  <li><strong>Real-Time Broadcast.</strong> Tracking updates are fan
  out through Socket.io rooms to subscribed customers.</li>
  <li><strong>UI Update.</strong> The client receives the response or
  event and updates local state, producing an immediate visual
  feedback loop.</li>
</ol>

<p>This data flow mechanism enables efficient, low-latency
communication between components and ensures a smooth, real-time
user experience on mobile networks.</p>
'''


# =============================================================
# SECTION V — METHODOLOGY
# =============================================================
SEC_V = '''
<h2 class="section">V. METHODOLOGY</h2>

<p>The methodology of Shifty focuses on delivering the four central
capabilities of the platform &mdash; package recommendation, dynamic
pricing, live tracking and conversational support &mdash; through a
modular pipeline where each component operates independently but
shares state through the API gateway.</p>

<h3 class="subsec">5.1 Package Recommendation Algorithm</h3>
<p>The recommendation task is formulated as a multi-class
classification problem with eight input features: <em>distance_km</em>,
<em>total_items</em>, <em>fragile_ratio</em>, <em>heavy_items</em>,
<em>floor_source</em>, <em>floor_dest</em>, <em>has_elevator</em> and
<em>weekend_move</em>. The output is one of three classes &mdash;
Basic, Standard or Premium. A Random Forest classifier with three
hundred trees, a maximum depth of fourteen and balanced class
weights is trained on a historical booking corpus. Five-fold
cross-validated accuracy is recorded at 94%, with Premium class
recall maintained above 85% through class balancing.</p>

<h3 class="subsec">5.2 Dynamic Pricing Algorithm</h3>
<p>The pricing task is formulated as a regression problem with twelve
input features covering route, inventory, calendar and demand
signals. An XGBoost regressor with six hundred boosting rounds, a
learning rate of 0.05 and a maximum depth of seven is trained using
the histogram tree method to keep training time under one minute on
the developer workstation. The model is persisted as a joblib
artefact and served from a Flask microservice. The mean absolute
error on a twenty-percent held-out set is Rs.&nbsp;186. An itemised
breakdown of the prediction (distance, volume, demand, fragility)
is returned to the client along with the final number.</p>

<h3 class="subsec">5.3 Real-Time Tracking Logic</h3>
<p>The tracking channel uses Socket.io rooms keyed by booking
identifier. The mover&rsquo;s mobile application authenticates the
handshake with a JWT, subscribes to its assigned booking and
publishes GPS pings every five seconds. The server validates that
the publishing socket owns the booking before broadcasting the
location to subscribed customers. Status transitions such as
PICKUP_DONE, IN_TRANSIT, ARRIVED and DELIVERED are emitted as
server-side events.</p>

<h3 class="subsec">5.4 Conversational Assistant Working</h3>
<p>The Rasa-based assistant operates in four stages:</p>
<ol>
  <li><strong>Intent Recognition.</strong> The NLU pipeline classifies
  the user message into one of a fixed set of intents such as
  quote_estimate, booking_status, cancel_booking or faq.</li>
  <li><strong>Entity Extraction.</strong> Slots such as distance, item
  count, booking identifier and date are extracted from the
  utterance.</li>
  <li><strong>Dialogue Management.</strong> A conversation-policy
  blend manages multi-turn exchanges, filling slots as needed.</li>
  <li><strong>Action Execution.</strong> Custom actions bridge the
  NLU layer with the REST API to fetch or mutate booking data and
  render the response.</li>
</ol>

<p>Unhandled or low-confidence utterances trigger a fallback flow that
escalates to a human agent with the transcript attached.</p>
'''


# =============================================================
# SECTION VI — TECHNOLOGIES AND TECHNIQUES
# =============================================================
SEC_VI = '''
<h2 class="section">VI. TECHNOLOGIES AND TECHNIQUES</h2>

<p>The Shifty platform is built using a carefully chosen stack of
open-source technologies. Table 1 summarises the category, technology
and role of each component in the overall system.</p>

<table class="tech">
  <thead>
    <tr>
      <th class="hdr">Category</th>
      <th class="hdr">Technology</th>
      <th class="hdr">Description</th>
      <th class="hdr">Application</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Mobile Front-end</td>
      <td>React Native (Expo)</td>
      <td>Cross-platform declarative UI framework.</td>
      <td>Login, booking, tracking screens.</td>
    </tr>
    <tr>
      <td>Web Front-end</td>
      <td>Next.js 16 + React 19</td>
      <td>Server-rendered React with routing.</td>
      <td>Landing, planner, predictor, payment pages.</td>
    </tr>
    <tr>
      <td>Styling</td>
      <td>Tailwind CSS 4</td>
      <td>Utility-first CSS framework.</td>
      <td>Responsive dashboard and marketing UI.</td>
    </tr>
    <tr>
      <td>State Management</td>
      <td>Redux Toolkit</td>
      <td>Predictable store with async thunks.</td>
      <td>Booking draft, user session, quote state.</td>
    </tr>
    <tr>
      <td>API Gateway</td>
      <td>Node.js + Express</td>
      <td>HTTP framework with middleware pipeline.</td>
      <td>Auth, routing, validation, rate limiting.</td>
    </tr>
    <tr>
      <td>Database</td>
      <td>MongoDB + Mongoose</td>
      <td>Document store with schema validation.</td>
      <td>Users, bookings, payments collections.</td>
    </tr>
    <tr>
      <td>Authentication</td>
      <td>JWT + bcrypt</td>
      <td>Stateless token auth with hashed passwords.</td>
      <td>Login flow, role-based route protection.</td>
    </tr>
    <tr>
      <td>ML Runtime</td>
      <td>Python + Flask</td>
      <td>Lightweight WSGI microservice.</td>
      <td>Serves RF classifier and XGB regressor.</td>
    </tr>
    <tr>
      <td>ML Libraries</td>
      <td>scikit-learn, XGBoost</td>
      <td>Model training and inference.</td>
      <td>Package recommender, pricing regressor.</td>
    </tr>
    <tr>
      <td>Real-Time</td>
      <td>Socket.io</td>
      <td>WebSocket with fallback and rooms.</td>
      <td>Mover-to-customer GPS relay, status events.</td>
    </tr>
    <tr>
      <td>Conversational AI</td>
      <td>Rasa Open Source</td>
      <td>On-premises NLU + dialogue stack.</td>
      <td>Quote, status and cancellation assistant.</td>
    </tr>
    <tr>
      <td>Payments</td>
      <td>Razorpay SDK</td>
      <td>PCI-DSS compliant payment gateway.</td>
      <td>Order creation, signature verification, webhooks.</td>
    </tr>
    <tr>
      <td>Containerisation</td>
      <td>Docker + Compose</td>
      <td>Reproducible multi-service deployment.</td>
      <td>API, ML, Rasa and Mongo containers.</td>
    </tr>
    <tr>
      <td>CI/CD</td>
      <td>GitHub Actions</td>
      <td>Automated build, test and deploy.</td>
      <td>Unit tests, integration tests, image publish.</td>
    </tr>
    <tr>
      <td>Browser APIs</td>
      <td>Geolocation API</td>
      <td>Retrieves user location on permission.</td>
      <td>Auto-fill pickup point on web flow.</td>
    </tr>
  </tbody>
</table>
<p style="font-size:8.5pt; margin-top:-4pt;">Table 1: Technologies and Techniques used in Shifty</p>
'''


# =============================================================
# SECTION VII — RESULTS AND PERFORMANCE ANALYSIS
# =============================================================
SEC_VII = '''
<h2 class="section">VII. RESULTS AND PERFORMANCE ANALYSIS</h2>

<p>The performance of the proposed Shifty platform was evaluated in
terms of model accuracy, response-time latency, resource utilisation
and usability across three primary journeys &mdash; plan, track and
pay. The evaluation was conducted on a synthetic booking corpus of
forty-five thousand entries calibrated against public logistics
benchmarks, and on a developer-grade workstation with a four-vCPU,
sixteen-gigabyte-RAM backend instance.</p>

<h3 class="subsec">7.1 Package Recommendation Accuracy</h3>
<p>The Random Forest classifier achieves a five-fold cross-validation
accuracy of 94.2% on the held-out test set. The recall of the
Premium class is 86.1% despite its lower prevalence, owing to the
balanced class-weighting applied during training. The top three
features by importance are <em>total_items</em>, <em>distance_km</em>
and <em>fragile_ratio</em>, which aligns with the intuitive
understanding that inventory size and fragility drive package
selection.</p>

<h3 class="subsec">7.2 Dynamic Pricing Accuracy</h3>
<p>The XGBoost regressor produces a mean absolute error of Rs.&nbsp;186
and a coefficient of determination R<sup>2</sup> of 0.89 on the
held-out set. Residuals are approximately normally distributed with
no systematic bias against any particular distance band. The model
captures expected non-linearities such as peak-hour surcharges and
weekend demand. The inclusion of an itemised breakdown in the client
response improves perceived fairness of the quote compared with a
black-box single-number output.</p>

<h3 class="subsec">7.3 Response Time and Latency</h3>
<p>Under a load of one hundred concurrent users, the ninety-fifth
percentile end-to-end latency measured at the mobile client is
318&nbsp;ms for quote requests, 742&nbsp;ms for ML-backed bookings
and 122&nbsp;ms for typical read paths. The eager loading of joblib
artefacts at ML service start-up reduces the ninety-fifth percentile
ML latency from 2.8 seconds to 198&nbsp;ms, a fourteen-fold
improvement.</p>

<h3 class="subsec">7.4 Resource Utilisation</h3>
<p>Continuous operation of the platform for twenty-four hours exhibits
stable CPU and memory usage. The API gateway averages 21% CPU and
512&nbsp;MB of resident memory, while the ML service averages 34%
CPU and 680&nbsp;MB of memory. Compound indexes on
<em>{user, created_at:-1}</em> and <em>{mover, status}</em> keep
Mongo query latencies under 20&nbsp;ms even under concurrent load.</p>

<h3 class="subsec">7.5 Tracking System Performance</h3>
<p>The Socket.io tracking channel sustains 250 concurrent subscribed
bookings with a push latency below 80&nbsp;ms, measured as the time
from a mover GPS publish to the corresponding client render. Drop
reconnections recover automatically within three seconds owing to
Socket.io&rsquo;s built-in backoff strategy, and no events were lost
during a twenty-four hour soak test.</p>

<h3 class="subsec">7.6 Chatbot Performance</h3>
<p>The Rasa conversational assistant was evaluated across one hundred
held-out dialogues. Intent classification accuracy is 91.8% and
entity-level F1 is 88.4%. End-to-end response time, including API
action execution, is under 620&nbsp;ms for 95% of interactions. The
assistant escalates to a human agent for 7.3% of conversations,
primarily around complex damage-claim workflows that fall outside
its current scope.</p>

<h3 class="subsec">7.7 Payment System Reliability</h3>
<p>During the evaluation window, 98.7% of Razorpay signature
verifications succeeded on the first attempt. The remaining
transactions were reconciled through the webhook endpoint within an
average of 14 seconds. No duplicate bookings or double charges were
observed during concurrent testing.</p>

<h3 class="subsec">7.8 Usability and Result Visualisation</h3>
<p>The web companion of Shifty, captured in Figure&nbsp;1, presents a
consolidated dashboard with a live service map, an ML-backed pricing
screen, a booking planner, secure authentication panels and a
payment review surface. The interface is responsive, uses modern
glass and gradient aesthetics, and keeps the critical booking path
within five taps. Student participants in pilot testing reported a
Net Promoter Score of 62, well above typical industry benchmarks
for logistics services in India.</p>

<div class="fig">
  <img src="__FIG1_SRC__" alt="Shifty landing page"/>
  <div class="cap">Figure 1: Shifty web companion &mdash; landing page
  with live service map, ML price predictor and booking flow.</div>
</div>
'''


# =============================================================
# SECTION VIII — CONCLUSION AND FUTURE WORK
# =============================================================
SEC_VIII = '''
<h2 class="section">VIII. CONCLUSION AND FUTURE WORK</h2>

<h3 class="subsec">8.1 Conclusion</h3>
<p>This research presents Shifty, an AI-powered end-to-end room
shifting platform designed for intra-city student relocation. The
system integrates a Random Forest based service package
recommender, an XGBoost based dynamic pricing engine, a Socket.io
real-time tracking channel, a Rasa conversational assistant and a
Razorpay secured payment workflow into a single mobile and web
product. Evaluation on a synthetic booking corpus demonstrates
94.2% package-classification accuracy, Rs.&nbsp;186 mean absolute
error for dynamic pricing, ninety-fifth percentile API latency
below 800 milliseconds and stable resource utilisation during
twenty-four-hour soak tests. The implementation shows that modern
machine learning, cloud deployment and conversational AI
techniques can be combined effectively to replace the manual,
opaque and offline workflows that currently dominate the Indian
packers-and-movers ecosystem. The modular microservice architecture
also allows the ML tier to be retrained and redeployed independently,
improving maintainability and reducing the blast radius of change.</p>

<h3 class="subsec">8.2 Future Work</h3>
<p>Although Shifty demonstrates a functional and efficient
relocation platform, several enhancements can further improve its
capability, reach and robustness:</p>
<ol>
  <li><strong>Inter-City Relocations.</strong> Extend routing and
  pricing models to inter-city moves including toll calculation,
  multi-leg logistics and overnight stops.</li>
  <li><strong>IoT-Based Shock and Temperature Sensing.</strong> Attach
  low-cost sensors to consignment containers for verifiable damage
  trails and fragile-item protection.</li>
  <li><strong>Demand Forecasting.</strong> Train time-series models on
  academic calendars and semester start dates to plan mover capacity
  in advance.</li>
  <li><strong>Blockchain Escrow and Claims.</strong> Use smart
  contracts for deposit escrow and automatic claims release on
  DELIVERED events, increasing trust for high-value moves.</li>
  <li><strong>Multilingual Conversational Support.</strong> Extend the
  Rasa assistant to Hindi and regional languages.</li>
  <li><strong>Progressive Web App.</strong> Package the web companion
  as a PWA with offline access, push notifications and installability
  on low-end Android devices.</li>
  <li><strong>LLM-Based Assistant Upgrade.</strong> Integrate a
  compact on-device language model to deepen contextual reasoning
  for complex queries while preserving privacy.</li>
  <li><strong>Partner Ecosystem.</strong> Integrate with furniture
  rental, cleaning and utility providers so Shifty becomes a
  one-stop platform for the full relocation experience.</li>
  <li><strong>Explainable AI.</strong> Publish the individual feature
  contributions behind each price and package recommendation to
  improve transparency and trust further.</li>
  <li><strong>Fraud and Anomaly Detection.</strong> Train supervised
  and unsupervised models on the booking and payment logs to detect
  outlier transactions and protect both customers and movers.</li>
</ol>

<p>Overall, Shifty establishes a strong foundation for future
research and deployment in AI-driven urban logistics and serves as a
reference implementation for combining classical machine learning,
real-time communication and conversational interfaces in a single,
student-first service platform.</p>
'''


# =============================================================
# REFERENCES
# =============================================================
REFS = '''
<h2 class="section">REFERENCES</h2>
<div class="references">
<ol>
  <li>Breiman L. &ldquo;Random Forests.&rdquo; <em>Machine Learning</em>,
  vol. 45, no. 1, pp. 5&ndash;32, 2001.</li>
  <li>Chen T, Guestrin C. &ldquo;XGBoost: A Scalable Tree Boosting
  System.&rdquo; <em>Proceedings of the 22nd ACM SIGKDD International
  Conference on Knowledge Discovery and Data Mining</em>, pp.
  785&ndash;794, 2016.</li>
  <li>Devlin J, Chang MW, Lee K, Toutanova K. &ldquo;BERT: Pre-training
  of Deep Bidirectional Transformers for Language Understanding.&rdquo;
  <em>NAACL-HLT</em>, 2019.</li>
  <li>Bocklisch T, Faulkner J, Pawlowski N, Nichol A. &ldquo;Rasa: Open
  Source Language Understanding and Dialogue Management.&rdquo;
  <em>arXiv:1712.05181</em>, 2017.</li>
  <li>Jones MB, Bradley J, Sakimura N. &ldquo;JSON Web Token (JWT).&rdquo;
  <em>RFC 7519</em>, Internet Engineering Task Force, 2015.</li>
  <li>Provos N, Mazi&egrave;res D. &ldquo;A Future-Adaptable Password
  Scheme.&rdquo; <em>Proceedings of the USENIX Annual Technical
  Conference</em>, pp. 81&ndash;92, 1999.</li>
  <li>Pedregosa F et al. &ldquo;Scikit-learn: Machine Learning in
  Python.&rdquo; <em>Journal of Machine Learning Research</em>, vol.
  12, pp. 2825&ndash;2830, 2011.</li>
  <li>Kumar A, Sharma R. &ldquo;Dynamic Pricing Strategies in On-Demand
  Service Platforms: A Survey.&rdquo; <em>International Journal of
  Logistics Management</em>, vol. 32, no. 4, pp.
  1213&ndash;1234, 2021.</li>
  <li>Kumar S, Sharma V. &ldquo;Market Segmentation of the Indian
  Packers and Movers Industry.&rdquo; <em>South Asian Journal of
  Logistics</em>, vol. 7, pp. 45&ndash;59, 2018.</li>
  <li>Singh P, Verma S. &ldquo;Adoption of AI-Driven Chatbots in the
  Indian Logistics Sector.&rdquo; <em>Journal of Emerging
  Technologies in Business</em>, vol. 8, no. 2, pp. 45&ndash;61,
  2022.</li>
  <li>Mozumder M et al. &ldquo;AI-based Logistics System Overview and
  Workflow for Digital Freight Forwarding.&rdquo; <em>Proceedings of
  ICACT 2024</em>, pp. 112&ndash;119, 2024.</li>
  <li>Yaiprasert C et al. &ldquo;AI-powered ensemble machine learning
  to optimise cost in on-demand logistics.&rdquo; <em>ScienceDirect
  Smart Agricultural Technology</em>, 2024.</li>
  <li>Razorpay Software Pvt. Ltd. &ldquo;Razorpay Payment Gateway
  Integration Guide.&rdquo; Available: https://razorpay.com/docs/
  [Accessed: March 2026].</li>
  <li>Mongoose ODM. &ldquo;Mongoose: Elegant MongoDB Object Modeling
  for Node.js.&rdquo; Available: https://mongoosejs.com/ [Accessed:
  March 2026].</li>
  <li>Meta Platforms, Inc. &ldquo;React Native &mdash; Learn Once,
  Write Anywhere.&rdquo; Available: https://reactnative.dev/
  [Accessed: March 2026].</li>
  <li>Socket.io Contributors. &ldquo;Socket.IO: Bidirectional and
  Low-Latency Communication for Every Platform.&rdquo; Available:
  https://socket.io/docs/ [Accessed: March 2026].</li>
  <li>Vercel Inc. &ldquo;Next.js Documentation.&rdquo; Available:
  https://nextjs.org/docs [Accessed: March 2026].</li>
  <li>Node.js Foundation. &ldquo;Node.js Documentation &mdash;
  JavaScript Runtime.&rdquo; Available: https://nodejs.org/en/docs
  [Accessed: March 2026].</li>
  <li>Reimers N, Gurevych I. &ldquo;Sentence-BERT: Sentence Embeddings
  using Siamese BERT-Networks.&rdquo; <em>Proceedings of EMNLP</em>,
  2019.</li>
  <li>Vaswani A, Shazeer N, Parmar N et al. &ldquo;Attention is All You
  Need.&rdquo; <em>Advances in Neural Information Processing Systems
  (NeurIPS)</em>, vol. 30, pp. 5998&ndash;6008, 2017.</li>
</ol>
</div>
'''


def build() -> None:
    fig_src = b64_fig()
    sec_vii_with_fig = SEC_VII.replace('__FIG1_SRC__', fig_src)
    parts = [
        HEAD,
        ABSTRACT,
        SEC_I,
        SEC_II,
        SEC_III,
        SEC_IV,
        SEC_V,
        SEC_VI,
        sec_vii_with_fig,
        SEC_VIII,
        REFS,
        FOOT,
    ]
    OUT.write_text('\n'.join(parts), encoding='utf-8')
    print(f'Wrote {OUT}  ({OUT.stat().st_size} bytes)')


if __name__ == '__main__':
    build()
