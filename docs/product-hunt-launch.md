# Product Hunt listing — CareerPack

_Drafted from four independent positioning angles, scored by three judges (PH voice / truthfulness against the repo / conversion clarity), then synthesised from the winner. Every claim below was verified against the code by the truth judge — do not edit in a number that is not in the repo._

## Name

CareerPack

## Tagline (56 chars)

Career tools built for Indonesia, not translated into it

## Description (256 chars)

Free, in Bahasa Indonesia: ATS-checked CV builder, application tracker, document checklists for home and 8 countries abroad, mock interviews, skill roadmap, budgets in Rupiah. One tap for 12 other languages. Hit "Lihat Demo" and use it all with no account.

## Topics

- Career
- Resume
- Productivity
- Artificial Intelligence
- Education

## First comment

Hi PH — I'm Rahman, and it's just me on this one.

Fastest way to judge it: go to careerpack.org and hit "Lihat Demo". No email, no password, no card. You land in your own session with sample data already in it. Everything I claim below is something you can go poke at right now.

Why it exists: every career tool I wanted to hand an Indonesian friend was in English, priced in dollars, and shaped around applying to a US company. A few had an Indonesian UI bolted on and you could feel where the bolt was. They still tell you to take the photo off your CV — normal advice in the US, the opposite of the convention here. None of them have heard of CPNS. None of them know which papers have to be in your hand before you can legally start work in Japan.

Translating the buttons doesn't fix that, because the assumptions live in the data, not the copy. So I built it the other way round: model one hiring market properly, and treat other languages as a rendering problem.

What that actually means:

The document checklist ships 9 templates. Indonesia — KTP, KK, akta kelahiran, NPWP, BPJS, SKCK, ijazah, BNSP — plus 8 destinations people here actually leave for: Japan, Korea, Singapore, Australia, Germany, Netherlands, UAE, Saudi. The Japan one puts the Certificate of Eligibility before the visa, because that is the order it happens in, and marks JLPT N4 as the floor for SSW. That's the point of the whole app in one screen: the scans stop living in a WhatsApp chat you had with yourself, and you stop finding out something expired the night before you need it.

47 skill-roadmap templates. One of them is ASN/PNS, broken into the real CPNS stages — SKD, then SKB. I don't expect anyone in San Francisco to ship that one.

The ATS scorer is plain deterministic TypeScript with no AI in it, and it shows its work: keyword coverage, hard skills, experience fit, section completeness, parseability. It docks the 2-column Modern template on parseability for everyone, and the message tells you Classic or Minimal are the safer pick for international applications — because a 2-column CV is common and fine here, and older parsers abroad mangle it. The CV photo is a toggle, not a rule, for the same reason.

Money is in Rupiah, and the cost-of-living comparison is indexed with Jakarta at 100 instead of San Francisco. Interview practice is in Indonesian, because the interview will be.

Then the translation layer: one tap, 12 languages, driven by the Google Translate cookie. It's the cheap version and I'll say so — a hand-written message catalog across 22 feature slices is weeks I don't have. But it has the one property I wanted: the ~90KB Google script only loads if someone asks for it, so an Indonesian visitor pays nothing for everyone else's internationalisation. It's also why the list is Japanese, Korean, Arabic, Dutch and Malay rather than the usual five — that's where people here are going.

Things I'd rather you hear from me than find:

It's free and there is no plan behind that. No pricing page, no card field, no billing code in the repo. I never built a paywall, so there isn't one sitting there waiting to be switched on.

AI runs on gpt-4o-mini through an OpenRouter key I pay for, capped at 10 requests a minute and 100 a day per person, plus a shared ceiling of 300 an hour across everyone (guest sessions get shed first, at 150). You can paste your own key in Settings (OpenAI, OpenRouter, Gemini, Groq) and requests route to yours instead — but the caps still apply, because they're app-level buckets, not a billing guard.

It will not get you a job. The terms say it in plain Indonesian — "Tidak ada jaminan bahwa Anda akan mendapat pekerjaan" — and the ATS score carries its own line on the card: "Pakai sebagai panduan, bukan jaminan."

The salary and cost-of-living numbers are a static reference dataset I compiled, not a live market feed.

Demo accounts get cascade-deleted by a nightly cron once they're 7 days old. If you sign up with an email, that same account keeps everything you did in the demo — nothing is thrown away when you convert.

One person, no team, nobody to escalate your bug to but me. 236 commits since the end of April, one Hostinger VPS, Next.js 15 + Convex + Docker. The repo is public but the licence is PolyForm Noncommercial — read it, run your own copy, take the pattern; just don't resell it. That's source-available, not OSI open source, and I'd rather be precise than collect the badge.

What I'd genuinely like back: if you've built for a non-US market, did localisation-first survive contact with reality, or did you end up shipping the translated shell anyway? And if you're Indonesian — tell me what's wrong with it. There's plenty.

## Gallery

### 1. Indonesian first — the English line under it is a courtesy, not the product. Free, no card, and the second button needs no account at all.

**Shows:** The live hero above the fold: the Indonesian headline "Semua yang Anda Butuhkan untuk Karir Impian.", the Indonesian subline about CV / documents / interview / tracking, the one grey English orientation line, the Mulai Gratis + Lihat Demo buttons, and the three trust ticks (Gratis selamanya · Tanpa kartu kredit · Data Anda tidak dijual).

**Source:** reuse /tmp/claude-1001/-home-rahman-projects-CareerPack/ac837ced-2e26-4c51-9f0a-275acfcea988/cp-01-hero.png

### 2. This is one tap from the homepage. No email, no password, your own isolated session with sample data already in it — nothing to fill in before you can judge the thing.

**Shows:** The dashboard one click after Lihat Demo — an anonymous session with the seeded starter CV / checklist / roadmap already populated, desktop sidebar expanded showing CV, Kalender, Lamaran, Simulasi Wawancara, Roadmap Skill, Ceklis Dokumen, Kalkulator Keuangan, Pencocok Lowongan, Portofolio.

**Source:** capture: incognito → careerpack.org → click Lihat Demo → screenshot /dashboard at 1440px, sidebar expanded

### 3. 9 templates: Indonesia, plus the 8 countries people here actually leave for. The Japan one puts the COE before the visa, because that's the order it happens in.

**Shows:** The document checklist with the overseas tab open on the Japan template — Certificate of Eligibility, JLPT N4, SSW skill certificate, passport validity, employment contract — each with its issuing authority and required/optional state, progress partly ticked, the Indonesia template visible in the picker behind it.

**Source:** capture: demo session → /dashboard/checklist → overseas tab → JP template loaded, a few items checked off

### 4. Two things a US-built tool has no reason to ship: a CPNS track (one of 47 roadmaps) and cost of living indexed to Jakarta, not San Francisco.

**Shows:** Two panels side by side. Left: the skill roadmap on the ASN / PNS template with the CPNS stages visible (SKD — TWK/TIU/TKP — then SKB) and one node expanded. Right: the financial calculator's city comparison showing the cost index with Jakarta = 100 as the baseline.

**Source:** capture: demo session → /dashboard/roadmap with ASN selected and a node open; then /dashboard/calculator → City Compare tab; compose the two frames side by side

### 5. Deterministic scoring, no AI, five numbers you can argue with. It ships its own disclaimer: a guide, not a guarantee.

**Shows:** The ATS result card in the matcher: the numeric score and grade, the five-part breakdown (keyword coverage, hard skills, experience fit, section completeness, parseability), the Indonesian note about the 2-column Modern template and older parsers, and the disclaimer line "Pakai sebagai panduan, bukan jaminan."

**Source:** capture: demo session → /dashboard/matcher → run a scan of the seeded CV against a sample job description

### 6. Arrive from an English link and you get this. One tap, 12 languages, the whole app. The ~90KB Google script never loads unless you ask for it.

**Shows:** The hero with the translate banner showing: "This site is in Bahasa Indonesia — translate it with Google, the whole app, not just this page", the Translate to English button, Keep Indonesian, and the language dropdown open on the 12-language list.

**Source:** reuse /tmp/claude-1001/-home-rahman-projects-CareerPack/ac837ced-2e26-4c51-9f0a-275acfcea988/cp-desktop.png

## Launch day

- Post at 12:01am PT (14:01 WIB, 2pm Jakarta). PH's leaderboard day starts at 00:01 PT, so posting inside the first half hour buys the full 24-hour ranking window — posting at 9am PT throws away a third of it. The bonus for you specifically: 14:00 WIB means the entire PH day (through 3pm PT = 5am WIB) overlaps your waking hours except the last few, so replies land in minutes, not the next morning. Block the afternoon and evening; first-comment reply latency moves ranking more than anything you can write in advance.

- ~~Before posting, fix the login-page string.~~ DONE in ff7092b — the login page and the demo banner both say "terhapus otomatis setelah 7 hari" now. Note the banner went further since: it used to add "Daftar untuk menyimpannya — semua progres kamu ikut terbawa", which was also false, in the other direction. useDemoOverlay.ts keeps demo data in localStorage and never writes it to Convex, and no overlay→Convex migration exists, so signing up starts clean. Gallery caption 2 above was written against the wrong version of that claim and has been corrected too. If you rewrite any listing copy, check it against the overlay, not against intuition.

- ~~Check the check-email rate limit against launch traffic.~~ FIXED before launch — nothing to decide here now. The 30/hour per-hashed-IP cap on /api/auth/check-email is unchanged, but going over it no longer blocks anyone: the endpoint stops *answering* the exists/not-exists question (200 `{exists: null}`) instead of refusing to serve, and the client falls back to a blind signUp-then-signIn attempt. So a whole CGNAT'd carrier can sign up past the cap, and the cap keeps doing the only job it had, which was denying an enumeration oracle. Do NOT "raise the ceiling for the day" — that would weaken enumeration protection to solve a problem that no longer exists.

- Verify the cold demo path yourself in incognito, twice, from a phone as well as desktop: careerpack.org → Lihat Demo → seeded dashboard. Time it. If seedForCurrentUser is slow or throws, the failure is swallowed (useAuth logs and continues) and the visitor gets an empty dashboard — which reads as a broken product to someone who has ten seconds of patience. Every gallery capture must also come from a fresh demo session with sample data only; no real name, no real email, no real phone number in any frame.

- Fund and watch the AI bill. Every request routes through one OpenRouter key resolved from globalAISettings, at 100/day/user. A few hundred curious visitors is a real number, not a hypothetical. Top the balance up before posting, and know in advance what you do if it drains mid-day — the honest move is to say so in the thread, not to let calls fail silently. Also worth saying out loud that ATS scoring, checklists and roadmaps are deterministic and keep working with the AI key exhausted.

- Run scripts/backup-prod.sh manually before posting rather than waiting for the 04:00 cron, and have the Dokploy restart path and ~/bin/health-watch.sh in front of you. One VPS runs everything; the first time a launch spike matters is not the time to be reading ops docs.

- TOUGH COMMENT 1 — "Cool, but it's only in Indonesian, so it's not for me." Honest answer: correct, and that's the design, not a backlog item. There are ~280 million people here and the tools they get are US products with translated buttons and US assumptions underneath — take the photo off your CV, no idea what CPNS is, no idea the COE comes before the Japan visa. I'd rather be exactly right for one market than mediocre everywhere. That said, there's a translate control in the header: one tap puts the whole app into any of 12 languages, and the ~90KB Google script only loads if you use it, so Indonesian visitors don't pay for it. It's Google Translate, not a hand-written catalog — good, not perfect, and I'd rather label it than pretend. If you want to see the parts that don't need language at all, open the checklist and the roadmap.

- TOUGH COMMENT 2 — "The AI is just gpt-4o-mini behind a rate limit. That's not an AI product." Honest answer: it isn't an AI product, and gpt-4o-mini is exactly what it is. It's my personal card paying for it, and 10/min + 100/day per person under a shared 300/hour ceiling is the number I can currently afford — I'd rather cap it and stay free than run out and take the whole thing down. The parts most people use hardest have no AI in them at all: the ATS scorer is deterministic TypeScript that shows its five-part breakdown, the 9 document checklists and 47 roadmaps are curated data, the tracker is a tracker. AI is assistance on top of that, not the substrate. And if the model is the objection: Settings takes your own OpenAI, OpenRouter, Gemini or Groq key and routes requests through it, so you can point it at whatever you like. The 10/100 cap still applies — it's an app-level bucket, not a billing guard — and I'd rather tell you that than let you find out.

- TOUGH COMMENT 3 — "How is this free? What's the catch — data, ads, a paywall in three months?" Honest answer: there is no catch and there is also no business model, which is the actual answer. There's no pricing page because there's no billing code in the repo — you can grep it, it's public. No ads, no data sale; the landing page says "Data Anda tidak dijual" and there's nothing on the other side of that claim to sell to. What it costs me is one VPS and a token bill. If that ever becomes unsustainable, the honest options are a cap, a paid tier for new features, or asking for help — and I'd say so in this thread before doing any of them, not in a changelog. The insurance for you: the repo is PolyForm Noncommercial and it self-hosts on Next.js + Convex + Docker, so if I disappear you can run your own copy. What I ask in exchange is that you don't resell it.


## What was grafted from the runners-up

- From honest-scope: the 7-day nightly-cron deletion of demo accounts — and, crucially, the correction it implies. problem-first said demo data is "deleted when you log out", which convex/admin/cleanup.ts contradicts (cutoff = Date.now() - 7*DAY, logout deletes nothing). The final listing states the true version and adds the fact none of the four drafts had: an anonymous account that later gains an email is skipped by the cleanup, so converting keeps your work.

- From honest-scope: both verbatim disclaimer quotes — the terms line "Tidak ada jaminan bahwa Anda akan mendapat pekerjaan" (frontend/app/terms/page.tsx:59) and the on-card "Pakai sebagai panduan, bukan jaminan" (ATSResultCard.tsx:104). Quoting the product's own copy beats paraphrasing a promise.

- From honest-scope: the BYO-key provider list, verified to a real user-facing surface — AISettingsPanel is mounted in SettingsView.tsx:98 via setMyAISettings, not admin-only. But honest-scope implied a personal key lets you "run on your own budget instead"; requireQuota in convex/ai/actions.ts is unconditional, so the final says the cap still applies because it's an app-level bucket, not a billing guard.

- From problem-first: the concrete-pain imagery — scans living in a WhatsApp chat you had with yourself, finding out one expired the night before. Compressed into one sentence attached to the checklist paragraph instead of an opening aria, so the thesis post gets the recognition beat without a four-failure preamble.

- From problem-first: "try it with no account" as CTA phrasing, pulled from the tail of its description into the final description's last clause, and repeated as the second paragraph of the comment.

- From maker-story: the material specificity — 236 commits since the end of April, one Hostinger VPS, Next.js 15 + Convex + Docker — and the caveat with no upside, "nobody to escalate your bug to but me."

- From maker-story: the compression of the price/entry objection into a single early line rather than a paragraph, which is why the demo CTA now sits in paragraph two of the comment instead of after 600 words.
