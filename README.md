# The Adventure of The Goose — Netlify deploy

Idiom-matching game (3 levels) with name entry, live class scoreboard and final ranking.

## Files
- `index.html` — the game
- `netlify/functions/api.mjs` — scoreboard API (stores scores in Netlify Blobs)
- `netlify.toml`, `package.json` — Netlify settings

## Deploy (choose one)
**A. GitHub (recommended)**
1. Upload this folder to a new GitHub repository.
2. Netlify → Add new site → Import an existing project → pick the repo.
3. Leave the build command empty; publish directory is `.` (already set in netlify.toml). Deploy.

**B. Netlify CLI**
```
npm install
npx netlify-cli deploy --prod
```

> Drag-and-drop (Netlify Drop) uploads the page only, not the scoreboard function.
> The game still works, but the live scoreboard will show "Can't reach the class scoreboard".

## Set the teacher PIN (required for teacher controls)
Netlify → Site configuration → Environment variables → Add `TEACHER_PIN` (e.g. a 4–6 digit code) → redeploy.

## In class
- Students open the site, enter their name and play.
- Projector: open `https://<your-site>.netlify.app/#board`.
- Teacher: click **Teacher login** on the start page or board, enter the PIN.
  - **Show final ranking now** — ends the round on every screen.
  - **Start a new round** — clears the board for the next class.
