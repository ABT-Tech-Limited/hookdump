# Hookdump Landing Page

Static landing page for [hookdump.dev](https://hookdump.dev).

## Deploy to Cloudflare Pages

### Option 1: GitHub Integration (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → Select `orangekame3/hookdump`
4. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: (leave empty)
   - **Build output directory**: `landing`
5. Click **Save and Deploy**

### Option 2: Wrangler CLI

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd landing
wrangler pages deploy .
```

### Custom Domain Setup

1. Go to your Pages project → **Custom domains**
2. Add `hookdump.dev`
3. If DNS is on Cloudflare, it auto-configures
4. If DNS is elsewhere, add the CNAME record shown

## Waitlist Form Setup

The form uses [Formspree](https://formspree.io):

1. Create account at [formspree.io](https://formspree.io)
2. Create a new form
3. Copy the form ID
4. Replace `YOUR_FORM_ID` in `index.html`:

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

### Alternatives

- [Tally](https://tally.so) - Free, no account needed
- [Google Forms](https://forms.google.com) - Embed or redirect
- [Buttondown](https://buttondown.email) - If you want newsletter later
