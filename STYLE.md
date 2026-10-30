# Wrangle & Bloom style

The live look is the editorial homepage. Do not replace it with the older black-and-white card layout.

## What to use

- Paper `#f4efe7`, sand `#e9e0d3`, ink `#2a2521`, muted `#74695e`, green `#334f40`
- Display type: Cormorant Garamond. Body and UI: Inter
- Small uppercase labels, tracked about `0.2em`
- Pill buttons: solid ink, or a text link with an underline
- Feature photos in a soft arch (`border-radius: 999px 999px 0 0`) on the homepage and section pages, not on stories
- Project stories and blog posts use the story template in `project.css` (`vietnam-riding-school.html` is the reference): a darkened full-bleed hero photo carrying the title, facts table and key figures; left-aligned sections with a numbered label; one big italic quote lifted from the story (`.story-bigquote`); plain rectangular photos; testimonial; the "What's burning?" call to action with a next-project card. No arches, no centred text column
- Cream navigation and footer on every editorial page
- Styles live in `home.css`, applied with `class="home"` on `body`
- Nav name: Sara MacKinley-de Jong
- Menu: About me, Equine Freedomplicity, Wrangle & Bloom, Photography. Get in touch opens `contact.html`, which sends enquiries to `wrangleandbloom@gmail.com`

## What stays separate

`photography.html` is the camera viewfinder. Leave `viewfinder.css` and `viewfinder.js` alone. Do not restyle that page to match the cream editorial system, and do not copy the viewfinder onto the other pages.

## Before changing anything

Fetch and pull the latest `origin/main` first. Read `home.css` and `index.html` on that commit before editing layout. If someone points at a preview URL, find the commit it was built from before touching the design.
