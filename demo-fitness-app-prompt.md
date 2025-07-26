Based on the following project requirements, create the corresponding Jira user stories for the **"FitPulse Landing Page"** project.

For each story, follow this structure:

```
**Description**
In natural language, explain what this story is about and why it's relevant to the project.

**Acceptance Criteria**
List clear, testable criteria that can be validated as true or false.

**Dev Notes (optional)**
Add any technical details, implementation hints, or constraints the developer should be aware of.
```

Additional instructions:

- Group stories logically by page section or dev flow.
- Use concise, descriptive titles.
- Add the following labels: `landing-page`, `fitpulse`, `frontend`.
- Any story that doesn't include an estimation should be tagged with `ai-estimation`.

Here is the project spec:

```
📄 Requirements Document — Fitness App Landing Page

Project Name: FitPulse Landing Page
Owner: Product Team
Last Updated: Oct 2025

Overview:
We need a modern, responsive landing page for our fitness app FitPulse. The goal is to drive user sign-ups and build trust through social proof. This landing page will later serve as the foundation for future marketing experiments and localization.

Goals:
- Increase sign-ups by clearly communicating value.
- Capture leads via a contact form.
- Showcase testimonials to build credibility.
- Ensure accessibility and responsive design.

Scope:

Sections:
- Hero Section: App name, slogan, and a primary CTA button ("Download now").
- Benefits Section: Three benefits with icons and short descriptions.
- Testimonials Section: Quotes from three fictional users with avatars.
- Contact Form: Name, email, message. Basic validation. Placeholder backend.

Technical Requirements:
- Built using HTML, TailwindCSS, and JavaScript.
- Responsive for desktop and mobile.
- Semantic HTML and accessibility.
- Placeholder POST endpoint for the form.
- BEM or Tailwind naming conventions.

Optional:
- i18n-ready structure (no translations yet).
- Light/dark mode toggle.
```
