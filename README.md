# 📋 ExemptAdvisor
## _An Exempt Development Assessment Tool for Sheds and Patios_

**ExemptAdvisor** is a web application designed to streamline the process of determining whether proposed building works are exempt from planning permits.
Built using **Python** and **JavaScript**, the app provides an intuitive questionnaire interface, automated property data retrieval, and accurate assessments based on the **NSW State Environmental Planning Policy (Exempt and Complying Development Codes) 2008**.
Developed in collaboration with **La Trobe University** and **Albury City Council** , ExemptAdvisor supports efficient and accurate self-assessment for property owners and applicants.

## Quick Start
### 🗐 1. Clone Repo
To get a local copy of the project, open your terminal and run:
```bash
git clone (link here to council repo)
```
### 🚥 2. Start the Application
Open the folder in Visual Studio Code.
From VS Code:
- Open the ExemptAssessAPI.py file
- Click the Run ▶️ button in the top-right corner.
- Flask will automatically start a local development server (usually on http://127.0.0.1:5000/).

## 💡Key Features
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

## 🔧Built With
- Languages: HTML, CSS, JavaScript, Python
- List any specific packages here

## 📄Key Pages
- http://127.0.0.1:5000 (index.html)
- http://127.0.0.1:5000/get-logging-db (assessment log)

The application is one page for ease of use and navigation. 
It uses conditional rendering to populate required fields based on user entered development type (shed or patio) and property zoning information.

## Application Structure
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
├── assessments.db # SQLite database  containing assessment records
│
├── requirements.txt # Python dependencies list
├── README.md # Project documentation
```
#### 🏗️ **Future Development: Retaining Walls**  
The backend ExemptAssessAPI.py file contains code to support assessments for retaining walls, which can be extended in future versions of the application.
#### 🗄️ **Database Note**  
The `assessments.db` SQLite database was set up for testing purposes. For deployment on Council servers, it is recommended to implement a persistent server-side database to ensure reliable storage of assessment records.

## 👥 Authors

| Name | Role | Organisation |
| ------ | ------ | ------ |
| [Andrew Curtolo](https://www.linkedin.com/in/profile-url) | Specific Role | La Trobe University |
| [Binju Subedi](https://www.linkedin.com/in/profile-url) | Specific Role | La Trobe University |
| [Christina Wang](https://www.linkedin.com/in/profile-url) | Specific Role | La Trobe University |
| [Kusheta Goorohoo](https://www.linkedin.com/in/profile-url) | Specific Role | La Trobe University |
| [Rachel Taggart](https://www.linkedin.com/in/racheltaggart)| Specific Role | La Trobe University |
| [Yixiao Zhang](https://www.linkedin.com/in/profile-url)| Specific Role | La Trobe University |

## 📄 License

Albury City Council owns the application, including all copyright and intellectual property.  
The application may **not** be reproduced, modified, or redistributed without express consent from Albury City Council.

---
## 🛠️ Development Notes
The following notes are for development purposes only and **will be removed** before the Repo is deployed to the Council GitHub.

---
---

## How to Contribute Using Git (with VS Code)

We’ll all use **VS Code** for development and Git integration.  
This workflow keeps our `main` branch clean and avoids conflicts.  

---

### Step 1. Clone the repository
1. Open **VS Code**.  
2. Press **Ctrl+Shift+P** (or Cmd+Shift+P on Mac) → type **Git: Clone**.  
3. Paste the repository URL (https://github.com/rachtag/Exempt-Development-Tool-Sheds-And-Patios.git) and choose a folder on your computer.  
4. When prompted, open the project in VS Code.  

👌 You now have a local copy of the project.  

---

### Step 2. Create a new branch
1. In the **bottom-left corner** of VS Code, click the branch name (`main`).  
2. Select **+ Create new branch**.  
3. Name it something descriptive, like:  
   - `feature/add-validation`  
   - `fix/button-styling`  

👉 This ensures your work is separate from `main`.  

---

### Step 3. Make code changes
1. Open files in VS Code and make your changes.  
2. When ready to save progress:  
   - Go to the **Source Control panel** (left sidebar, Branch icon).  
   - Stage changes by clicking the **+** next to the files.  
   - Enter a commit message (short description).  
   - Click the **✓ Commit** button.  

OR use the terminal:  
```bash
git add . # Stage all changed files to be included in the next commit
git commit -m "Brief description of changes" # Create a new commit with a message describing your changes
```

---

### Step 4. Publish your branch to GitHub

1. In the bottom-right, VS Code will show Publish Branch → click it.
This pushes your branch to GitHub.

Alternatively, from the terminal:
```bash
git push origin your-branch-name # Upload your local branch to GitHub (remote named 'origin')
```

---

### Step 5. Open a Pull Request (PR)

1. After pushing, GitHub will show a notification 'Compare & pull request'.
2. Click it and fill in the PR description (what, why, how).
4. Then click 'Create pull request' to submit the PR to merge your branch into main.

---

### Step 6. Get approval and merge
1. A teammate must review and approve your PR on GitHub.
2. Once approved, the PR can be merged.
3. GitHub rules prevent direct commits to main.

---

### ⚠️ Notes for Contributors ⚠️
- **_DO NOT_** commit directly to main – always create a **branch**.
- **Before starting new work, sync with main:**
    In VS Code, switch to main.
    Click Sync Changes (or run):
    ```bash
    git checkout main  # switch to the main branch
    git pull origin main # update it with the latest changes from GitHub
    ```
- **Keep commit messages clear and concise.**
- **If your branch gets out of date with main, run:**
    ```bash
    git fetch origin # Check GitHub (origin) for new commits
    git merge origin/main # Apply those commits to your current local branch
    ```
