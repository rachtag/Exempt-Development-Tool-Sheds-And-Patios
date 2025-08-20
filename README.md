# Exempt-Development-Tool-Sheds-And-Patios
**ExemptAdvisor** – An AI/ML tool to assist with Albury City exempt development requirements for sheds and patios.  

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
   - `feature/add-valida

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

1. After pushing, VS Code will show a notification with Create Pull Request.
2. Click it → GitHub will open in your browser.
3. Fill in the PR description (what, why, how).
4. Submit the PR to merge your branch into main.

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