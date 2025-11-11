<?php
/**
 * Plugin Name: Ocena Ryzyka
 * Description: Narzędzie do tworzenia oceny ryzyka maszyn z opcją zapisu do bazy danych i localStorage
 * Version: 1.0.0
 * Author: Twoje Imię
 * Text Domain: ocena-ryzyka
 */

// Zapobieganie bezpośredniemu dostępowi
if (!defined('ABSPATH')) {
    exit;
}

// Definiowanie stałych wtyczki
define('OCENA_RYZYKA_VERSION', '1.0.0');
define('OCENA_RYZYKA_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('OCENA_RYZYKA_PLUGIN_URL', plugin_dir_url(__FILE__));

// Ładowanie plików wtyczki
require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/database.php';
require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/admin-page.php';
require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/frontend-form.php';
require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/project-manager.php';
require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/ajax-handlers.php';
require_once OCENA_RYZYKA_PLUGIN_DIR . 'data/lists.php';
require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/image-handler.php';
require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/pdf-generator.php';

// Strona testowa w panelu admina (tylko dla adminów)
if (is_admin()) {
    require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/admin-test-dimensions.php';
}

// Aktywacja wtyczki - tworzenie tabel
register_activation_hook(__FILE__, 'ocena_ryzyka_activate');

function ocena_ryzyka_activate() {
    require_once OCENA_RYZYKA_PLUGIN_DIR . 'includes/database.php';
    ocena_ryzyka_create_tables();
    
    // Opcjonalnie: dodaj flush rewrite rules
    flush_rewrite_rules();
}

// Inicjalizacja wtyczki - zmienione na 'init' dla WordPress 6.7+
//add_action('init', 'ocena_ryzyka_init');

/*function ocena_ryzyka_init() {
    // Ładowanie tłumaczeń (na przyszłość)
    load_plugin_textdomain('ocena-ryzyka', false, dirname(plugin_basename(__FILE__)) . '/languages');
}*/

// Harmonogram czyszczenia cache obrazków
add_action('wp', 'ocena_ryzyka_schedule_cache_cleanup');

function ocena_ryzyka_schedule_cache_cleanup() {
    if (!wp_next_scheduled('ocena_ryzyka_daily_cache_cleanup')) {
        wp_schedule_event(time(), 'daily', 'ocena_ryzyka_daily_cache_cleanup');
    }
}

// Wykonaj czyszczenie cache
add_action('ocena_ryzyka_daily_cache_cleanup', 'ocena_ryzyka_run_cache_cleanup');

function ocena_ryzyka_run_cache_cleanup() {
    $deleted = ocena_ryzyka_clean_image_cache(7); // 7 dni
    
    if (defined('WP_DEBUG') && WP_DEBUG && $deleted > 0) {
        error_log('Ocena Ryzyka: Wyczyszczono ' . $deleted . ' plików cache obrazków');
    }
}

// Wyczyść harmonogram przy dezaktywacji
register_deactivation_hook(__FILE__, 'ocena_ryzyka_deactivate');

function ocena_ryzyka_deactivate() {
    wp_clear_scheduled_hook('ocena_ryzyka_daily_cache_cleanup');
}

// Rejestracja skryptów i stylów
add_action('wp_enqueue_scripts', 'ocena_ryzyka_enqueue_scripts', 999);

function ocena_ryzyka_enqueue_scripts() {
    // CSS
    wp_enqueue_style(
        'ocena-ryzyka-style',
        OCENA_RYZYKA_PLUGIN_URL . 'assets/css/style.css',
        array(),
        OCENA_RYZYKA_VERSION
    );
    
    // JavaScript
    wp_enqueue_script(
        'ocena-ryzyka-script',
        OCENA_RYZYKA_PLUGIN_URL . 'assets/js/script.js',
        array('jquery'),
        OCENA_RYZYKA_VERSION,
        true
    );
    
    wp_enqueue_script(
        'ocena-ryzyka-autosave',
        OCENA_RYZYKA_PLUGIN_URL . 'assets/js/autosave.js',
        array('jquery'),
        OCENA_RYZYKA_VERSION,
        true
    );
    
    wp_enqueue_script(
        'ocena-ryzyka-project',
        OCENA_RYZYKA_PLUGIN_URL . 'assets/js/project.js',
        array('jquery'),
        OCENA_RYZYKA_VERSION,
        true
    );
    
    wp_enqueue_script(
        'ocena-ryzyka-pdf-export',
        OCENA_RYZYKA_PLUGIN_URL . 'assets/js/pdf-export.js',
        array('jquery'),
        OCENA_RYZYKA_VERSION,
        true
    );
    
    // Przekazanie danych do JavaScript
    wp_localize_script('ocena-ryzyka-script', 'ocenaRyzykaAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('ocena-ryzyka-nonce')
    ));
}

// Hook aktywacji wtyczki - tworzy tabele
register_activation_hook(__FILE__, 'ocena_ryzyka_create_tables');

// Hook do sprawdzenia tabel przy każdym ładowaniu (opcjonalnie)
add_action('plugins_loaded', 'ocena_ryzyka_check_tables');

function ocena_ryzyka_check_tables() {
    global $ocena_ryzyka_db;
    
    // Sprawdź czy tabela projekty istnieje
    $table_name = 'projekty';
    $table_exists = $ocena_ryzyka_db->get_var("SHOW TABLES LIKE '$table_name'");
    
    if ($table_exists != $table_name) {
        // Tabela nie istnieje - utwórz ją
        ocena_ryzyka_create_tables();
    }
}