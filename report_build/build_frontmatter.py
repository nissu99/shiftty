#!/usr/bin/env python3
"""Build reference-style front matter for the Shifty report."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'frontmatter.html'

HEAD = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Shifty — Front Matter</title>
<style>
@page { size: A4; margin: 25mm 25mm 22mm 25mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: 'Times New Roman', 'Liberation Serif', serif;
  font-size: 12pt;
  line-height: 1.5;
  color: #000;
  text-align: justify;
}

.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }

/* ---------- Title page ---------- */
.title-page { text-align: center; }
.title-page .label {
  font-size: 14pt;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #000;
  padding-bottom: 10pt;
  margin-bottom: 14pt;
}
.title-page h1.project-title {
  font-size: 18pt;
  font-weight: bold;
  text-align: center;
  margin: 14pt 0 14pt 0;
  border-bottom: 1px solid #000;
  padding-bottom: 14pt;
  line-height: 1.3;
}
.title-page .fulfil {
  font-size: 12pt;
  font-weight: bold;
  margin: 18pt 0 14pt 0;
}
.title-page .degree {
  font-size: 13pt;
  font-weight: bold;
  line-height: 1.8;
  margin-bottom: 14pt;
}
.title-page .submitted-by {
  font-style: italic;
  margin: 10pt 0 8pt 0;
}
.title-page table.team {
  margin: 0 auto 18pt auto;
  border-collapse: collapse;
}
.title-page table.team th, .title-page table.team td {
  border: 1px solid #000;
  padding: 5pt 22pt;
  font-size: 12pt;
  text-align: center;
}
.title-page table.team th { font-weight: bold; }
.title-page .guide { margin: 14pt 0 4pt 0; }
.title-page .guide-name { font-style: italic; margin: 4pt 0; }
.title-page .designation { font-style: italic; margin: 4pt 0 10pt 0; }
.title-page .group-no { margin: 4pt 0 14pt 0; }
.title-page .logo {
  width: 70pt;
  margin: 8pt auto 10pt auto;
  display: block;
}
.title-page .dept {
  font-size: 13pt;
  font-weight: bold;
  margin: 16pt 0 6pt 0;
}
.title-page .univ {
  font-size: 13pt;
  font-weight: bold;
  margin: 6pt 0;
}

/* ---------- Generic page heading (centered bold 14pt) ---------- */
h1.page-title {
  font-size: 14pt;
  font-weight: bold;
  text-align: center;
  margin: 0 0 22pt 0;
}

/* ---------- Declaration, Ack, Abstract body ---------- */
p { margin: 0 0 10pt 0; text-align: justify; line-height: 1.5; }

/* ---------- Signatory block ---------- */
.sign-block { margin-top: 30pt; }
.sign-block p { text-align: center; margin: 2pt 0; }

/* ---------- TOC / List tables ---------- */
table.toc {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6pt;
  font-size: 12pt;
}
table.toc th, table.toc td {
  border: 1px solid #000;
  padding: 6pt 10pt;
  vertical-align: middle;
}
table.toc th { background: #e8e8e8; text-align: center; font-weight: bold; }
table.toc td.chap { text-align: center; font-weight: bold; width: 18%; }
table.toc td.sub  { text-align: center; width: 18%; }
table.toc td.title { text-align: left; font-weight: bold; }
table.toc td.subtitle { text-align: left; }

/* ---------- List of Tables/Figures/Abbreviations ---------- */
table.list {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6pt;
  font-size: 12pt;
}
table.list th, table.list td {
  border: 1px solid #000;
  padding: 8pt 10pt;
}
table.list th { text-align: center; font-weight: bold; background: #e8e8e8; }
table.list td.num { text-align: left; width: 30%; font-weight: bold; }

/* ---------- Abbreviations layout ---------- */
table.abbr td.abbr-key { font-weight: bold; width: 30%; }

/* ---------- Front-matter page numbering notes ---------- */
.pagenum-note { font-size: 10pt; color: #666; }

/* ---------- Section intro paragraph ---------- */
p.intro { text-indent: 0.2in; }

/* ---------- Bold inline ---------- */
strong { font-weight: bold; }
em { font-style: italic; }
</style>
</head>
<body>
'''

FOOT = '\n</body>\n</html>\n'


def title_page() -> str:
    return '''
<div class="page title-page">
  <div class="label">PROJECT REPORT</div>
  <h1 class="project-title">SHIFTY: YOUR ROOM SHIFTING SOLUTION<br/>
    <span style="font-size: 14pt; font-weight: normal;">AN AI-POWERED PERSONAL RELOCATION PLATFORM</span>
  </h1>
  <p class="fulfil">Submitted in partial fulfilment of the requirement for the award of the degree of</p>
  <div class="degree">
    BACHELOR OF TECHNOLOGY<br/>
    IN<br/>
    COMPUTER SCIENCE &amp; ENGINEERING
  </div>
  <div class="submitted-by"><em>Submitted by</em></div>
  <table class="team">
    <tr><th>NAMES</th><th>UNIVERSITY ROLL NO.</th></tr>
    <tr><td>Animesh Rawat</td><td>2218355</td></tr>
    <tr><td>Mubasherah Anwar</td><td>2219113</td></tr>
    <tr><td>Tushar Goel</td><td>2219833</td></tr>
    <tr><td>Vishal Parjapati</td><td>2219937</td></tr>
  </table>
  <div class="guide">Under the guidance of</div>
  <div class="guide-name"><em>Mr. Deepak Upadhayay</em></div>
  <div class="designation"><em>Assistant Professor</em></div>
  <div class="group-no"><strong>Project Group No: 307</strong></div>
  <div class="dept">Department of Computer Science and Engineering</div>
  <div class="univ">Graphic Era Hill University</div>
  <div class="univ">May, 2026</div>
</div>
'''


def declaration_page() -> str:
    return '''
<div class="page">
  <h1 class="page-title">CANDIDATE&rsquo;S DECLARATION</h1>
  <p>We hereby certify that the work which is being presented in the project
  report entitled <strong>&ldquo;SHIFTY: Your Room Shifting Solution &ndash; An AI-Powered
  Personal Relocation Platform&rdquo;</strong> in partial fulfilment of the requirements
  for the award of the Degree of Bachelor of Technology in Computer Science and
  Engineering in the Department of Computer Science and Engineering of the Graphic
  Era Hill University, Dehradun, shall be carried out by the undersigned under
  the supervision of <strong>Mr. Deepak Upadhayay, Assistant Professor</strong>,
  Department of Computer Science and Engineering, Graphic Era Hill University,
  Dehradun.</p>

  <div class="sign-block">
    <p>Animesh Rawat (2218355)</p>
    <p>Mubasherah Anwar (2219113)</p>
    <p>Tushar Goel (2219833)</p>
    <p>Vishal Parjapati (2219937)</p>
  </div>

  <p style="margin-top: 24pt;">This project has been developed under the
  guidance and supervision of the undersigned faculty guide on the topic
  <strong>&ldquo;SHIFTY: Your Room Shifting Solution&rdquo;</strong>.</p>

  <div style="margin-top: 30pt; display: flex; justify-content: space-between;">
    <div>
      <p style="text-align:left;"><strong>Guide:</strong></p>
      <p style="text-align:left;">Mr. Deepak Upadhayay</p>
      <p style="text-align:left;">Date</p>
      <p style="text-align:left;">Place</p>
    </div>
    <div style="text-align:right;">
      <p style="text-align:right;"><strong>Head of the Department</strong></p>
    </div>
  </div>
</div>
'''


def acknowledgement_page() -> str:
    return '''
<div class="page">
  <h1 class="page-title">ACKNOWLEDGEMENT</h1>
  <p>We would like to express our sincere gratitude to our project guide
  <strong>Mr. Deepak Upadhayay</strong>, Assistant Professor, Department of
  Computer Science &amp; Engineering, for his invaluable guidance, continuous
  support, and encouragement throughout the development of this project
  <strong>&ldquo;SHIFTY: Your Room Shifting Solution.&rdquo;</strong> We are also
  deeply thankful to the Department of Computer Science &amp; Engineering,
  Graphic Era Hill University, Dehradun, for providing us with the necessary
  infrastructure, resources, and academic environment required to successfully
  complete this work.</p>

  <p>Our heartfelt thanks go to our family and friends for their constant
  motivation, support, and encouragement throughout the project journey.</p>

  <div style="margin-top: 120pt;">
    <table style="width:100%; border:0;">
      <tr>
        <td style="text-align:left; border:0;"><strong>Animesh Rawat</strong><br/>Roll no. 2218355</td>
        <td style="text-align:right; border:0;"><strong>Mubasherah Anwar</strong><br/>Roll no. 2219113</td>
      </tr>
      <tr><td colspan="2" style="border:0; height: 20pt;"></td></tr>
      <tr>
        <td style="text-align:left; border:0;"><strong>Tushar Goel</strong><br/>Roll no. 2219833</td>
        <td style="text-align:right; border:0;"><strong>Vishal Parjapati</strong><br/>Roll no. 2219937</td>
      </tr>
    </table>
  </div>
</div>
'''


def abstract_page() -> str:
    return '''
<div class="page">
  <h1 class="page-title">ABSTRACT</h1>
  <p>The logistics of residential relocation, even for small-scale moves, are
  fraught with inefficiencies, opaque pricing structures, and a lack of
  personalised customer service. The process is often manual, time-consuming,
  and stressful for the user. This project, titled <strong>SHIFTY</strong>,
  presents a comprehensive mobile application designed to streamline and
  revolutionise the room-shifting experience by leveraging the power of
  Machine Learning (ML) and Artificial Intelligence (AI).</p>

  <p>The core of SHIFTY is a data-driven approach to logistics. The
  application begins by systematically collecting user inventory data,
  allowing users to catalogue their belongings and specify items that require
  special handling such as delicate or heavy objects. This data serves as the
  input for a suite of intelligent modules. An ML-based recommendation engine
  analyses the inventory size, item types, and fragility to suggest an
  optimised service package including appropriate vehicle size, required
  manpower, and necessary packing materials. Concurrently, a dynamic pricing
  and offer system, also powered by an ML algorithm, calculates a transparent,
  fair, and real-time quote based on variables such as distance, inventory
  volume, item fragility, time of booking, and local demand.</p>

  <p>To enhance user experience and provide round-the-clock support, an
  integrated AI chatbot assists users with navigation, answers queries, and
  facilitates the booking process. The frontend interface offers real-time
  system insights, including booking status, live tracking of consignments,
  and notification of delivery milestones. Authentication and access control
  mechanisms are implemented to restrict unauthorised access to sensitive
  user data.</p>

  <p>This report provides a holistic overview of the project lifecycle, from
  initial ideation and requirement analysis to system architecture, detailed
  implementation of the core ML models, deployment strategies, and evaluation.
  It documents the design and development of the platform, showcasing how
  AI-driven features create a seamless, efficient, and trustworthy solution
  for the modern urban mover.</p>
</div>
'''


def toc_page() -> str:
    rows = [
        ('', '', 'ACKNOWLEDGEMENT', 'i'),
        ('', '', 'ABSTRACT', 'ii'),
        ('', '', 'TABLE OF CONTENTS', 'iii'),
        ('', '', 'LIST OF TABLES', 'v'),
        ('', '', 'LIST OF FIGURES', 'vi'),
        ('', '', 'ABBREVIATIONS', 'vii'),
        ('', '', 'NOTATIONS', 'viii'),
    ]
    chapters = [
        ('1', '', 'Introduction', '1'),
        ('',  '1.1', 'Background and Motivation', '1'),
        ('',  '1.2', 'Problem Statement', '2'),
        ('',  '1.3', 'Objectives of the Project', '3'),
        ('',  '1.4', 'Organization of the Report', '4'),
        ('2', '', 'Literature Review', '5'),
        ('',  '2.1', 'Traditional Packers and Movers Systems', '5'),
        ('',  '2.2', 'Web and Mobile-Based Booking Platforms', '6'),
        ('',  '2.3', 'Machine Learning in Logistics', '6'),
        ('',  '2.4', 'Dynamic Pricing in Service Platforms', '8'),
        ('',  '2.5', 'Real-Time Tracking and Location Systems', '8'),
        ('',  '2.6', 'Conversational AI for Service Booking', '9'),
        ('',  '2.7', 'Comparative Study of Moving Service Approaches', '9'),
        ('',  '2.8', 'Conclusion of Literature Review', '10'),
        ('3', '', 'System Requirements and Analysis', '11'),
        ('',  '3.1', 'Overview', '11'),
        ('',  '3.2', 'Purpose', '11'),
        ('',  '3.3', 'Hardware Requirements', '11'),
        ('',  '3.4', 'Software Requirements', '12'),
        ('',  '3.5', 'Functional Requirements', '13'),
        ('',  '3.6', 'Non-Functional Requirements', '14'),
        ('',  '3.7', 'Feasibility Study', '15'),
        ('',  '3.8', 'System Analysis Summary', '16'),
        ('4', '', 'System Design and Architecture', '17'),
        ('',  '4.1', 'Overview', '17'),
        ('',  '4.2', 'System Architecture', '17'),
        ('',  '4.3', 'Components and Modules', '18'),
        ('',  '4.4', 'System Design Workflow', '19'),
        ('',  '4.5', 'Flow Diagram', '19'),
        ('',  '4.6', 'Design Considerations', '20'),
        ('',  '4.7', 'Database Schema Design', '21'),
        ('',  '4.8', 'Workflow of Shifty System', '22'),
        ('5', '', 'Implementation', '23'),
        ('',  '5.1', 'Overview', '23'),
        ('',  '5.2', 'Software Stack', '23'),
        ('',  '5.3', 'System Implementation', '24'),
        ('',  '5.4', 'Algorithm Implementation', '25'),
        ('',  '5.5', 'System Flow Control', '26'),
        ('',  '5.6', 'Performance and Optimization', '26'),
        ('',  '5.7', 'Testing and Validation', '27'),
        ('',  '5.8', 'Software Setup and Code Integration', '28'),
        ('',  '5.9', 'Real-Time System Monitoring and Dashboard Output', '28'),
        ('6', '', 'Conclusion and Future Scope', '30'),
        ('',  '6.1', 'Conclusion', '30'),
        ('',  '6.2', 'Future Enhancements', '31'),
        ('',  '',    'APPENDIX', '33'),
        ('',  '',    'REFERENCES', '61'),
    ]

    body = ''
    for ch, sub, title, page in (rows + chapters):
        if ch:
            body += f'<tr><td class="chap">{ch}</td><td></td><td class="title">{title}</td><td style="text-align:center;">{page}</td></tr>\n'
        elif sub:
            body += f'<tr><td></td><td class="sub">{sub}</td><td class="subtitle">{title}</td><td style="text-align:center;">{page}</td></tr>\n'
        else:
            body += f'<tr><td colspan="3" class="title">{title}</td><td style="text-align:center;">{page}</td></tr>\n'

    return f'''
<div class="page">
  <h1 class="page-title">TABLE OF CONTENTS</h1>
  <table class="toc">
    <thead>
      <tr><th>Chapter No.</th><th>Section</th><th>Title</th><th>Page</th></tr>
    </thead>
    <tbody>
      {body}
    </tbody>
  </table>
</div>
'''


def list_of_tables() -> str:
    return '''
<div class="page">
  <h1 class="page-title">LIST OF TABLES</h1>
  <table class="list">
    <thead>
      <tr><th style="width:30%;">Table No.</th><th>Title</th></tr>
    </thead>
    <tbody>
      <tr><td class="num">Table 1</td><td>Comparison of Traditional vs. AI-based Moving Platforms</td></tr>
      <tr><td class="num">Table 2</td><td>Functional Requirements of SHIFTY System</td></tr>
      <tr><td class="num">Table 3</td><td>Non-Functional Requirements of SHIFTY System</td></tr>
      <tr><td class="num">Table 4</td><td>Module-wise Implementation Status</td></tr>
      <tr><td class="num">Table 5</td><td>Testing and Validation Summary</td></tr>
    </tbody>
  </table>
</div>
'''


def list_of_figures() -> str:
    return '''
<div class="page">
  <h1 class="page-title">LIST OF FIGURES</h1>
  <table class="list">
    <thead>
      <tr><th style="width:30%;">Figure No.</th><th>Title</th></tr>
    </thead>
    <tbody>
      <tr><td class="num">Figure 1</td><td>Pain-point Fishbone Diagram of Traditional Relocation Experience</td></tr>
      <tr><td class="num">Figure 2</td><td>SHIFTY Target Audience and Their Needs</td></tr>
      <tr><td class="num">Figure 3</td><td>High-level System Architecture of SHIFTY</td></tr>
      <tr><td class="num">Figure 4</td><td>Entity-Relationship Diagram of the SHIFTY Database</td></tr>
      <tr><td class="num">Figure 5</td><td>UML Use-case Diagram of SHIFTY Platform</td></tr>
      <tr><td class="num">Figure 6</td><td>Data Flow of the AI-Powered Package Recommender</td></tr>
      <tr><td class="num">Figure 7</td><td>Dynamic Pricing Pipeline using XGBoost</td></tr>
      <tr><td class="num">Figure 8</td><td>Conversational Assistant Interaction Flow</td></tr>
      <tr><td class="num">Figure 9</td><td>Live Tracking Socket Architecture</td></tr>
      <tr><td class="num">Figure 10</td><td>Payment Subsystem Sequence Diagram</td></tr>
      <tr><td class="num">Figure 11</td><td>Module-wise Completion Progress Chart</td></tr>
      <tr><td class="num">Figure 12</td><td>Landing Page of the Shifty Web Prototype</td></tr>
      <tr><td class="num">Figure 13</td><td>Booking Planner Capturing Itinerary and Inventory</td></tr>
      <tr><td class="num">Figure 14</td><td>Price Prediction Screen Showing Model-Generated Quote</td></tr>
      <tr><td class="num">Figure 15</td><td>Payment Review Screen Prior to Gateway Hand-off</td></tr>
      <tr><td class="num">Figure 16</td><td>Sign-in Screen for Secure Access in Shifty System</td></tr>
      <tr><td class="num">Figure 17</td><td>Account Creation Screen with Inline Validation</td></tr>
    </tbody>
  </table>
</div>
'''


def abbreviations_page() -> str:
    return '''
<div class="page">
  <h1 class="page-title">ABBREVIATIONS</h1>
  <table class="list abbr">
    <thead>
      <tr><th style="width:30%;">Abbreviation</th><th>Full Form</th></tr>
    </thead>
    <tbody>
      <tr><td class="abbr-key">AI</td><td>Artificial Intelligence</td></tr>
      <tr><td class="abbr-key">ML</td><td>Machine Learning</td></tr>
      <tr><td class="abbr-key">NLP</td><td>Natural Language Processing</td></tr>
      <tr><td class="abbr-key">API</td><td>Application Programming Interface</td></tr>
      <tr><td class="abbr-key">REST</td><td>Representational State Transfer</td></tr>
      <tr><td class="abbr-key">UI</td><td>User Interface</td></tr>
      <tr><td class="abbr-key">UX</td><td>User Experience</td></tr>
      <tr><td class="abbr-key">SPA</td><td>Single Page Application</td></tr>
      <tr><td class="abbr-key">JWT</td><td>JSON Web Token</td></tr>
      <tr><td class="abbr-key">JSON</td><td>JavaScript Object Notation</td></tr>
      <tr><td class="abbr-key">HTTP</td><td>Hyper Text Transfer Protocol</td></tr>
      <tr><td class="abbr-key">HTTPS</td><td>Hyper Text Transfer Protocol Secure</td></tr>
      <tr><td class="abbr-key">DB</td><td>Database</td></tr>
      <tr><td class="abbr-key">SQL</td><td>Structured Query Language</td></tr>
      <tr><td class="abbr-key">NoSQL</td><td>Not Only SQL</td></tr>
      <tr><td class="abbr-key">CRUD</td><td>Create, Read, Update, Delete</td></tr>
      <tr><td class="abbr-key">GPS</td><td>Global Positioning System</td></tr>
      <tr><td class="abbr-key">RF</td><td>Random Forest</td></tr>
      <tr><td class="abbr-key">XGB</td><td>Extreme Gradient Boosting</td></tr>
      <tr><td class="abbr-key">MAE</td><td>Mean Absolute Error</td></tr>
      <tr><td class="abbr-key">SDK</td><td>Software Development Kit</td></tr>
      <tr><td class="abbr-key">OS</td><td>Operating System</td></tr>
      <tr><td class="abbr-key">CI/CD</td><td>Continuous Integration / Continuous Deployment</td></tr>
      <tr><td class="abbr-key">CLI</td><td>Command Line Interface</td></tr>
      <tr><td class="abbr-key">IDE</td><td>Integrated Development Environment</td></tr>
    </tbody>
  </table>
</div>
'''


def notations_page() -> str:
    return '''
<div class="page">
  <h1 class="page-title">NOTATIONS</h1>
  <table class="list">
    <thead>
      <tr><th style="width:30%;">Symbol</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr><td class="abbr-key">D<sub>km</sub></td><td>Source-to-destination distance in kilometres</td></tr>
      <tr><td class="abbr-key">V<sub>inv</sub></td><td>Total inventory volume</td></tr>
      <tr><td class="abbr-key">N<sub>frag</sub></td><td>Count of fragile items in the inventory</td></tr>
      <tr><td class="abbr-key">P<sub>final</sub></td><td>Final predicted price for a booking</td></tr>
      <tr><td class="abbr-key">P<sub>pack</sub></td><td>Recommended service package (Basic | Standard | Premium)</td></tr>
      <tr><td class="abbr-key">T<sub>move</sub></td><td>Scheduled move date and time</td></tr>
      <tr><td class="abbr-key">&alpha;</td><td>Demand-surge multiplier</td></tr>
      <tr><td class="abbr-key">&beta;</td><td>Fragility penalty weight</td></tr>
      <tr><td class="abbr-key">&lambda;</td><td>Regularisation coefficient of the XGBoost model</td></tr>
      <tr><td class="abbr-key">Q<sub>user</sub></td><td>Natural-language query from the customer</td></tr>
      <tr><td class="abbr-key">R<sub>bot</sub></td><td>Response generated by the AI chatbot</td></tr>
    </tbody>
  </table>
</div>
'''


def references_page() -> str:
    return '''
<div class="page">
  <h1 class="page-title">REFERENCES</h1>
  <p>[1] Breiman, L. &ldquo;Random Forests.&rdquo; <em>Machine Learning</em>, vol. 45, no. 1, pp. 5&ndash;32, 2001.</p>
  <p>[2] Chen, T. and Guestrin, C. &ldquo;XGBoost: A Scalable Tree Boosting System.&rdquo;
  <em>Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge
  Discovery and Data Mining</em>, pp. 785&ndash;794, 2016.</p>
  <p>[3] Devlin, J., Chang, M.-W., Lee, K., and Toutanova, K. &ldquo;BERT: Pre-training
  of Deep Bidirectional Transformers for Language Understanding.&rdquo;
  <em>arXiv preprint arXiv:1810.04805</em>, 2018.</p>
  <p>[4] Bocklisch, T., Faulkner, J., Pawlowski, N., and Nichol, A. &ldquo;Rasa:
  Open Source Language Understanding and Dialogue Management.&rdquo;
  <em>arXiv preprint arXiv:1712.05181</em>, 2017.</p>
  <p>[5] Jones, M. B., Bradley, J., and Sakimura, N. &ldquo;JSON Web Token (JWT).&rdquo;
  <em>RFC 7519</em>, Internet Engineering Task Force, 2015.</p>
  <p>[6] Provos, N. and Mazi&egrave;res, D. &ldquo;A Future-Adaptable Password Scheme.&rdquo;
  <em>Proceedings of the USENIX Annual Technical Conference</em>, pp. 81&ndash;92, 1999.</p>
  <p>[7] Razorpay Software Pvt. Ltd. &ldquo;Razorpay Payment Gateway Integration Guide.&rdquo;
  <em>https://razorpay.com/docs/</em>, accessed March 2026.</p>
  <p>[8] Mongoose ODM. &ldquo;Mongoose: Elegant MongoDB Object Modeling for Node.js.&rdquo;
  <em>https://mongoosejs.com/</em>, accessed March 2026.</p>
  <p>[9] Meta Platforms, Inc. &ldquo;React Native &ndash; Learn Once, Write Anywhere.&rdquo;
  <em>https://reactnative.dev/</em>, accessed March 2026.</p>
  <p>[10] Socket.io Contributors. &ldquo;Socket.IO: Bidirectional and Low-Latency
  Communication for Every Platform.&rdquo; <em>https://socket.io/docs/</em>, accessed
  March 2026.</p>
  <p>[11] Pedregosa, F. et al. &ldquo;Scikit-learn: Machine Learning in Python.&rdquo;
  <em>Journal of Machine Learning Research</em>, vol. 12, pp. 2825&ndash;2830, 2011.</p>
  <p>[12] Kumar, A. and Sharma, R. &ldquo;Dynamic Pricing Strategies in On-Demand
  Service Platforms: A Survey.&rdquo; <em>International Journal of Logistics Management</em>,
  vol. 32, no. 4, pp. 1213&ndash;1234, 2021.</p>
  <p>[13] Singh, P. and Verma, S. &ldquo;Adoption of AI-Driven Chatbots in the
  Indian Logistics Sector.&rdquo; <em>Journal of Emerging Technologies in Business</em>,
  vol. 8, no. 2, pp. 45&ndash;61, 2022.</p>
</div>
'''


def build() -> None:
    parts = [
        HEAD,
        title_page(),
        declaration_page(),
        acknowledgement_page(),
        abstract_page(),
        toc_page(),
        list_of_tables(),
        list_of_figures(),
        abbreviations_page(),
        notations_page(),
        FOOT,
    ]
    OUT.write_text('\n'.join(parts), encoding='utf-8')
    print(f'Wrote {OUT}  ({OUT.stat().st_size} bytes)')


def build_refs() -> None:
    out = ROOT / 'references.html'
    out.write_text(HEAD + references_page() + FOOT, encoding='utf-8')
    print(f'Wrote {out}  ({out.stat().st_size} bytes)')


if __name__ == '__main__':
    build()
    build_refs()
