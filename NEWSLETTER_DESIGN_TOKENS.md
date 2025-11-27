# Newsletter Design Tokens - Quick Reference

## 🎨 Colors

| Token | Hex Code | Usage |
|-------|----------|-------|
| **Primary** | `#00875a` | Main brand color, CTAs, links, headings |
| **Secondary** | `#0052cc` | Secondary actions |
| **Accent** | `#ff991f` | Highlights, special emphasis |
| **Background** | `#fafafa` | Email background |
| **Foreground** | `#1a1a1a` | Main text color |
| **Muted** | `#6b7280` | Secondary text, descriptions |
| **Border** | `#e5e7eb` | Dividers, card borders |
| **Success** | `#10b981` | Success messages |
| **Warning** | `#f59e0b` | Warning messages |
| **Error** | `#ef4444` | Error messages |
| **Gray-100** | `#f3f4f6` | Light backgrounds, footer |

## 📝 Typography

### Font Family
```
Arial, Helvetica, sans-serif
```
*Fallback: system-ui, -apple-system*

### Font Sizes
- **H1**: `32px` (mobile) / `36-48px` (desktop)
- **H2**: `24-28px`
- **H3**: `18px`
- **Body**: `16px`
- **Small**: `14px`
- **Footer**: `12px` / `11px`

### Font Weights
- **Bold**: `700` (headings)
- **Semibold**: `600` (subheadings, buttons)
- **Medium**: `500` (emphasis)
- **Regular**: `400` (body text)

### Line Height
- **Headings**: `1.25` (tight)
- **Body**: `1.6` (comfortable reading)

## 📐 Spacing (8px grid)

| Size | Pixels | Usage |
|------|--------|-------|
| xs | `8px` | Small gaps |
| sm | `16px` | Standard padding/margin |
| md | `24px` | Medium spacing |
| lg | `32px` | Large spacing, sections |
| xl | `40px` | Hero sections |

## 🔲 Border Radius

- **Small**: `8px` - Cards, buttons
- **Full**: `9999px` - Pills, badges

## 🔗 Links & CTAs

### Primary Button
- Background: `#00875a`
- Text: `#ffffff`
- Padding: `16px 32px`
- Font size: `18px`
- Font weight: `600`
- Border radius: `8px`

### Secondary Button (on colored background)
- Background: `#ffffff`
- Text: `#00875a`
- Same padding/sizing as primary

### Links
- Color: `#00875a`
- Hover: Slightly darker shade
- Underline on hover (optional)

## 📦 Component Styles

### Feature Box
- Background: `rgba(0, 135, 90, 0.05)`
- Border: `1px solid rgba(0, 135, 90, 0.1)`
- Padding: `24px`
- Border radius: `8px`

### Benefit Card
- Background: `#ffffff`
- Border: `1px solid #e5e7eb`
- Padding: `16px`
- Border radius: `8px`
- Margin bottom: `16px`

### Divider
- Border: `1px solid #e5e7eb`
- Margin: `32px 0`

## 📱 Mobile Considerations

- Max width: `600px` for email container
- Padding: `16px` on mobile, `32px` on desktop
- Button min-height: `44px` (touch target)
- Text minimum: `14px` for readability

## ✨ Design Principles

1. **Trust-inspiring**: Clean, professional, transparent
2. **Accessible**: High contrast, readable fonts
3. **Consistent**: Use design tokens throughout
4. **Mobile-first**: Responsive by default

## 🔄 MailerLite Merge Tags

- Name: `{{ subscriber.first_name }}`
- Email: `{{ subscriber.email }}`
- Unsubscribe: `{{ unsubscribe }}`
- Company: `{{ subscriber.company }}` (if available)

## 📎 Quick Copy-Paste

### Primary CTA Button
```html
<a href="https://elbespararen.se/upload" style="display: inline-block; padding: 16px 32px; background-color: #00875a; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 600; border-radius: 8px;">
    Kom igång nu →
</a>
```

### Heading Style
```html
<h1 style="font-size: 32px; font-weight: 700; color: #1a1a1a; line-height: 1.25; margin: 0 0 16px;">
    Your Heading
</h1>
```

### Body Text
```html
<p style="font-size: 16px; line-height: 1.6; color: #1a1a1a; margin: 0 0 16px;">
    Your text content here.
</p>
```

### Muted Text
```html
<p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin: 0;">
    Secondary information.
</p>
```
