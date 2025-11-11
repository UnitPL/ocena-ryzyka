# AI Assistant Instructions for Ocena Ryzyka WordPress Plugin

This guide helps AI agents be immediately productive in this WordPress risk assessment tool plugin.

## Quick Start (Developer Workflows)

- **Install Dependencies**: Run `php composer.phar install` or `composer require mpdf/mpdf` from plugin root
- **Deploy for Testing**: Copy to WordPress `wp-content/plugins/` and activate
- **Debug Mode**: Set `WP_DEBUG=true` in `wp-config.php` to see extensive error_log output
- **Development Data**: Test dimensions page at `/wp-admin/admin.php?page=test-dimensions`

## Project Architecture

### Core Components
- Plugin Root (`ocena-ryzyka.php`): Bootstrap, hooks, enqueues
- Database Layer (`includes/database.php`): Table `projekty` with columns:
  - `kod_projektu` (ORM-XXXXX format)
  - `nazwa_maszyny` (machine name)
  - `data_json` (project data)
- UI Components:
  - Admin: `includes/admin-page.php` - Project listing & management
  - Frontend: `includes/frontend-form.php` - Risk assessment table UI via `[tabela_oceny_ryzyka]`
- Asset Management: `includes/image-handler.php` - Handles uploads in `uploads/ORM-XXXXX/`
- PDF Generation: `includes/pdf-generator.php` - mPDF integration

### Key Data Structures
```json
{
  "rows": [
    {
      "lp": "1",
      "obraz": "path/to/image.png",
      "obraz_elementow": "path/to/elements.png",
      "dph_przed": "value",
      "lo_po": "value",
      "hrn_po": "calculated",
      "stopien_przed": "value"
    }
  ]
}
```

## Integration Points & Examples

### AJAX Endpoints (includes/ajax-handlers.php)
```php
// Save project
wp_ajax_ocena_ryzyka_save_project
wp_ajax_nopriv_ocena_ryzyka_save_project

// Export PDF
wp_ajax_ocena_ryzyka_export_pdf
wp_ajax_nopriv_ocena_ryzyka_export_pdf
```

### Client-Side Storage
- `assets/js/autosave.js`: Handles localStorage backup
- `assets/js/project.js`: UI state & AJAX communication 
- `assets/js/pdf-export.js`: PDF generation requests

## Project-specific conventions and patterns

- Prefix: all global functions and constants use `ocena_ryzyka_` or `OCENA_RYZYKA_` to avoid collisions.
- Project code format: generated project codes are `ORM-XXXXXX` (see `ocena_ryzyka_generate_unique_code()` in `includes/project-manager.php`).
- Data shape: `data_json` is JSON with top-level `rows`, each row containing fields like `lp`, `obraz`, `obraz_elementow`, `dph_przed`, `lo_po`, `hrn_po`, `stopien_przed`, etc. Many renderer functions expect this exact structure (see `pdf-generator.php` and `frontend-form.php`).
- JS/localStorage: `assets/js/autosave.js` and `project.js` handle local autosave and project UI. When saving to server, images are sent as a separate `images` JSON map.

## Safety & secrets

- `includes/database.php` currently contains DB constants. Treat these as sensitive — do not leak or commit changes that expose production credentials. When running locally, override by defining constants elsewhere.

## Common tasks & where to change them

- Add a new AJAX action: add handler in `includes/ajax-handlers.php` and register with `add_action('wp_ajax_...')` and `wp_ajax_nopriv_...` as needed; follow the existing nonce-check pattern `check_ajax_referer('ocena-ryzyka-nonce', 'nonce')`.
- Change PDF layout: edit `assets/css/pdf-style.css` and the HTML generators in `includes/pdf-generator.php` (`ocena_ryzyka_generate_pdf_html`, `ocena_ryzyka_generate_table_headers`).
- Change upload path behavior: `includes/image-handler.php` exposes `ocena_ryzyka_get_upload_dir()` and `ocena_ryzyka_get_upload_url()`.

## Small examples to copy-paste

- Generate PDF programmatically (from PHP):
  $result = ocena_ryzyka_generate_pdf('ORM-ABC123'); // returns ['success'=>true,'file_path'=>...]
- Save project via AJAX (JS): POST to `ocenaRyzykaAjax.ajaxurl` with action `ocena_ryzyka_save_project`, nonce `ocena-ryzyka-nonce`, `data_json` and `images`.

## What an AI agent should avoid changing

- Don’t remove or rename the activation hook/DB creation logic (`ocena_ryzyka_create_tables`) without migration steps.
- Don’t change the AJAX nonce names or admin-ajax endpoints without updating JS localization in `ocena-ryzyka.php` and `frontend-form.php`.

## Where to look next (important files)

- `ocena-ryzyka.php` (plugin bootstrap, enqueues, activation hooks)
- `includes/database.php` (DB connection and table schema)
- `includes/ajax-handlers.php` (AJAX API surface)
- `includes/pdf-generator.php` (PDF logic, mPDF config)
- `includes/image-handler.php` (upload naming, cleanup)
- `assets/js/` (client-side behaviors: `project.js`, `autosave.js`, `pdf-export.js`)

If anything here is unclear or you'd like more detail (data shape examples, sample JSON rows, or a short test script that exercises save→export PDF), tell me which part to expand and I will iterate.
