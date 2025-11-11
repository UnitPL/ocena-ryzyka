<?php
if (!defined('ABSPATH')) {
    exit;
}

// Dodaj menu w panelu admina
add_action('admin_menu', 'ocena_ryzyka_admin_menu');

function ocena_ryzyka_admin_menu() {
    add_menu_page(
        'Ocena Ryzyka - Projekty',
        'Ocena Ryzyka',
        'manage_options',
        'ocena-ryzyka',
        'ocena_ryzyka_admin_page',
        'dashicons-shield-alt',
        30
    );
}

// Strona admina
function ocena_ryzyka_admin_page() {
    // Pobierz wszystkie projekty
    $projekty = ocena_ryzyka_get_all_projects();
    
    ?>
    <div class="wrap">
        <h1>📋 Ocena Ryzyka - Zarządzanie Projektami</h1>
        
        <div class="card" style="max-width: 100%; margin-top: 20px;">
            <h2>Lista wszystkich projektów</h2>
            
            <?php if (empty($projekty)): ?>
                <p style="color: #666; font-style: italic;">Brak zapisanych projektów.</p>
            <?php else: ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width: 50px;">ID</th>
                            <th style="width: 150px;">Kod Projektu</th>
                            <th>Nazwa Maszyny</th>
                            <th style="width: 120px;">Data utworzenia</th>
                            <th style="width: 100px;">Rozmiar</th>
                            <th style="width: 80px;">Wiersze</th>
                            <th style="width: 150px;">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($projekty as $projekt): 
                            $data = json_decode($projekt['data_json'], true);
                            $row_count = isset($data['rows']) ? count($data['rows']) : 0;
                            $size = ocena_ryzyka_get_project_size($projekt['kod_projektu']);
                        ?>
                            <tr id="projekt-<?php echo esc_attr($projekt['kod_projektu']); ?>">
                                <td><?php echo esc_html($projekt['id']); ?></td>
                                <td>
                                    <strong style="font-family: monospace; background: #f0f0f0; padding: 3px 8px; border-radius: 3px;">
                                        <?php echo esc_html($projekt['kod_projektu']); ?>
                                    </strong>
                                </td>
                                <td>
                                    <?php echo esc_html($projekt['nazwa_maszyny'] ?: '(bez nazwy)'); ?>
                                </td>
                                <td>
                                    <?php 
                                    $date = new DateTime($projekt['data_utworzenia']);
                                    echo $date->format('Y-m-d H:i'); 
                                    ?>
                                </td>
                                <td><?php echo ocena_ryzyka_format_size($size); ?></td>
                                <td style="text-align: center;">
                                    <span class="dashicons dashicons-list-view"></span>
                                    <?php echo $row_count; ?>
                                </td>
                                <td>
                                    <button 
                                        class="button button-small btn-delete-project" 
                                        data-kod="<?php echo esc_attr($projekt['kod_projektu']); ?>"
                                        style="color: #a00;">
                                        <span class="dashicons dashicons-trash" style="font-size: 16px; width: 16px; height: 16px;"></span>
                                        Usuń
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        
        <div class="card" style="max-width: 100%; margin-top: 20px;">
            <h3>ℹ️ Informacje</h3>
            <p>
                <strong>Katalog uploadów:</strong> 
                <code><?php echo ocena_ryzyka_get_upload_dir(); ?></code>
            </p>
            <p>
                <strong>Liczba projektów:</strong> <?php echo count($projekty); ?>
            </p>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        // Obsługa usuwania projektu
        $('.btn-delete-project').on('click', function() {
            const kod = $(this).data('kod');
            
            if (!confirm('Czy na pewno chcesz usunąć projekt ' + kod + '?\n\nUsunięte zostaną:\n- Dane z bazy\n- Wszystkie obrazy\n\nTej operacji nie można cofnąć!')) {
                return;
            }
            
            const $button = $(this);
            $button.prop('disabled', true).text('Usuwanie...');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'ocena_ryzyka_delete_project',
                    nonce: '<?php echo wp_create_nonce('ocena-ryzyka-nonce'); ?>',
                    kod_projektu: kod
                },
                success: function(response) {
                    if (response.success) {
                        $('#projekt-' + kod).fadeOut(300, function() {
                            $(this).remove();
                            
                            // Sprawdź czy są jeszcze projekty
                            if ($('tbody tr').length === 0) {
                                location.reload();
                            }
                        });
                        
                        alert('✅ Projekt usunięty pomyślnie!');
                    } else {
                        alert('❌ Błąd: ' + response.data.message);
                        $button.prop('disabled', false).text('Usuń');
                    }
                },
                error: function() {
                    alert('❌ Błąd połączenia');
                    $button.prop('disabled', false).text('Usuń');
                }
            });
        });
    });
    </script>
    
    <style>
    .card {
        background: white;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .wp-list-table th {
        font-weight: 600;
    }
    
    .btn-delete-project:hover {
        background: #a00;
        color: white !important;
        border-color: #a00;
    }
    </style>
    <?php
}