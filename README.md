# 📋 ExemptAdvisor
## _An Exempt Development Assessment Tool for Sheds and Patios_

**ExemptAdvisor** is a web application designed to streamline the process of determining whether proposed building works are exempt from planning permits.
Built using **Python** and **JavaScript**, the app provides an intuitive questionnaire interface, automated property data retrieval, and accurate assessments based on the **NSW State Environmental Planning Policy (Exempt and Complying Development Codes) 2008**.
Developed in collaboration with **La Trobe University** and **Albury City Council** , ExemptAdvisor supports efficient and accurate self-assessment for property owners and applicants.

## Quick Start
### 🗐 1. Clone Repo
To get a local copy of the project, open your terminal and run:
```bash
https://github.com/rachtag/Exempt-Development-Tool-Sheds-And-Patios.git
```
### 🚥 2. Start the Application
Open the folder in Visual Studio Code.
From VS Code:
- Open the ExemptAssessAPI.py file
- Click the Run ▶️ button in the top-right corner.
- Flask will automatically start a local development server (usually on http://127.0.0.1:5000/).

## 💡 Key Features
- 🧩 **Interactive Questionnaire**  
  Guides users step-by-step through exemption criteria for sheds and patios, with dynamic fields that adapt based on development type and property zoning.

- 🗺️ **Automated Property Data Retrieval**  
  Fetches relevant property information to help make assessments faster and more accurate.

- 🏗️ **Exemption Assessment Logic**  
  Evaluates responses against the NSW SEPP (Exempt and Complying Development Codes) 2008 to determine if the proposed work is exempt.

- 📋 **Result Summary**  
  Displays a clear summary of the assessment outcome.

- 🧾 **Printable Report**  
  Generates a PDF report that users can save or print for their records.

- 🔄 **GIS Integration**  
  Supports geolocation and mapping functionality for property-specific assessments and to ensure accuracy of data.
  
- 🗂️ **Assessment Logging**  
  Saves a log of all assessments for council records and auditing purposes.
  
- 🔒 **Privacy & Security Focused**  
  No sensitive or personally identifiable information is collected. Security and data protection are central to the app design.

- ⚡ **Simple Web Interface**  
  Intuitive and responsive interface built with HTML, CSS, and JavaScript for easy user interaction. Fully functional on **desktop computers, laptops, tablets, and mobile devices**.
  
- 🎨 **Design & Branding**  
  The user interface was designed to maintain consistency with the Council's website styling and branding guidelines where possible.
  
- ♿ **Accessibility Considerations**  
  The interface was designed in line with **WAGC accessibility guidelines** to support users who might be using **screen readers, keyboard-only navigation, or other assistive technologies**.

## 🔧 Built With
- **Languages:** HTML, CSS, JavaScript, Python
- **Backend Framework & Server:**
   - Flask - Web application framework
   - Gunicorn - WSGI HTTP server
- **Python Libraries:**
   - Flask-Limiter - Rate limiting for API endpoints
   - Requests - HTTP Library for API calls
   - tzdata - Timezone data
- **Frontend Libraries:**
   - html2canvas (v1.4.1) - HTML to canvas rendering for PDF generation
   - jsPDF (v2.5.1) - Client-side PDF generation
- **APIs & Services:**
   - ArcGIS Geocoding API - Address geocoding and spatial queries
   - NSW Planning Portal API - Address validation and planning data
   - NSW Government GIS Services - Zoning, heritage, bushfire, and environmental data layers

## 📄 Key Pages
- http://127.0.0.1:5000 (index.html)
The user-facing application is one page for ease of use and navigation. 
It uses conditional rendering to populate required fields based on user entered development type (shed or patio) and property zoning information.
### Developer Reference Pages:
- http://127.0.0.1:5000/get-logging-db (assessment log)
- http://127.0.0.1:5000/get_shed_help (shed assessment help)
- http://127.0.0.1:5000/get_patio_help (patio assessment help)
- http://127.0.0.1:5000/get_retain_wall_help (retaining wall assessment help)


## 🧱 Application Structure
Below is a breakdown of the file structure for the ExemptAdvisor application:
```
Exempt-Development-Tool-Sheds-And-Patios/
│
├── env/ # Environment configuration files
│ └── geocode.conf # API keys 
├── static/ # Static frontend assets
│ ├── img/ # Image resources
│ │ └── help-icon.png
│ │
│ ├── js/ # JavaScript files
│ │ ├── conf/ # JS configuration files
│ │ │ └── js.conf
│ │ ├── APIQuery.js # Handles API calls for geocoding/assessment
│ │ └── app.js # Main frontend logic
│ │
│ └── styles.css # Global stylesheet
│
├── templates/ # Flask HTML templates
│ └── index.html # Main user interface page
│
├── ExemptAssessAPI.py # Main Flask application – press ▶️ in VS Code to start
├── GISProxy.py # Proxy service for GIS/geolocation queries
├── assessment_db.py # Database Handler for storing and retrieving assessments
├── assessment_help.py # Provides guidance on what attributes must appear in each JSON file & renders an HTML table that displays the contents of the assessment database
├── assessments.db # SQLite database  containing assessment records
│
├── requirements.txt # Python dependencies list
├── README.md # Project documentation
```

## 🗄️ Assessment Database Schema
The ExemptAdvisor application uses a lightweight **SQLite** database (`assessments.db`) to record user assessments activity and corresponding outcomes. Each record represents a single exemption check performed through the application.

| Field Name | Data Type | Description |
|-------------|------------|-------------|
| **id** | INTEGER (Primary Key) | Auto-incremented, unique identifier for each record |
| **timestamp** | TEXT (ISO 8601) | Date and time the assessment was created (e.g., `2025-10-20T14:42:32.596514+11:00`) |
| **context** | TEXT | Indicates the result context of the assessment (e.g., `Exempt`, `Not Exempt`) |
| **input_json** | TEXT (JSON) | JSON-encoded object containing user-provided input data such as address, zoning, land size, and structure dimensions |
| **response_json** | TEXT (JSON) | JSON-encoded object containing the system’s assessment result and reference URLs |

The database is primarily intended for **testing and development**.  
For production deployment on Council servers, a persistent, server-side database is recommended to ensure reliable storage of assessment records.

## 🏗️ Future Development
**Retaining Walls**  
The backend 'ExemptAssessAPI.py' file already includes preliminary logic to support assessments for retaining walls, which can be extended and activated in future versions of the application.

**Persistent Server-side Database**
Implementing a persistent, server-side database (e.g., 'PostgreSQL' or 'MySQL') to replace the local 'SQLite' instance, enabling secure long-term storage of assessment records, supporting concurrent access by multiple users, and allowing integration with Council's internal systems and authentication services.

## 👥 Authors

| Name | GitHub Profile | Organisation |
| ------ | ------ | ------ |
| Andrew Curtolo | [ACurtolo](https://github.com/ACurtolo) | La Trobe University |
| Binju Subedi | [Binnju](https://github.com/Binnju) | La Trobe University |
| Christina Wang | [chris-tina-w](https://github.com/chris-tina-w) | La Trobe University |
| Kusheta Goorohoo | [Kushee-Ta](https://github.com/Kushee-Ta) | La Trobe University |
| Rachel Taggart | [rachtag](https://github.com/rachtag)| La Trobe University |
| Yixiao Zhang | [Nick22058017](https://github.com/Nick22058017)| La Trobe University |

## 📄 License

Albury City Council owns the application, including all copyright and intellectual property.  
The application may **not** be reproduced, modified, or redistributed without express consent from Albury City Council.