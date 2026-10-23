# U Like Caterers & Events: website

A static website with 11 pages. It is plain HTML, CSS and JavaScript, with no build step, so it runs on any hosting (Netlify, Hostinger, cPanel, GitHub Pages).

| Page | File |
|---|---|
| Home (3D juice hero, live counters carousel, quick quote) | `index.html` |
| About (story since 2005, divisions, quality) | `about.html` |
| Catering Menu (all 10 counters, 91 dishes, Menu Builder) | `menu.html` |
| Fresh Juice (3D Juice Studio, all 24 drinks) | `fresh-juice.html` |
| Events & Services (10 services, occasions, how it works) | `events.html` |
| For Caterers (B2B support + partnership enquiry) | `for-caterers.html` |
| Gallery (photos, reels, lightbox) | `gallery.html` |
| Reviews (real reviews + feedback form) | `reviews.html` |
| Careers (roles + application) | `careers.html` |
| Contact (call, WhatsApp, email, map, FAQ) | `contact.html` |
| Not found | `404.html` |

The site needs an internet connection for two things: the fonts (Google Fonts) and the 3D (Three.js 0.160.0 from jsDelivr). Without them it still works, using fallback fonts and still photos instead of 3D.

---

## 1. Change phone numbers, WhatsApp, email, address, links

Open **`assets/js/site-config.js`**. Every detail lives here:

- `phones`: the two numbers. `display` is what people see; `tel` is what the phone dials.
- `whatsapp`: the number every WhatsApp button and form sends to. Use the country code plus the number, digits only, e.g. `"919072900080"`. **It is set to 90729 00080 now. If WhatsApp is on 94477 03155, change it to `"919447703155"`, and change `whatsappDisplay` to match.**
- `email`: where the "Send by Email" buttons go.
- `mapLink`: paste the Google Maps "Share" link of the exact pin. While it is empty, the site searches Google Maps for the address.
- `instagram`: the second account ("U Like Catering Solutions") has no link yet. Paste its profile URL into `url` and it appears automatically.
- `googleReviewLink`: paste the "Ask for reviews" link from your Google Business Profile. The "Review us on Google" button appears automatically.
- `hours`, `serviceArea`, `footerCredit`: when filled in, they appear on the site. When empty, they stay hidden.
- `stats`: put real numbers in `value` (for example events served) and the counters appear on the home page. While a value is `null`, its counter stays hidden.

The pages also contain the current details as plain text, so search engines can read them. If you change a number or email, also use your editor's **Find & Replace across the whole folder** to update the `.html` files.

## 2. Add or edit menu items

Open **`assets/js/menu-data.js`**. Each counter has an `items` list. To add a dish, copy a line like
`{ "name": "Ghee Roast" },` and change the name.

- Add `"tag": "veg"` or `"tag": "nonveg"` only when you are sure.
- The 24 drinks are in the same file, under `ULIKE_JUICES`. `color` is the colour of the drink in the 3D Juice Studio.

## 3. Add real photos and videos (most important)

The food photos now on the site are cropped from the brochure. Real photos from your events will impress visitors much more.

**Gallery photos**
1. Save each photo as `.webp` or `.jpg`, about 1600 px wide. You can compress them free at https://squoosh.app.
2. Put the files in `assets/img/gallery/`, e.g. `wedding-01.webp`.
3. In **`assets/js/gallery-data.js`**, find the matching slot. Each empty slot shows its file path on the site, e.g. `"path": "assets/img/gallery/wedding-01.webp"`. Add a `"src"` line with the same path:
   `{ "cat": "weddings", "src": "assets/img/gallery/wedding-01.webp", "caption": "Wedding catering setup" },`
4. Remove any slots you don't need. Categories: `food`, `weddings`, `juice`, `live`, `decor`, `team`.

**Reels**
- In `ULIKE_REELS` (same file), add `"src": "assets/video/reel-01.mp4"` and optionally `"poster": "assets/img/gallery/reel-01.jpg"`.
- For a YouTube or Instagram video, add `"url": "https://..."` instead.
- Keep each MP4 under about 8 MB (720p, 20–30 seconds).

## 4. Reviews

Open **`assets/js/reviews-data.js`** and add only real reviews, with the customer's permission:

```js
{ "name": "Anitha & Joseph", "event": "Wedding", "place": "Pala", "date": "Jan 2026", "rating": 5, "text": "…" },
```

While the list is empty, the site shows "Had U Like at your event?" with buttons to leave a review. It shows no made-up reviews.

## 5. Careers

Open **`assets/js/careers-data.js`**. Each role has a `status`:

- `"open"` shows **Hiring now**.
- `"interest"` shows **Register interest**.
- `"hidden"` takes the role off the site.

Add real benefits to `ULIKE_CAREER_PERKS`, e.g. `["Training", "Uniform provided"]`.

## 6. Optional extras

- **Get a copy of every form in Gmail:** create a free access key at https://web3forms.com using ulikekply@gmail.com, then paste it into `web3formsKey` in `site-config.js`.
- **Google Analytics:** paste your GA4 ID (`G-XXXXXXX`) into `gaId`. Clicks on Call, WhatsApp, Email and Directions are tracked automatically.

## 7. Put the site online

**Netlify (free):**
1. Go to https://app.netlify.com/drop.
2. Drag this whole folder onto the page. The site is live in under a minute.

**Hostinger / cPanel:** upload everything inside this folder to `public_html`.

**Your own domain (e.g. ulikecaterers.in):**
1. Connect the domain in your hosting panel.
2. Open `sitemap.xml` and `robots.txt` and replace `https://YOUR-DOMAIN.com` with the real address.
3. Submit the sitemap in Google Search Console.
4. Create or claim the **Google Business Profile** for U Like at KE Road, Kovilkadavu, and add the website link. Local customers find caterers through it.

## Notes

- **Language:** English and Malayalam, using the EN | മല switch. The visitor's choice is remembered on their device. To change the Malayalam wording, edit `assets/js/i18n.js`.
- **3D:** the 3D runs on phones and computers that support it. On older phones, data-saver mode or "reduce motion" settings, visitors see the still photos instead.
- **Brand colours:** U Like yellow `#F2EA18` on black `#050505`, with juice gold `#FCCC06`. They are all set in `assets/css/tokens.css`.
