# Ibrahim El-Ayoubi · Personal site

A one-page site for employers: hero with portrait, about, experience timeline, education with selected
grades, skills and languages, and contact. Plain HTML, CSS and JavaScript with no build step and no
dependencies, so it loads fast, is fully readable even if JavaScript fails, and can be hosted anywhere for free.

```
index.html                      all content lives here
styles.css                      design tokens (colours, fonts, motion) at the top
script.js                       nav, scroll effects, timeline, grade bars, copy button, local time
assets/portrait.jpg             photo (square works; it is cropped to 4:5)
assets/Ibrahim_El-Ayoubi_CV.pdf the CV behind every "CV" button
assets/favicon.svg              browser tab icon
```

## Updating content

Everything is in `index.html`:

- **New role:** copy a `<li class="position">` inside the right organisation (newest first) and change
  the title, dates and bullets. For a new organisation, copy a whole `<li class="role">`. Set
  `data-from="YYYY-MM"` and, for a past role, `data-to="YYYY-MM"`; the duration is calculated for you.
- **New grades:** copy a `<li class="grade">` and set both `--g:9.5` (bar length) and the number shown.
- **New CV:** replace `assets/Ibrahim_El-Ayoubi_CV.pdf` with the same file name.
- **Status line:** the "Open to opportunities" text sits at the top of the hero.
- **Accent colour:** change `--accent` in `styles.css` (it has a light and a dark value).

## Preview locally

```bash
cd portfolio
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish (free)

- **GitHub Pages:** push this folder to a repo, then Settings → Pages → Deploy from branch → `main` / root.
- **Netlify Drop:** drag the folder onto https://app.netlify.com/drop.
- **Vercel:** `npx vercel` in this folder.

Once it has a domain, add the `og:url` and `og:image` tags noted in the `<head>` so LinkedIn and
WhatsApp show your photo when the link is shared.

## Motion

Built to Emil Kowalski's animation rules: strong ease-out curves, nothing animates from `scale(0)`,
hover effects only on devices with a real pointer, and `prefers-reduced-motion` gets gentle fades instead
of movement.

- **Hero:** a one-time entrance. The name rises line by line from a mask and the portrait is revealed
  with a clip-path wipe. These are CSS animations, so they stay smooth while the page is still loading.
- **Sections:** content is visible by default. Just before a block scrolls into view it rises in once
  (Web Animations API), so nothing waits invisible for JavaScript.
- **Timeline:** the line fills as you scroll through your experience, using CSS scroll-driven animation
  where the browser supports it and a light script fallback elsewhere. Each organisation's dot fills as
  the line passes it.
- **Grades:** each bar draws out to its value on the full 0–10 scale, one after another.
- **Nav:** the active-section pill is a clipped copy of the menu, so text and pill colour move together.
- **Feedback:** buttons press to 97%, and the Copy button morphs to "Copied" with a short blur crossfade.
- **Print:** prints as a clean one-pager without the navigation and buttons.
