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

    // Lista części systemu (przechowywana w localStorage)
    let czesciSystemuList = [];

    // Inicjalizacja listy części systemu
    function initCzesciSystemuList() {
        const saved = localStorage.getItem('ocena_ryzyka_czesci_systemu');
        if (saved) {
            try {
                czesciSystemuList = JSON.parse(saved);
            } catch (e) {
                czesciSystemuList = [];
            }
        }
    }

    // Zapisz listę części systemu do localStorage
    function saveCzesciSystemuList() {
        localStorage.setItem('ocena_ryzyka_czesci_systemu', JSON.stringify(czesciSystemuList));
    }

    // Dodaj część systemu do listy
    function addCzescSystemu(czesc) {
        if (czesc && czesc.trim() !== '' && !czesciSystemuList.includes(czesc.trim())) {
            czesciSystemuList.push(czesc.trim());
            saveCzesciSystemuList();
            updateAllCzesciSystemuSelects();
        }
    }

    // Usuń część systemu z listy
    function removeCzescSystemu(czesc) {
        const index = czesciSystemuList.indexOf(czesc);
        if (index > -1) {
            czesciSystemuList.splice(index, 1);
            saveCzesciSystemuList();
            updateAllCzesciSystemuSelects();
        }
    }

    // Generuj opcje dla selecta części systemu
    function generateCzesciSystemuOptions() {
        let options = '<option value="">-- Wybierz z listy --</option>';
        czesciSystemuList.forEach(function(czesc) {
            options += `<option value="${czesc}">${czesc}</option>`;
        });
        return options;
    }

    // Aktualizuj wszystkie selecty części systemu
    function updateAllCzesciSystemuSelects() {
        const options = generateCzesciSystemuOptions();
        $('[data-field="czesc_systemu_select"]').each(function() {
            const currentValue = $(this).val();
            $(this).html(options);
            if (currentValue && czesciSystemuList.includes(currentValue)) {
                $(this).val(currentValue);
            }
        });
    }
    
    $(document).ready(function() {
        console.log('Ocena Ryzyka - inicjalizacja');

        // Inicjalizacja listy części systemu
        initCzesciSystemuList();

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

        // Posortuj wiersze z animacją
        animateRowToPosition($newRow);
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
                <td class="cell-editable cell-czesc-systemu">
                    <div style="display: flex; gap: 5px; align-items: center; margin-bottom: 5px;">
                        <select class="cell-input czesc-systemu-select" data-field="czesc_systemu_select" style="flex: 1;">
                            ${generateCzesciSystemuOptions()}
                        </select>
                        <button type="button" class="btn-manage-czesci" title="Zarządzaj listą części">⚙️</button>
                    </div>
                    <input type="text" class="cell-input czesc-systemu-input" data-field="czesc_systemu_input" placeholder="Lub wpisz nową część systemu" />
                    <input type="hidden" data-field="czesc_systemu" />
                </td>
                
                <!-- 3. Obraz -->
                <td class="cell-image cell-obraz-czesci">
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

        // Obsługa wyboru części systemu z listy
        $row.find('[data-field="czesc_systemu_select"]').on('change', function() {
            const selectedValue = $(this).val();
            if (selectedValue) {
                $row.find('[data-field="czesc_systemu"]').val(selectedValue);
                $row.find('[data-field="czesc_systemu_input"]').val('');
                // Animuj przesunięcie wiersza do właściwej grupy
                animateRowToPosition($row);
            }
        });

        // Obsługa wpisywania nowej części systemu
        $row.find('[data-field="czesc_systemu_input"]').on('blur', function() {
            const inputValue = $(this).val().trim();
            if (inputValue) {
                // Dodaj do listy
                addCzescSystemu(inputValue);
                // Ustaw jako aktualną wartość
                $row.find('[data-field="czesc_systemu"]').val(inputValue);
                $row.find('[data-field="czesc_systemu_select"]').val(inputValue);
                // Wyczyść pole input
                $(this).val('');
                // Animuj przesunięcie wiersza do właściwej grupy
                animateRowToPosition($row);
            }
        });

        // Obsługa klawisza Enter dla nowej części systemu
        $row.find('[data-field="czesc_systemu_input"]').on('keypress', function(e) {
            if (e.which === 13 || e.keyCode === 13) {
                e.preventDefault();
                const inputValue = $(this).val().trim();
                if (inputValue) {
                    // Dodaj do listy
                    addCzescSystemu(inputValue);
                    // Ustaw jako aktualną wartość
                    $row.find('[data-field="czesc_systemu"]').val(inputValue);
                    $row.find('[data-field="czesc_systemu_select"]').val(inputValue);
                    // Wyczyść pole input
                    $(this).val('');
                    // Animuj przesunięcie wiersza do właściwej grupy
                    animateRowToPosition($row);
                }
            }
        });

        // Obsługa przycisku zarządzania listą części
        $row.find('.btn-manage-czesci').on('click', function() {
            showCzesciSystemuManager();
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
    
    // Sortowanie wierszy według rodzaju zagrożenia i części systemu
    function sortRowsByRodzajAndCzesc() {
        const $tbody = $('#table-body');
        const $rows = $tbody.find('tr:not(.selection-row)').get();

        $rows.sort(function(a, b) {
            const $a = $(a);
            const $b = $(b);

            // 1. Sortuj według rodzaju zagrożenia
            const rodzajA = $a.attr('data-rodzaj') || '';
            const rodzajB = $b.attr('data-rodzaj') || '';

            const indexA = rodzajOrder.indexOf(rodzajA);
            const indexB = rodzajOrder.indexOf(rodzajB);

            const orderA = indexA !== -1 ? indexA : 999;
            const orderB = indexB !== -1 ? indexB : 999;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // 2. Sortuj według części systemu (alfabetycznie, puste na końcu)
            const czescA = ($a.find('[data-field="czesc_systemu"]').val() || '').toLowerCase();
            const czescB = ($b.find('[data-field="czesc_systemu"]').val() || '').toLowerCase();

            // Puste części systemu na końcu grupy rodzaju
            if (czescA === '' && czescB !== '') {
                return 1; // A na końcu
            }
            if (czescA !== '' && czescB === '') {
                return -1; // B na końcu
            }

            if (czescA !== czescB) {
                return czescA.localeCompare(czescB);
            }

            // 3. Sortuj według Lp (jako fallback)
            const lpA = parseInt($a.find('.cell-lp .lp-number').text()) || 0;
            const lpB = parseInt($b.find('.cell-lp .lp-number').text()) || 0;

            return lpA - lpB;
        });

        // Przepisz wiersze w nowej kolejności
        $.each($rows, function(index, row) {
            $tbody.append(row);
        });

        // Przenumeruj wiersze po sortowaniu
        renumberRows();

        // Zastosuj grupowanie i scalanie komórek
        applyRowGrouping();
    }

    // Kompatybilność wsteczna - alias dla starej funkcji
    function sortRowsByRodzaj() {
        sortRowsByRodzajAndCzesc();
    }

    // Zastosuj grupowanie i scalanie komórek dla części systemu i obrazu
    function applyRowGrouping() {
        const $tbody = $('#table-body');
        const $rows = $tbody.find('tr:not(.selection-row)');

        // Najpierw wyczyść wszystkie atrybuty merge i rowspan
        $rows.each(function() {
            const $row = $(this);
            $row.removeAttr('data-merge-group data-merge-position');
            $row.find('.cell-czesc-systemu')
                .removeClass('merged-hidden')
                .removeAttr('rowspan');
            $row.find('.cell-obraz-czesci')
                .removeClass('merged-hidden')
                .removeAttr('rowspan');
        });

        // Grupuj wiersze według rodzaj + część systemu
        const groups = {};

        $rows.each(function() {
            const $row = $(this);
            const rodzaj = $row.attr('data-rodzaj') || '';
            const czesc = $row.find('[data-field="czesc_systemu"]').val() || '';

            // Pomijaj wiersze bez części systemu
            if (!czesc || czesc.trim() === '') {
                return;
            }

            const groupKey = rodzaj + '___' + czesc;

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }

            groups[groupKey].push($row);
        });

        // Dla każdej grupy zastosuj rowspan
        Object.keys(groups).forEach(function(groupKey) {
            const groupRows = groups[groupKey];

            if (groupRows.length > 1) {
                // Pierwsz wiersz w grupie
                const $firstRow = groupRows[0];
                const rowspan = groupRows.length;

                $firstRow.attr('data-merge-group', groupKey);
                $firstRow.attr('data-merge-position', 'first');
                $firstRow.find('.cell-czesc-systemu').attr('rowspan', rowspan);
                $firstRow.find('.cell-obraz-czesci').attr('rowspan', rowspan);

                // Pozostałe wiersze w grupie - ukryj komórki
                for (let i = 1; i < groupRows.length; i++) {
                    const $row = groupRows[i];
                    $row.attr('data-merge-group', groupKey);
                    $row.attr('data-merge-position', i === groupRows.length - 1 ? 'last' : 'middle');
                    $row.find('.cell-czesc-systemu').addClass('merged-hidden');
                    $row.find('.cell-obraz-czesci').addClass('merged-hidden');
                }
            } else {
                // Pojedynczy wiersz - usuń atrybuty merge
                groupRows[0].removeAttr('data-merge-group data-merge-position');
            }
        });
    }

    // Animowane przesunięcie wiersza do właściwej pozycji
    function animateRowToPosition($row) {
        // Zapisz obecną pozycję wiersza
        const startOffset = $row.offset().top;
        const startPosition = $row.index();

        // Wykonaj sortowanie (bez animacji)
        sortRowsByRodzajAndCzesc();

        // Pobierz nową pozycję
        const endOffset = $row.offset().top;
        const endPosition = $row.index();

        // Jeśli wiersz się nie przesunął, tylko highlight i scroll
        if (startPosition === endPosition) {
            $row.addClass('row-just-moved');
            $row[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(function() {
                $row.removeClass('row-just-moved');
            }, 2000);
            return;
        }

        // Oblicz różnicę
        const delta = startOffset - endOffset;

        // Zastosuj transform aby wrócić do początkowej pozycji wizualnej
        $row.css({
            transform: `translateY(${delta}px)`,
            transition: 'none'
        });

        // Dodaj klasę animacji
        $row.addClass('row-animating');

        // Wymuszenie reflow
        $row[0].offsetHeight;

        // Animuj do pozycji docelowej
        $row.css({
            transform: 'translateY(0)',
            transition: 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)'
        });

        // Po animacji - wyczyść style i dodaj highlight
        setTimeout(function() {
            $row.removeClass('row-animating');
            $row.css({
                transform: '',
                transition: ''
            });

            // Dodaj highlight
            $row.addClass('row-just-moved');

            // Scroll do wiersza
            $row[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Usuń highlight po 2 sekundach
            setTimeout(function() {
                $row.removeClass('row-just-moved');
            }, 2000);
        }, 800);
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

                // Synchronizuj obraz w grupie
                const $row = $(input).closest('tr');
                const field = $(input).siblings('.btn-upload').attr('data-field');

                if (field === 'obraz') {
                    syncImageInGroup($row, e.target.result);
                }
            };

            reader.readAsDataURL(input.files[0]);
        }
    }

    // Synchronizuj obraz części systemu w całej grupie
    function syncImageInGroup($row, imageData) {
        const rodzaj = $row.attr('data-rodzaj') || '';
        const czesc = $row.find('[data-field="czesc_systemu"]').val() || '';

        if (!czesc || czesc.trim() === '') {
            return;
        }

        const groupKey = rodzaj + '___' + czesc;

        // Znajdź wszystkie wiersze w tej samej grupie
        $('#table-body tr:not(.selection-row)').each(function() {
            const $otherRow = $(this);
            const otherRodzaj = $otherRow.attr('data-rodzaj') || '';
            const otherCzesc = $otherRow.find('[data-field="czesc_systemu"]').val() || '';
            const otherGroupKey = otherRodzaj + '___' + otherCzesc;

            if (groupKey === otherGroupKey) {
                // Aktualizuj obraz we wszystkich wierszach grupy
                // (ale będzie widoczny tylko w pierwszym dzięki rowspan)
                $otherRow.find('[data-field="obraz"]')
                    .siblings('.preview-image')
                    .attr('src', imageData)
                    .show();
                $otherRow.find('[data-field="obraz"]')
                    .siblings('.btn-upload')
                    .text('✓');
            }
        });
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

    // Pokaż modal zarządzania listą części systemu
    function showCzesciSystemuManager() {
        // Usuń poprzedni modal jeśli istnieje
        $('#czesci-systemu-modal').remove();

        // Utwórz HTML modalu
        let modalHtml = `
            <div id="czesci-systemu-modal" class="modal-overlay">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>Zarządzaj listą części systemu</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 15px; color: #666;">Kliknij przycisk <strong>×</strong> aby usunąć część z listy.</p>
                        <div id="czesci-list" class="czesci-list">
                            ${generateCzesciList()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Dodaj modal do body
        $('body').append(modalHtml);

        // Obsługa zamykania modalu
        $('#czesci-systemu-modal .modal-close, #czesci-systemu-modal .modal-overlay').on('click', function(e) {
            if (e.target === this) {
                $('#czesci-systemu-modal').remove();
            }
        });

        // Obsługa usuwania części
        $('#czesci-systemu-modal').on('click', '.btn-remove-czesc', function() {
            const czesc = $(this).data('czesc');
            if (confirm(`Czy na pewno chcesz usunąć "${czesc}" z listy?`)) {
                removeCzescSystemu(czesc);
                // Odśwież listę w modalu
                $('#czesci-list').html(generateCzesciList());
            }
        });
    }

    // Generuj HTML listy części do modalu
    function generateCzesciList() {
        if (czesciSystemuList.length === 0) {
            return '<p style="color: #999; text-align: center; padding: 20px;">Lista jest pusta. Dodaj części wpisując je w formularzu.</p>';
        }

        let html = '<div class="czesci-items">';
        czesciSystemuList.forEach(function(czesc) {
            html += `
                <div class="czesc-item">
                    <span class="czesc-name">${czesc}</span>
                    <button type="button" class="btn-remove-czesc" data-czesc="${czesc}" title="Usuń">×</button>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Eksportuj funkcje do użycia w innych skryptach (autosave, project)
    window.ocenaRyzykaRowCounter = rowCounter;
    window.ocenaRyzykaGenerateDataRow = generateDataRow;
    window.ocenaRyzykaAttachRowEvents = attachRowEvents;
    window.ocenaRyzykaCalculateRisk = calculateRisk;
    window.ocenaRyzykaAddSelectionRow = addSelectionRow;
    window.addCzescSystemuToList = addCzescSystemu;
    window.ocenaRyzykaApplyRowGrouping = applyRowGrouping;

})(jQuery);