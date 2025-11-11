(function($) {
    'use strict';
    
    let rowCounter = 1;
    
    // Kolejność sortowania rodzajów zagrożeń
    const rodzajOrder = [
        'Zagrożenia mechaniczne',
        'Zagrożenia elektryczne',
        'Zagrożenia termiczne',
        'Zagrożenia hałasem',
        'Zagrożenia powodowane drganiami mechanicznymi',
        'Zagrożenia powodowane promieniowaniem',
        'Zagrożenia powodowane materiałami/substancjami',
        'Zagrożenia powodowane nieprzestrzeganiem zasad ergonomii',
        'Zagrożenia wynikające ze środowiska, w którym maszyna jest użytkowana',
        'Kombinacja zagrożeń'
    ];
    
    $(document).ready(function() {
        console.log('Ocena Ryzyka - inicjalizacja');
        
        // Inicjalizacja tabeli - dodaj pierwszy wiersz wyboru
        initTable();
        
        // Obsługa przycisku "Dodaj wiersz"
        $('#btn-dodaj-wiersz').on('click', function() {
            addSelectionRow();
        });
        
        // Pozostałe funkcje przycisków
        $('#btn-nowy-projekt').on('click', function() {
            console.log('Nowy projekt - TODO');
        });
        
        $('#btn-zapisz-projekt').on('click', function() {
            console.log('Zapisz projekt - TODO');
        });
        
        $('#btn-otworz-projekt').on('click', function() {
            console.log('Otwórz projekt - TODO');
        });
    });
    
    // Inicjalizacja tabeli - dodaj pierwszy wiersz wyboru
    function initTable() {
        addSelectionRow();
    }
    
    // Dodawanie zielonego wiersza wyboru rodzaju zagrożenia
    function addSelectionRow() {
        const selectionId = 'selection-' + rowCounter;
        const lp = rowCounter;
        
        const row = `
            <tr id="${selectionId}" class="selection-row" data-selection-id="${rowCounter}">
                <td colspan="28" class="selection-cell">
                    <div class="selection-content">
                        <span class="selection-label">🎯 ${lp}. Wybierz rodzaj zagrożenia:</span>
                        <select class="selection-dropdown">
                            <option value="">-- Wybierz rodzaj zagrożenia --</option>
                            ${generateRodzajeZagrozenOptions()}
                        </select>
                        <button type="button" class="btn-confirm-selection">✓ Potwierdź i rozpocznij wypełnianie</button>
                    </div>
                </td>
            </tr>
        `;
        
        $('#table-body').append(row);
        
        const $row = $('#' + selectionId);
        
        // Obsługa potwierdzenia wyboru
        $row.find('.btn-confirm-selection').on('click', function() {
            const rodzaj = $row.find('.selection-dropdown').val();
            
            if (!rodzaj) {
                alert('Proszę wybrać rodzaj zagrożenia!');
                return;
            }
            
            // Zamień wiersz wyboru na normalny wiersz danych
            replaceWithDataRow($row, rodzaj);
        });
        
        // Obsługa Enter w select
        $row.find('.selection-dropdown').on('keypress', function(e) {
            if (e.which === 13) {
                $row.find('.btn-confirm-selection').click();
            }
        });
        
        // Focus na select
        setTimeout(function() {
            $row.find('.selection-dropdown').focus();
        }, 100);
        
        // PRZEWIŃ TABELĘ DO LEWEJ
        $('.ocena-ryzyka-table-wrapper').animate({
            scrollLeft: 0
        }, 300);
    }
    
    // Zamiana wiersza wyboru na normalny wiersz danych
    function replaceWithDataRow($selectionRow, rodzajZagrozenia) {
        const selectionId = $selectionRow.attr('data-selection-id');
        const dataRow = generateDataRow(selectionId, rodzajZagrozenia);
        
        // Zamień wiersz
        $selectionRow.replaceWith(dataRow);
        
        // Dodaj obsługę zdarzeń
        const $newRow = $('#row-' + selectionId);
        attachRowEvents($newRow);
        
        // Zwiększ licznik dla następnego wiersza
        rowCounter++;
        window.ocenaRyzykaRowCounter = rowCounter;  // <-- DODAJ TĘ LINIĘ
        
        // Posortuj wiersze według rodzaju
        sortRowsByRodzaj();
    }

    // Funkcja zwracająca ikonę SVG dla rodzaju zagrożenia
    function getRodzajIcon(rodzajZagrozenia) {
        const icons = {
            'Zagrożenia mechaniczne': '<svg width="20" height="20" viewBox="0 0 98 98" fill="#f07400" stroke="#000" stroke-width="2"><path d="M97.1 84.8L69 56.7c-.8-.8-2.1-.8-2.9 0l-.8.8-13.2-13.2 8.9-8.9 1.6 1.6c.8.8 2.1.8 2.9 0l8.4-8.4c.8-.8.8-2.1 0-2.9L48.9.6c-.8-.8-2.1-.8-2.9 0l-8.4 8.4c-.8.8-.8 2.1 0 2.9l1.6 1.6-25.7 25.7-1.6-1.6c-.8-.8-2.1-.8-2.9 0l-8.4 8.4c-.8.8-.8 2.1 0 2.9l25.1 25.1c.8.8 2.1.8 2.9 0l8.4-8.4c.8-.8.8-2.1 0-2.9l-1.6-1.6 8.9-8.9 13.2 13.2-.8.8c-.8.8-.8 2.1 0 2.9l28 28c.8.8 2.1.8 2.9 0l9.4-9.4c.8-.8.8-2.1 0-2.9z"/></svg>',
            
            'Zagrożenia elektryczne': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#ffc107" stroke="#f57c00" stroke-width="1"/></svg>',
            
            'Zagrożenia termiczne': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C9 8 6 10 6 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-4-3-6-6-12z" fill="#ff5722"/><path d="M12 6c-1 3-2 4-2 6 0 1.1.9 2 2 2s2-.9 2-2c0-2-1-3-2-6z" fill="#ffc107"/></svg>',
            
            'Zagrożenia hałasem': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 7v10c2.21 0 4-1.79 4-4s-1.79-4-4-4z" fill="#9c27b0"/><path d="M11 5c0 2 1 3 2 3s2-1 2-3" stroke="#9c27b0" stroke-width="1.5" fill="none"/><path d="M13 9c0 1.5.5 2.5 1.5 2.5S16 10.5 16 9" stroke="#9c27b0" stroke-width="1.5" fill="none"/><path d="M15 12c0 1 .5 2 1 2s1-1 1-2" stroke="#9c27b0" stroke-width="1.5" fill="none"/></svg>',
            
            'Zagrożenia powodowane drganiami mechanicznymi': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12h3c1 0 1-2 2-2s1 2 2 2 1-2 2-2 1 2 2 2 1-2 2-2 1 2 2 2 1-2 2-2h3" stroke="#009688" stroke-width="2" fill="none"/><path d="M2 8h3c1 0 1-1.5 2-1.5s1 1.5 2 1.5 1-1.5 2-1.5 1 1.5 2 1.5 1-1.5 2-1.5 1 1.5 2 1.5h3" stroke="#009688" stroke-width="1.5" fill="none" opacity="0.6"/></svg>',
            
            'Zagrożenia powodowane promieniowaniem': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2" fill="#ffc107"/><path d="M12 6L14 10H10L12 6z" fill="#ffc107"/><path d="M16.5 15.5L14 12H10L7.5 15.5z" fill="#ffc107"/><circle cx="12" cy="12" r="9" stroke="#ffc107" stroke-width="1.5" fill="none"/></svg>',
            
            'Zagrożenia powodowane materiałami/substancjami': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 2v6l-4 8c-1 2 0 4 2 4h10c2 0 3-2 2-4l-4-8V2H9z" fill="none" stroke="#e91e63" stroke-width="1.5"/><rect x="9" y="2" width="6" height="1" fill="#e91e63"/><circle cx="11" cy="15" r="1" fill="#e91e63"/></svg>',
            
            'Zagrożenia powodowane nieprzestrzeganiem zasad ergonomii': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" fill="#3f51b5"/><path d="M12 8v6m0 0l-3 6m3-6l3 6m-3-6l-3-2m3 2l3-2" stroke="#3f51b5" stroke-width="1.8" stroke-linecap="round"/></svg>',
            
            'Zagrożenia wynikające ze środowiska, w którym maszyna jest użytkowana': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 14c-1.66 0-3-1.34-3-3s1.34-3 3-3c.07 0 .14 0 .21.01C6.89 6.23 8.91 5 11.24 5c2.77 0 5.07 2.09 5.39 4.78 1.88.23 3.37 1.81 3.37 3.72 0 2.07-1.68 3.75-3.75 3.75H6z" fill="#4caf50"/></svg>',
            
            'Kombinacja zagrożeń': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#795548" stroke-width="1.5" fill="none"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4" stroke="#795548" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="#795548"/></svg>'
        };
        
        return icons[rodzajZagrozenia] || '';
    }
    
    // Generowanie normalnego wiersza danych
    function generateDataRow(lp, rodzajZagrozenia) {
        const rowId = 'row-' + lp;
        
        return `
            <tr id="${rowId}" data-row-id="${lp}" data-rodzaj="${rodzajZagrozenia}" class="rodzaj-${getRodzajClass(rodzajZagrozenia)}">
                <!-- 1. Lp z ikonką -->
                <td class="cell-lp">
                    <div class="lp-content">
                        <span class="lp-number">${lp}</span>
                        <div class="lp-icon">${getRodzajIcon(rodzajZagrozenia)}</div>
                    </div>
                </td>
                
                <!-- 2. Część systemu -->
                <td class="cell-editable">
                    <input type="text" class="cell-input" data-field="czesc_systemu" placeholder="Część systemu" />
                </td>
                
                <!-- 3. Obraz -->
                <td class="cell-image">
                    <button type="button" class="btn-upload" data-field="obraz">📷</button>
                    <input type="file" class="file-input" accept="image/*" style="display:none;" />
                    <img class="preview-image" src="" style="display:none; max-width:50px; max-height:50px;" />
                </td>
                
                <!-- 4. Źródło zagrożenia z listy -->
                <td class="cell-select">
                    <select class="cell-select-input" data-field="zrodlo_zagrozenia">
                        <option value="">-- Wybierz źródło --</option>
                        ${generateZrodlaOptions(rodzajZagrozenia)}
                    </select>
                    <input type="text" class="cell-input zrodlo-custom-input" data-field="zrodlo_zagrozenia_custom" placeholder="Wpisz własne źródło" style="display:none; margin-top: 5px;" />
                </td>

                <!-- 5. Źródło zagrożenia - opis -->
                <td class="cell-editable">
                    <textarea class="cell-textarea" data-field="zrodlo_zagrozenia_opis" rows="2" placeholder="Opis źródła zagrożenia"></textarea>
                </td>
                
                <!-- 6. Obraz elementów niebezpiecznych -->
                <td class="cell-image">
                    <button type="button" class="btn-upload" data-field="obraz_elementow">📷</button>
                    <input type="file" class="file-input" accept="image/*" style="display:none;" />
                    <img class="preview-image" src="" style="display:none; max-width:50px; max-height:50px;" />
                </td>
                
                <!-- 7. Potencjalne następstwo -->
                <td class="cell-editable">
                    <input type="text" class="cell-input" data-field="potencjalne_nastepstwo" placeholder="Następstwo" />
                </td>
                
                <!-- 8. Część ciała -->
                <td class="cell-editable">
                    <input type="text" class="cell-input" data-field="czesc_ciala" placeholder="Część ciała" />
                </td>
                
                <!-- 9. Możliwe skutki zagrożenia -->
                <td class="cell-editable">
                    <textarea class="cell-textarea" data-field="skutki" rows="2" placeholder="Możliwe skutki"></textarea>
                </td>
                
                <!-- 10. Fazy życia produktu -->
                <td class="cell-editable">
                    <textarea class="cell-textarea" data-field="fazy_zycia" rows="2" placeholder="Fazy życia produktu"></textarea>
                </td>
                
                <!-- 11. DPH przed -->
                <td class="cell-select">
                    <select class="cell-select-input risk-param" data-field="dph_przed" data-calc-group="przed">
                        <option value="">--</option>
                        ${generateDphOptions()}
                    </select>
                </td>
                
                <!-- 12. LO przed -->
                <td class="cell-select">
                    <select class="cell-select-input risk-param" data-field="lo_przed" data-calc-group="przed">
                        <option value="">--</option>
                        ${generateLoOptions()}
                    </select>
                </td>
                
                <!-- 13. FE przed -->
                <td class="cell-select">
                    <select class="cell-select-input risk-param" data-field="fe_przed" data-calc-group="przed">
                        <option value="">--</option>
                        ${generateFeOptions()}
                    </select>
                </td>
                
                <!-- 14. NP przed -->
                <td class="cell-select">
                    <select class="cell-select-input risk-param" data-field="np_przed" data-calc-group="przed">
                        <option value="">--</option>
                        ${generateNpOptions()}
                    </select>
                </td>
                
                <!-- 15. Ryzyko HRN przed (obliczane) -->
                <td class="cell-calculated">
                    <span class="calc-hrn-przed">-</span>
                </td>
                
                <!-- 16. Stopień ryzyka przed (obliczany) -->
                <td class="cell-calculated">
                    <span class="calc-stopien-przed">-</span>
                </td>
                
                <!-- 17. Zastosowane środki profilaktyczne -->
                <td class="cell-editable">
                    <textarea class="cell-textarea" data-field="srodki_profilaktyczne" rows="2" placeholder="Środki profilaktyczne"></textarea>
                </td>
                
                <!-- 18. DPH po -->
                <td class="cell-select">
                    <select class="cell-select-input risk-param" data-field="dph_po" data-calc-group="po">
                        <option value="">--</option>
                        ${generateDphOptions()}
                    </select>
                </td>
                
                <!-- 19. LO po -->
                <td class="cell-select">
                    <select class="cell-select-input risk-param" data-field="lo_po" data-calc-group="po">
                        <option value="">--</option>
                        ${generateLoOptions()}
                    </select>
                </td>
                
                <!-- 20. FE po -->
                <td class="cell-select">
                    <select class="cell-select-input risk-param" data-field="fe_po" data-calc-group="po">
                        <option value="">--</option>
                        ${generateFeOptions()}
                    </select>
                </td>
                
                <!-- 21. NP po -->
                <td class="cell-select">
                    <select class="cell-select-input risk-param" data-field="np_po" data-calc-group="po">
                        <option value="">--</option>
                        ${generateNpOptions()}
                    </select>
                </td>
                
                <!-- 22. Ryzyko HRN po (obliczane) -->
                <td class="cell-calculated">
                    <span class="calc-hrn-po">-</span>
                </td>
                
                <!-- 23. Stopień ryzyka po (obliczany) -->
                <td class="cell-calculated">
                    <span class="calc-stopien-po">-</span>
                </td>

                <!-- 24. Obniżono ryzyko o [%] -->
                <td class="cell-calculated">
                    <span class="calc-redukcja">-</span>
                </td>
                
                <!-- 25. Rodzaj zagrożenia -->
                <td class="cell-select cell-rodzaj-zagrozenia">
                    <select class="cell-select-input rodzaj-zagrozenia-select" data-field="rodzaj_zagrozenia">
                        <option value="">-- Wybierz rodzaj zagrożenia --</option>
                        ${generateRodzajeZagrozenOptionsWithSelected(rodzajZagrozenia)}
                    </select>
                </td>
                
                <!-- 26. Przycisk usuwania wiersza -->
                <td class="cell-actions">
                    <button type="button" class="btn-delete-row" title="Usuń wiersz">🗑️</button>
                </td>
            </tr>
        `;
    }
    
    // Generowanie opcji rodzajów zagrożeń
    function generateRodzajeZagrozenOptions() {
        if (typeof ocenaRyzykaData === 'undefined' || !ocenaRyzykaData.rodzajeZagrozen) {
            return '';
        }
        
        let options = '';
        ocenaRyzykaData.rodzajeZagrozen.forEach(function(rodzaj) {
            options += `<option value="${rodzaj}">${rodzaj}</option>`;
        });
        return options;
    }
    
    // Generowanie opcji z wybranym rodzajem
    function generateRodzajeZagrozenOptionsWithSelected(selected) {
        if (typeof ocenaRyzykaData === 'undefined' || !ocenaRyzykaData.rodzajeZagrozen) {
            return '';
        }
        
        let options = '';
        ocenaRyzykaData.rodzajeZagrozen.forEach(function(rodzaj) {
            const isSelected = rodzaj === selected ? 'selected' : '';
            options += `<option value="${rodzaj}" ${isSelected}>${rodzaj}</option>`;
        });
        return options;
    }
    
    // Generowanie opcji dla źródeł zagrożeń - filtrowanie według rodzaju zagrożenia
    function generateZrodlaOptions(rodzajZagrozenia) {
        if (typeof ocenaRyzykaData === 'undefined' || !ocenaRyzykaData.zrodla) {
            return '';
        }

        let options = '';

        // Jeśli podano rodzaj zagrożenia, pokaż tylko źródła z tej kategorii
        if (rodzajZagrozenia && rodzajZagrozenia !== '' && rodzajZagrozenia !== 'Kombinacja zagrożeń') {
            if (ocenaRyzykaData.zrodla[rodzajZagrozenia]) {
                options += `<optgroup label="${rodzajZagrozenia}">`;
                ocenaRyzykaData.zrodla[rodzajZagrozenia].forEach(function(item) {
                    options += `<option value="${item}">${item}</option>`;
                });
                // Dodaj opcję "Inne źródło" na końcu kategorii
                options += `<option value="__INNE__">Inne źródło</option>`;
                options += `</optgroup>`;
            }
        } else {
            // Dla "Kombinacja zagrożeń" lub braku wyboru - pokaż wszystkie kategorie
            for (let category in ocenaRyzykaData.zrodla) {
                options += `<optgroup label="${category}">`;
                ocenaRyzykaData.zrodla[category].forEach(function(item) {
                    options += `<option value="${item}">${item}</option>`;
                });
                // Dodaj opcję "Inne źródło" na końcu każdej kategorii
                options += `<option value="__INNE__">Inne źródło</option>`;
                options += `</optgroup>`;
            }
        }
        return options;
    }
    
    // Generowanie opcji dla DPH
    function generateDphOptions() {
        if (typeof ocenaRyzykaData === 'undefined' || !ocenaRyzykaData.dph) {
            return '';
        }
        
        let options = '';
        ocenaRyzykaData.dph.forEach(function(item) {
            options += `<option value="${item.wartosc}">${item.wartosc} - ${item.opis}</option>`;
        });
        return options;
    }
    
    // Generowanie opcji dla LO
    function generateLoOptions() {
        if (typeof ocenaRyzykaData === 'undefined' || !ocenaRyzykaData.lo) {
            return '';
        }
        
        let options = '';
        ocenaRyzykaData.lo.forEach(function(item) {
            options += `<option value="${item.wartosc}">${item.wartosc} - ${item.opis}</option>`;
        });
        return options;
    }
    
    // Generowanie opcji dla FE
    function generateFeOptions() {
        if (typeof ocenaRyzykaData === 'undefined' || !ocenaRyzykaData.fe) {
            return '';
        }
        
        let options = '';
        ocenaRyzykaData.fe.forEach(function(item) {
            options += `<option value="${item.wartosc}">${item.wartosc} - ${item.opis}</option>`;
        });
        return options;
    }
    
    // Generowanie opcji dla NP
    function generateNpOptions() {
        if (typeof ocenaRyzykaData === 'undefined' || !ocenaRyzykaData.np) {
            return '';
        }
        
        let options = '';
        ocenaRyzykaData.np.forEach(function(item) {
            options += `<option value="${item.wartosc}">${item.wartosc} - ${item.opis}</option>`;
        });
        return options;
    }
    
    // Przypisanie obsługi zdarzeń do wiersza
    function attachRowEvents($row) {
        // Obsługa zmiany w parametrach ryzyka - automatyczne obliczenia
        $row.find('.risk-param').on('change', function() {
            calculateRisk($row);
        });

        // Obsługa zmiany źródła zagrożenia - pokaż/ukryj pole własnego źródła
        $row.find('[data-field="zrodlo_zagrozenia"]').on('change', function() {
            handleZrodloChange($row);
        });

        // Obsługa zmiany rodzaju zagrożenia - automatyczne sortowanie i aktualizacja źródeł
        $row.find('.rodzaj-zagrozenia-select').on('change', function() {
            const rodzaj = $(this).val();
            if (rodzaj) {
                // Zaktualizuj klasę i atrybut
                updateRowRodzaj($row, rodzaj);
                // Zaktualizuj ikonkę
                $row.find('.lp-icon').html(getRodzajIcon(rodzaj));
                // Zaktualizuj listę źródeł zagrożeń
                updateZrodlaDropdown($row, rodzaj);
                // Posortuj wiersze
                sortRowsByRodzaj();
            }
        });
        
        // Obsługa przycisków uploadu obrazów
        $row.find('.btn-upload').on('click', function() {
            $(this).siblings('.file-input').trigger('click');
        });
        
        // Obsługa wyboru pliku
        $row.find('.file-input').on('change', function() {
            handleImageUpload(this);
        });
        
        // Obsługa usuwania wiersza
        $row.find('.btn-delete-row').on('click', function() {
            deleteRow($row);
        });
    }
    
    // Aktualizacja rodzaju zagrożenia w wierszu
    function updateRowRodzaj($row, rodzaj) {
        // Usuń poprzednie klasy rodzaju
        $row.removeClass(function(index, className) {
            return (className.match(/rodzaj-\d+/g) || []).join(' ');
        });

        // Dodaj nową klasę
        $row.addClass('rodzaj-' + getRodzajClass(rodzaj));

        // Zaktualizuj atrybut
        $row.attr('data-rodzaj', rodzaj);
    }

    // Obsługa zmiany źródła zagrożenia - pokaż/ukryj pole własnego źródła
    function handleZrodloChange($row) {
        const $zrodloSelect = $row.find('[data-field="zrodlo_zagrozenia"]');
        const $customInput = $row.find('[data-field="zrodlo_zagrozenia_custom"]');
        const selectedValue = $zrodloSelect.val();

        if (selectedValue === '__INNE__') {
            // Pokaż pole tekstowe dla własnego źródła
            $customInput.show();
            $customInput.focus();
        } else {
            // Ukryj pole tekstowe, ale NIE czyść jego wartości
            // Użytkownik może wrócić do "Inne źródło" i wartość będzie zachowana
            $customInput.hide();
        }
    }

    // Aktualizacja listy rozwijanej źródeł zagrożeń
    function updateZrodlaDropdown($row, rodzaj) {
        const $zrodloSelect = $row.find('[data-field="zrodlo_zagrozenia"]');
        const $customInput = $row.find('[data-field="zrodlo_zagrozenia_custom"]');
        const currentValue = $zrodloSelect.val();
        const customValue = $customInput.val();

        // Wygeneruj nowe opcje dla wybranego rodzaju zagrożenia
        const newOptions = generateZrodlaOptions(rodzaj);

        // Zapisz aktualnie wybraną wartość
        $zrodloSelect.html('<option value="">-- Wybierz źródło --</option>' + newOptions);

        // Sprawdź czy poprzednia wartość jest nadal dostępna w nowej liście
        const optionExists = $zrodloSelect.find('option[value="' + currentValue + '"]').length > 0;

        if (optionExists && currentValue !== '') {
            // Przywróć poprzednią wartość jeśli nadal istnieje
            $zrodloSelect.val(currentValue);
            // Jeśli to było "Inne źródło", pokaż pole custom
            if (currentValue === '__INNE__' && customValue !== '') {
                $customInput.show();
            }
        } else if (currentValue === '__INNE__') {
            // Jeśli było wybrane "Inne źródło" ale zmienił się rodzaj zagrożenia
            // Przywróć wybór "Inne źródło" i pokaż pole (zachowaj wartość custom)
            $zrodloSelect.val('__INNE__');
            if (customValue !== '') {
                $customInput.show();
            }
        } else {
            // Zresetuj wybór jeśli poprzednia wartość nie jest dostępna
            // NIE czyścimy wartości custom - tylko ukrywamy pole
            $zrodloSelect.val('');
            $customInput.hide();
        }
    }
    
    // Konwersja nazwy rodzaju na numer klasy
    function getRodzajClass(rodzaj) {
        const index = rodzajOrder.indexOf(rodzaj);
        return index !== -1 ? index : 999;
    }
    
    // Sortowanie wierszy według rodzaju zagrożenia
    function sortRowsByRodzaj() {
        const $tbody = $('#table-body');
        const $rows = $tbody.find('tr:not(.selection-row)').get();
        
        $rows.sort(function(a, b) {
            const rodzajA = $(a).attr('data-rodzaj') || '';
            const rodzajB = $(b).attr('data-rodzaj') || '';
            
            const indexA = rodzajOrder.indexOf(rodzajA);
            const indexB = rodzajOrder.indexOf(rodzajB);
            
            const orderA = indexA !== -1 ? indexA : 999;
            const orderB = indexB !== -1 ? indexB : 999;
            
            return orderA - orderB;
        });
        
        $.each($rows, function(index, row) {
            $tbody.append(row);
        });
        
        // Przenumeruj wiersze po sortowaniu
        renumberRows();
    }
    
    // Obliczanie ryzyka dla wiersza
    function calculateRisk($row) {
        // Pobierz wartości przed korektą
        const dphPrzed = parseFloat($row.find('[data-field="dph_przed"]').val()) || 0;
        const loPrzed = parseFloat($row.find('[data-field="lo_przed"]').val()) || 0;
        const fePrzed = parseFloat($row.find('[data-field="fe_przed"]').val()) || 0;
        const npPrzed = parseFloat($row.find('[data-field="np_przed"]').val()) || 0;
        
        // Oblicz HRN przed
        if (dphPrzed && loPrzed && fePrzed && npPrzed) {
            const hrnPrzed = dphPrzed * loPrzed * fePrzed * npPrzed;
            const $hrnPrzedSpan = $row.find('.calc-hrn-przed');
            const $stopienPrzedSpan = $row.find('.calc-stopien-przed');
            const $hrnPrzedCell = $hrnPrzedSpan.parent();
            const $stopienPrzedCell = $stopienPrzedSpan.parent();

            $hrnPrzedSpan.text(hrnPrzed.toFixed(2));

            // Określ stopień ryzyka
            const stopienPrzed = getRiskLevel(hrnPrzed);
            $stopienPrzedSpan.text(stopienPrzed);

            // Ustaw kolory tła na całych komórkach
            const colorPrzed = getRiskColor(hrnPrzed);
            $hrnPrzedCell.css('background-color', colorPrzed);
            $stopienPrzedCell.css('background-color', colorPrzed);
        } else {
            $row.find('.calc-hrn-przed').text('-');
            $row.find('.calc-stopien-przed').text('-');

            // Usuń kolory tła z komórek
            $row.find('.calc-hrn-przed').parent().css('background-color', '');
            $row.find('.calc-stopien-przed').parent().css('background-color', '');
        }
        
        // Pobierz wartości po korekcie
        const dphPo = parseFloat($row.find('[data-field="dph_po"]').val()) || 0;
        const loPo = parseFloat($row.find('[data-field="lo_po"]').val()) || 0;
        const fePo = parseFloat($row.find('[data-field="fe_po"]').val()) || 0;
        const npPo = parseFloat($row.find('[data-field="np_po"]').val()) || 0;
        
        // Oblicz HRN po
        if (dphPo && loPo && fePo && npPo) {
            const hrnPo = dphPo * loPo * fePo * npPo;
            const $hrnPoSpan = $row.find('.calc-hrn-po');
            const $stopienPoSpan = $row.find('.calc-stopien-po');
            const $hrnPoCell = $hrnPoSpan.parent();
            const $stopienPoCell = $stopienPoSpan.parent();

            $hrnPoSpan.text(hrnPo.toFixed(2));

            // Określ stopień ryzyka
            const stopienPo = getRiskLevel(hrnPo);
            $stopienPoSpan.text(stopienPo);

            // Ustaw kolory tła na całych komórkach
            const colorPo = getRiskColor(hrnPo);
            $hrnPoCell.css('background-color', colorPo);
            $stopienPoCell.css('background-color', colorPo);
            
            // Oblicz % redukcji
            const hrnPrzed = parseFloat($row.find('.calc-hrn-przed').text()) || 0;
            if (hrnPrzed > 0) {
                const redukcja = ((hrnPrzed - hrnPo) / hrnPrzed) * 100;
                const redukcjaRounded = Math.round(redukcja); // Zaokrąglij do liczby całkowitej

                const $redukcjaCell = $row.find('.calc-redukcja').parent();
                const $redukcjaSpan = $row.find('.calc-redukcja');

                // Ustaw wartość bez miejsc po przecinku
                $redukcjaSpan.text(redukcjaRounded + '%');

                // Usuń poprzednie style i tooltips
                $redukcjaCell.removeClass('risk-increased risk-decreased');
                $redukcjaCell.find('.risk-tooltip').remove();

                if (redukcjaRounded < 0) {
                    // Ryzyko wzrosło - czerwone tło i tooltip
                    $redukcjaCell.addClass('risk-increased');

                    // Dodaj tooltip z ostrzeżeniem
                    const tooltipHtml = `
                        <div class="risk-tooltip tooltip-simple">
                            <div class="tooltip-content" style="display: block; opacity: 1; visibility: visible;">
                                ⚠️ Uwaga! Ryzyko zostało podwyższone zamiast obniżone.
                                Proszę sprawdzić, czy wartości parametrów przed korektą i po korekcie zostały wpisane poprawnie.
                                <button class="tooltip-close" style="position: absolute; top: 5px; right: 5px; background: transparent; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; width: 20px; height: 20px;">&times;</button>
                            </div>
                        </div>
                    `;
                    $redukcjaCell.append(tooltipHtml);

                    // Obsługa zamykania tooltipa
                    $redukcjaCell.find('.tooltip-close').on('click', function() {
                        $(this).closest('.risk-tooltip').remove();
                    });
                } else {
                    // Ryzyko spadło - zielone tło
                    $redukcjaCell.addClass('risk-decreased');
                }
            }
        } else {
            $row.find('.calc-hrn-po').text('-');
            $row.find('.calc-stopien-po').text('-');
            $row.find('.calc-redukcja').text('-');

            // Usuń kolory tła z komórek
            $row.find('.calc-hrn-po').parent().css('background-color', '');
            $row.find('.calc-stopien-po').parent().css('background-color', '');

            // Usuń style i tooltips
            const $redukcjaCell = $row.find('.calc-redukcja').parent();
            $redukcjaCell.removeClass('risk-increased risk-decreased');
            $redukcjaCell.find('.risk-tooltip').remove();
        }
    }
    
    // Określenie poziomu ryzyka na podstawie HRN
    function getRiskLevel(hrn) {
        if (typeof ocenaRyzykaData === 'undefined' || !ocenaRyzykaData.riskLevels) {
            return 'Nieznane';
        }

        for (let i = 0; i < ocenaRyzykaData.riskLevels.length; i++) {
            const level = ocenaRyzykaData.riskLevels[i];
            if (hrn >= level.min && hrn <= level.max) {
                return level.nazwa;
            }
        }

        return 'Nieznane';
    }

    // Określenie koloru tła na podstawie HRN
    function getRiskColor(hrn) {
        // Wariant ze szczegółowymi kolorami (zakomentowany - może się przydać w przyszłości):
        // if (hrn <= 1) return '#90EE90'; // zielony - Ryzyko pomijalne
        // else if (hrn <= 5) return '#C8E6C9'; // jasnozielony - Ryzyko bardzo niskie
        // else if (hrn <= 10) return '#FFEB3B'; // żółty - Ryzyko niskie
        // else if (hrn <= 50) return '#FFA726'; // pomarańczowy - Ryzyko znaczące
        // else if (hrn <= 100) return '#FF6F00'; // ciemnopomarańczowy - Ryzyko wysokie
        // else if (hrn <= 500) return '#FF5722'; // czerwonopomarańczowy - Ryzyko bardzo wysokie
        // else if (hrn <= 1000) return '#F44336'; // czerwony - Ryzyko ekstremalne
        // else return '#C62828'; // ciemnoczerwony - Ryzyko nieakceptowalne

        // Wariant zgodny z tabelą - pogrupowane kolory:
        if (hrn <= 5) {
            return '#90EE90'; // zielony - Ryzyko pomijalne i bardzo niskie
        } else if (hrn <= 10) {
            return '#FFEB3B'; // żółty - Ryzyko niskie
        } else if (hrn <= 500) {
            return '#FFA726'; // pomarańczowy - Ryzyko znaczące, wysokie i bardzo wysokie
        } else {
            return '#F44336'; // czerwony - Ryzyko ekstremalne i nieakceptowalne
        }
    }
    
    // Obsługa uploadu obrazu
    function handleImageUpload(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const $preview = $(input).siblings('.preview-image');
                $preview.attr('src', e.target.result).show();
                $(input).siblings('.btn-upload').text('✓');
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // Usuwanie wiersza
    function deleteRow($row) {
        if (confirm('Czy na pewno chcesz usunąć ten wiersz?')) {
            $row.remove();
            renumberRows();
        }
    }
    
    // Przenumerowanie wierszy (Lp)
    function renumberRows() {
        let counter = 1;
        $('#table-body tr:not(.selection-row)').each(function() {
            $(this).find('.cell-lp .lp-number').text(counter);  // ✅ Tylko numer!
            counter++;
        });
    }
    
    // Eksportuj funkcje do użycia w innych skryptach (autosave)
    window.ocenaRyzykaRowCounter = rowCounter;
    window.ocenaRyzykaGenerateDataRow = generateDataRow;
    window.ocenaRyzykaAttachRowEvents = attachRowEvents;
    window.ocenaRyzykaCalculateRisk = calculateRisk;
    window.ocenaRyzykaAddSelectionRow = addSelectionRow;
    
})(jQuery);