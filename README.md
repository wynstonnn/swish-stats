# SWISH Stat Centre

A website for the SWISH youth team. It reads the **SWISH Player Tracker** Excel file from a share link, so when you update the Excel file, the website updates by itself (within about a minute). There's no code to touch and nothing to re-upload.

## What's in this folder

| File | What it does |
|---|---|
| `index.html` | The website the youths see |
| `api/stats.js` | The small "backend": it downloads your Excel file and turns it into stats |
| `lib/parser.js` | Reads the sheets (Games, Player_Data, Shot_Data, Player_Roster) |
| `data/stats.json` | A saved copy of the stats, used only if the Excel link ever fails |
| `package.json` | Tells Vercel to install the Excel reader |

## One-time setup (about 15 minutes)

### 1. Put the Excel file online
**Google Drive (recommended)**
1. Upload `SWISH_Player_Tracker.xlsx` to Google Drive.
2. Right-click the file > **Share** > under *General access* choose **Anyone with the link** (Viewer).
3. Click **Copy link**. Keep this link for step 3.
4. To update stats, double-click the file in Drive. It opens in Google Sheets and saves back to the same .xlsx automatically.

**OneDrive** works too: right-click the file > **Share** > **Anyone with the link can view** > **Copy link**. Edit it in Excel (desktop or online) with AutoSave on.

### 2. Put this folder on GitHub (free)
1. Make a free account at github.com.
2. Click **+** (top right) > **New repository**. Name it `swish-stats`. *Private* is fine. Click **Create repository**.
3. On the next page click **uploading an existing file**.
4. Unzip this folder on your computer, open it, select **everything inside** (index.html, package.json, README.md and the `api`, `lib`, `data` folders) and drag it into the GitHub page. Use Chrome or Edge so the folders upload too.
5. Click **Commit changes**.

### 3. Connect it to Vercel (free)
1. Go to vercel.com > **Sign Up** > **Continue with GitHub**.
2. Click **Add New…** > **Project** > find `swish-stats` > **Import**.
3. Leave *Framework Preset* as **Other**.
4. Open **Environment Variables** and add:
   - **Key:** `EXCEL_URL`
   - **Value:** the share link you copied in step 1
5. Click **Deploy**. After a minute you get a link like `swish-stats.vercel.app`. That's the website to share with the youths.

**Check it worked:** scroll to the bottom of the website. It should say **"Live from the SWISH Player Tracker Excel file · last read …"**.

## Every week after that
1. Add the new game in Excel: a row in **Games** (opponent, result, both scores) and one row per player in **Player_Data**. You can also log shots in **Shot_Data** to fill the court heatmaps.
2. Make sure the file has saved.
3. Wait about a minute, then refresh the website.

## Rules that keep it working
- Don't rename the sheets (**Games**, **Player_Data**, **Shot_Data**, **Player_Roster**) or their column headers.
- Each game needs an **opponent name** and a **W or L** result before it shows up.
- The **Date** and **Opponent** in Player_Data must match the same game in the Games sheet.
- Keep the share setting on **Anyone with the link**.

## If something goes wrong
The bottom of the website tells you what happened:
- *"EXCEL_URL is not set"*: add the variable in Vercel (step 3.4), then go to **Deployments** > **⋯** > **Redeploy**.
- *"the link did not return an Excel file"*: the file isn't shared publicly. Fix the sharing (step 1.2).
- *"no player rows found"*: check the Player_Data sheet name and headers.

While there's a problem, the website keeps showing the last saved stats, so the youths never see a broken page.

**To change the Excel link later:** Vercel > your project > **Settings** > **Environment Variables** > edit `EXCEL_URL` > then **Deployments** > **⋯** > **Redeploy**.

## Privacy
Anyone with the website link can see the stats, so share it only with your group. The page tells search engines not to list it, and it only uses first names.
