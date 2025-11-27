# MailerLite Newsletter Template Guide

## Design System Summary

### Colors
- **Primary Green**: `#00875a` - Main brand color, CTAs, links
- **Secondary Blue**: `#0052cc` - Secondary actions
- **Accent Orange**: `#ff991f` - Highlights
- **Background**: `#fafafa` - Page background
- **Foreground**: `#1a1a1a` - Main text
- **Muted**: `#6b7280` - Secondary text
- **Border**: `#e5e7eb` - Borders/dividers
- **Success**: `#10b981`
- **Warning**: `#f59e0b`
- **Error**: `#ef4444`

### Typography
- **Font Family**: System fonts (`system-ui`, `-apple-system`, `Arial`, `Helvetica`, `sans-serif`)
- **Base Size**: `16px`
- **Headings**: 
  - H1: `36px` (mobile), `48px` (desktop), weight `700`
  - H2: `24px-28px`, weight `700`
  - H3: `18px`, weight `600`
- **Body**: `16px`, line-height `1.6`
- **Small**: `14px` or `12px` for footers

### Spacing
- Uses **8px grid system**
- Common padding: `16px`, `24px`, `32px`
- Common margins: `16px`, `24px`, `32px`

### Border Radius
- **Small**: `8px` (rounded-lg)
- **Full**: `9999px` (pills/badges)

## How to Import the Template into MailerLite

### Method 1: Import HTML Template (Recommended)

1. **Log in to MailerLite**
   - Go to https://dashboard.mailerlite.com

2. **Navigate to Templates**
   - Click on your profile icon (top-right)
   - Select **"My templates"** from the dropdown

3. **Create New Template**
   - Click **"Create new template"**
   - Name it: **"Elbespararen Newsletter"**
   - Choose **"Campaign"** as template type
   - Click **"Save and continue"**

4. **Import HTML**
   - Choose **"Code editor"** (not drag & drop)
   - Click **"Import HTML"** or paste the HTML from `mailerlite-newsletter-template.html`
   - The template will be imported with all styling

5. **Customize**
   - Replace `[Förnamn]` with MailerLite merge tags: `{{ subscriber.name }}` or `{{ subscriber.first_name }}`
   - Update links as needed
   - Test with preview

6. **Save Template**
   - Click **"Actions"** → **"Save as template"**
   - Your template is now ready to use!

### Method 2: Recreate in Drag & Drop Editor

If you prefer the visual editor:

1. **Create Template** (same as Method 1, steps 1-3)

2. **Use Drag & Drop Editor**
   - Choose **"Drag & drop editor"**
   - Build sections matching the HTML template:

   **Header Section:**
   - Background: Gradient from `rgba(0, 135, 90, 0.05)` to transparent
   - Add text block with logo badge (background: `rgba(0, 135, 90, 0.1)`, text: "Elchef")
   - Heading: "Se din elfaktura med nya ögon" (Primary green for "med nya ögon")

   **Content Section:**
   - Text blocks with proper spacing
   - Feature box with background `rgba(0, 135, 90, 0.05)`
   - CTA button: Background `#00875a`, white text, rounded corners

   **Benefits Section:**
   - 4 benefit cards with borders (`#e5e7eb`), padding `16px`
   - Each card: Heading (18px, weight 600) + description (15px, muted color)

   **Final CTA Section:**
   - Background: `#00875a`
   - White text
   - White button with green text

   **Footer:**
   - Background: `#f3f4f6`
   - Small text, centered
   - Links in primary green

3. **Set Global Styles**
   - Go to **"Design"** → **"Global styles"**
   - Set font family: `Arial, Helvetica, sans-serif`
   - Set base font size: `16px`
   - Set line height: `1.6`
   - Set text color: `#1a1a1a`
   - Set link color: `#00875a`

4. **Save Template**

## Template Customization Tips

### Merge Tags
Replace placeholders with MailerLite merge tags:
- `[Förnamn]` → `{{ subscriber.first_name }}`
- `[Email]` → `{{ subscriber.email }}`
- `[Unsubscribe]` → `{{ unsubscribe }}`

### Links
- Main CTA: `https://elbespararen.se/upload`
- Footer links:
  - About: `https://elbespararen.se/about`
  - Contact: `https://elbespararen.se/contact`
  - Privacy: `https://elbespararen.se/privacy`

### Images
If you want to add the Elchef logo:
- Upload logo to MailerLite media library
- Use in header section
- Recommended size: 40x40px or similar

### Mobile Responsiveness
The HTML template is already mobile-responsive. In drag & drop editor:
- Test mobile view frequently
- Ensure buttons are at least 44px tall for touch targets
- Keep text readable (minimum 14px)

## Testing Checklist

- [ ] Template displays correctly in desktop email clients
- [ ] Template displays correctly on mobile devices
- [ ] All links work correctly
- [ ] Merge tags populate correctly
- [ ] Colors match brand guidelines
- [ ] Fonts render correctly
- [ ] Unsubscribe link works
- [ ] CTA buttons are prominent and clickable
- [ ] Spacing looks consistent
- [ ] Images load (if any)

## Design Philosophy

**"Förtroendeingivande design"** (Trust-inspiring design)
- Inspiration: Skatteverket möter Klarna
- Clean, trustworthy, modern aesthetic
- Focus on clarity and transparency
- Professional yet approachable

## Support

For MailerLite-specific questions:
- MailerLite Help Center: https://help.mailerlite.com
- Template documentation: https://help.mailerlite.com/article/show/35074-email-templates

For design system questions:
- Reference `src/app/globals.css` and `tailwind.config.js`
