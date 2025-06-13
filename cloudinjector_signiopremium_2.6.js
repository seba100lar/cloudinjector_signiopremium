(function () {
	let mpkData = {};
	let mpkDatesData = {};

	// Zamień ten URL na link eksportu CSV z twojego Google Sheet
	const csvUrl =
		'https://docs.google.com/spreadsheets/d/1FoZq4BVFeRGOQAD6Pky93b9zECznoOwzJoirgbnp41U/export?format=csv';

	// URL do pliku z datami instalacji
	const csvDatesUrl =
		'https://docs.google.com/spreadsheets/d/1wMdsdcUO-SwtozxG0jnsPYLMM543PUNR/export?format=csv';

	// Funkcja do pobrania i sparsowania CSV
	function fetchCSVData() {
		fetch(csvUrl)
			.then((response) => response.text())
			.then((text) => {
				const rows = text.trim().split('\n');
				for (let i = 1; i < rows.length; i++) {
					const [mpk, city, address] = rows[i].split(',').map((s) => s.trim());
					if (mpk) {
						mpkData[mpk.toUpperCase()] = { city, address };
					}
				}
				console.log('[injector] MPK data loaded ✅', mpkData);
			})
			.catch((err) => {
				console.error('[injector] Failed to fetch MPK CSV data ❌', err);
			});
	}

	// Funkcja do pobrania i sparsowania CSV z datami instalacji
	function fetchCSVDatesData() {
		// Funkcja do konwersji daty z formatu M/D/R na d.m.r
		function convertDateFormat(dateString) {
			console.log('🔍 [convertDateFormat] INPUT:', dateString);

			if (!dateString || dateString.trim() === '') {
				console.log('❌ [convertDateFormat] Empty date string');
				return '';
			}

			try {
				const trimmed = dateString.trim();
				console.log('🔍 [convertDateFormat] TRIMMED:', trimmed);

				// Sprawdź czy data jest już w poprawnym formacie (d.m.r)
				if (trimmed.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
					console.log('✅ [convertDateFormat] Already in correct format');
					return trimmed;
				}

				// Konwersja z M/D/R na d.m.r
				const parts = trimmed.split('/');
				console.log('🔍 [convertDateFormat] PARTS:', parts);

				if (parts.length === 3) {
					const month = parts[0].padStart(2, '0');
					const day = parts[1].padStart(2, '0');
					const year = parts[2];
					const converted = `${day}.${month}.${year}`;
					console.log(
						'🔄 [convertDateFormat] CONVERTING:',
						`${parts[0]}/${parts[1]}/${parts[2]} -> ${converted}`
					);
					return converted;
				}

				console.log('❌ [convertDateFormat] Could not split properly');
				return trimmed;
			} catch (error) {
				console.error('❌ [convertDateFormat] ERROR:', error);
				return dateString;
			}
		}

		console.log('🚀 [fetchCSVDatesData] Starting to fetch CSV dates');

		fetch(csvDatesUrl)
			.then((response) => response.text())
			.then((text) => {
				console.log(
					'📄 [fetchCSVDatesData] Raw CSV received, length:',
					text.length
				);

				const rows = text.trim().split('\n');
				console.log('📊 [fetchCSVDatesData] Number of rows:', rows.length);

				// Pokaż pierwsze kilka wierszy dla debugowania
				console.log('📋 [fetchCSVDatesData] First 3 rows:');
				for (let j = 0; j < Math.min(3, rows.length); j++) {
					console.log(`   Row ${j}:`, rows[j]);
				}

				for (let i = 1; i < rows.length; i++) {
					const columns = rows[i].split(',').map((s) => s.trim());
					const mpk = columns[0]; // Kolumna A - MPK
					const installDate = columns[2]; // Kolumna C - Data instalacji

					console.log(
						`🏷️ [fetchCSVDatesData] Row ${i}: MPK="${mpk}", Date="${installDate}"`
					);

					if (mpk && installDate) {
						console.log('🔄 [fetchCSVDatesData] Converting date for MPK:', mpk);
						const convertedDate = convertDateFormat(installDate);
						console.log(
							'💾 [fetchCSVDatesData] Storing:',
							`${mpk.toUpperCase()} -> ${convertedDate}`
						);
						mpkDatesData[mpk.toUpperCase()] = convertedDate;
					} else {
						console.log('⏭️ [fetchCSVDatesData] Skipping row - missing data');
					}
				}
				console.log('✅ [fetchCSVDatesData] Final mpkDatesData:', mpkDatesData);
			})
			.catch((err) => {
				console.error('❌ [fetchCSVDatesData] Failed to fetch:', err);
			});
	}

	// Uruchom od razu po załadowaniu skryptu
	fetchCSVData();
	fetchCSVDatesData();

	// Expose copy/paste API
	window.injector = {
		_copy: null,
		_set: null,
		_check: null,

		// Copy form values into memory
		c() {
			const baseTags = Array.from(
				document.querySelectorAll('.select2-selection__choice')
			)
				.map((e) => e.textContent.trim())
				.map((e) => e.substring(1))
				.filter((e) => !e.startsWith('format:')) // remove all format tags
				.filter((e) => !e.startsWith('rmn_ekran:')); // remove all rmn tags

			this._copy = null;
			this._copy = {
				tags: [...baseTags],
				monitored:
					document.querySelector('#tpl_te_monitored')?.checked || false,
				city: document.querySelector('#tpl_te_city')?.value || '',
				address: document.querySelector('#tpl_te_address')?.value || '',
				date:
					document.querySelector('.tpl_te_cc[data-cc_id="21"]')?.value || '',
			};
		},

		// Paste memory back into the form
		s() {
			if (!this._copy) {
				alert('Najpierw kliknij przycisk Copy! 📋');
				return;
			}
			// Idk somwhere format tags are added and needs to be removed again
			// TODO: Find where format tag is added and change there, maybe
			this._copy.tags = this._copy.tags
				.filter((e) => !e.startsWith('format:')) // remove all format tags
				.filter((e) => !e.startsWith('rmn_ekran:')) // remove all rmn tags
				.filter((e) => !e.startsWith('1CP'))
				.filter((e) => !e.startsWith('2CP'));

			this._set = null;
			this._set = {
				name: '',
				monitored: false,
				tags: [],
				city: '',
				address: '',
				mpk: '',
				zone: '',
				typ: '',
				producent: '',
				rozmiar: '',
				format: '',
				date: getTodayDate(),
			};

			// Get current name of terminal
			let fieldName = document
				.querySelector('#tpl_te_name')
				.value.toUpperCase();
			this._set.name = fieldName;

			// Assiging DOM elements to variables for readibylity
			let fieldMonitored = document.querySelector('#tpl_te_monitored');
			let fieldTags = document.getElementById('tpl_te_tags');
			let fieldCity = document.querySelector('#tpl_te_city');
			let fieldAddress = document.querySelector('#tpl_te_address');
			let fieldMpk = document.querySelector('input.tpl_te_cc[data-cc_id="11"]');
			let fieldZone = document.querySelector(
				'select.tpl_te_cc[data-cc_id="12"]'
			);
			let fieldTyp = document.querySelector(
				'select.tpl_te_cc[data-cc_id="18"]'
			);
			let fieldProducent = document.querySelector(
				'select.tpl_te_cc[data-cc_id="17"]'
			);
			let fieldRozmiar = document.querySelector(
				'select.tpl_te_cc[data-cc_id="16"]'
			);
			let fieldFormat = document.querySelector(
				'select.tpl_te_cc[data-cc_id="14"]'
			);
			let fieldDate = document.querySelector('.tpl_te_cc[data-cc_id="21"]');

			// current tags
			const currentTags = Array.from(
				document.querySelectorAll('.select2-selection__choice')
			)
				.map((e) => e.textContent.trim())
				.map((e) => e.substring(1));

			// clean tags:
			currentTags.forEach((tag) => {
				let listTag = Array.from(fieldTags.options).find(
					(opt) => opt.value == tag
				);
				if (!listTag) {
					alert(tag + 'do not exist in tags');
				} else {
					listTag.selected = false;
				}
			});

			// Trigger the change event so Select2 updates the UI
			const reloadEvent = new Event('change', { bubbles: true });
			fieldTags.dispatchEvent(reloadEvent);

			const tempTagsCheck = Array.from(
				document.querySelectorAll('.select2-selection__choice')
			)
				.map((e) => e.textContent.trim())
				.map((e) => e.substring(1));

			// Assiging values to temp store - VALUES DO NOT CHANGE FOR SPECIFIC MPK
			this._set.monitored = this._copy?.monitored ?? false;
			this._set.city = this._copy?.city?.trim() || '';
			this._set.address = this._copy?.address?.trim() || '';
			this._set.date = this._copy?.date?.trim() || '';

			// Get MPK if exists
			const matchMpk = this._set.name.match(/Z.{4}/);
			this._set.mpk = matchMpk ? matchMpk[0] : '';
			if (
				(this._set.city === '' || this._set.address === '') &&
				this._set.mpk in mpkData
			) {
				const fallback = mpkData[this._set.mpk];
				if (this._set.city === '') this._set.city = fallback.city;
				if (this._set.address === '') this._set.address = fallback.address;
			}

			// Sprawdź czy istnieje data instalacji dla tego MPK, jeśli nie ma skopiowanej daty
			if (this._set.date === '' && this._set.mpk in mpkDatesData) {
				this._set.date = mpkDatesData[this._set.mpk];
				console.log(
					`[injector] Using install date for MPK ${this._set.mpk}: ${this._set.date}`
				);
			} else if (this._set.date === '') {
				// Jeśli nie ma daty w copy ani w pliku, użyj dzisiejszej
				this._set.date = getTodayDate();
				console.log(
					`[injector] No install date found for MPK ${this._set.mpk}, using today's date: ${this._set.date}`
				);
			}

			this._set.tags = this._copy?.tags ?? [];
			// Get Zone if exists
			const matchZone = this._set.name
				.toLowerCase()
				.match(/\b(menuboard|promo|witryna)\b/i);
			this._set.zone = matchZone ? matchZone[0] : '';

			// Get fromat if exists
			const mediaplan =
				document.querySelector('#tpl_te_mediaplan b')?.textContent.trim() || '';
			if (mediaplan.includes('3x_pion')) {
				this._set.format = '3x pion';
			} else if (mediaplan.includes('2x_pion')) {
				this._set.format = '2x pion';
			} else if (mediaplan.includes('1x_pion')) {
				this._set.format = '1x pion';
			} else if (mediaplan.includes('3x_poziom')) {
				this._set.format = '3x poziom';
			} else if (mediaplan.includes('2x_poziom')) {
				this._set.format = '2x poziom';
			} else if (mediaplan.includes('1x_poziom')) {
				this._set.format = '1x poziom';
			} else if (mediaplan.includes('PROMO')) {
				this._set.fromat = '1x poziom';
				// Fallback dla promo i witryna
				if (!this._set.format) {
					if (this._set.zone === 'promo') {
						this._set.format = '1x poziom';
					} else if (this._set.zone === 'witryna') {
						this._set.format = '1x pion';
					}
				}
			} else {
				this._set.format = '';
			}

			if (this._set.zone == 'promo') {
				this._set.tags.push('rmn_ekran:promo_16x9');
			} else if (this._set.zone == 'witryna') {
				this._set.tags.push('rmn_ekran:witryna');
			} else if (this._set.zone == 'menuboard') {
				// Dodaj tag "merry" dla wszystkich ekranów menuboard
				this._set.tags.push('merry');
				//Check mediaplan and format for correct tags
				switch (this._set.format) {
					case '1x pion':
						if (mediaplan.includes('FHD')) {
							this._set.tags.push('format:1x_pion_FHD');
						} else if (mediaplan.includes('4K')) {
							this._set.tags.push('format:1x_pion_4K');
						}
						break;
					case '2x pion':
						if (mediaplan.includes('FHD') && mediaplan.includes('LEWA')) {
							this._set.tags.push('format:2x_pion_FHD_lewy');
						} else if (
							mediaplan.includes('FHD') &&
							mediaplan.includes('PRAWA')
						) {
							this._set.tags.push('format:2x_pion_FHD_prawy');
						} else if (mediaplan.includes('FHD')) {
							this._set.tags.push('format:2x_pion_FHD');
						}
						break;
					case '3x pion':
						if (mediaplan.includes('FHD') && mediaplan.includes('LEWY')) {
							this._set.tags.push('format:3x_pion_FHD_lewy');
						} else if (
							mediaplan.includes('FHD') &&
							mediaplan.includes('PRAWY')
						) {
							this._set.tags.push('format:3x_pion_FHD_prawy');
						} else if (
							mediaplan.includes('FHD') &&
							mediaplan.includes('SRODEK')
						) {
							this._set.tags.push('format:3x_pion_FHD_środek');
						} else if (mediaplan.includes('FHD')) {
							this._set.tags.push('format:3x_pion_FHD');
						}
						break;
					case '1x poziom':
						if (mediaplan.includes('FHD')) {
							this._set.tags.push('format:1x_poziom_FHD');
						} else if (mediaplan.includes('4K')) {
							this._set.tags.push('format:1x_poziom_4K');
						}
						break;
					case '2x poziom':
						if (mediaplan.includes('FHD') && mediaplan.includes('LEWA')) {
							this._set.tags.push('format:2x_poziom_FHD_lewy');
						} else if (
							mediaplan.includes('FHD') &&
							mediaplan.includes('PRAWA')
						) {
							this._set.tags.push('format:2x_poziom_FHD_prawy');
						} else if (mediaplan.includes('FHD')) {
							this._set.tags.push('format:2x_poziom_FHD');
						}
						break;
					case '3x poziom':
						if (mediaplan.includes('FHD') && mediaplan.includes('LEWA')) {
							this._set.tags.push('format:3x_poziom_FHD_lewy');
						} else if (
							mediaplan.includes('FHD') &&
							mediaplan.includes('PRAWA')
						) {
							this._set.tags.push('format:3x_poziom_FHD_prawy');
						} else if (
							mediaplan.includes('FHD') &&
							mediaplan.includes('SRODEK')
						) {
							this._set.tags.push('format:3x_poziom_FHD_środek');
						} else if (mediaplan.includes('FHD')) {
							this._set.tags.push('format:3x_poziom_FHD');
						}
						break;
				}
			} else {
				// do nothing
			}

			const inputName =
				document.querySelector('.injector-select')?.value ?? 'none';

			switch (inputName) {
				// Menuboards Pion:
				case 'QM43C':
					this._set.producent = 'Samsung';
					this._set.rozmiar = '43';
					this._set.typ = 'Samsung QM43C';
					break;
				case 'QM43B':
					this._set.producent = 'Samsung';
					this._set.rozmiar = '43';
					this._set.typ = 'Samsung QM43B';
					break;
				case 'DS-D6043UN-DP':
					this._set.producent = 'HIKVISION';
					this._set.rozmiar = '43';
					this._set.typ = 'HIKVISION DS-D6043UN-DP';
					break;
				case 'DS-D6043UN-B':
					this._set.producent = 'HIKVISION';
					this._set.rozmiar = '43';
					this._set.typ = 'HIKVISION DS-D6043UN-B';
					break;
				case 'QM50C':
					this._set.producent = 'Samsung';
					this._set.rozmiar = '50';
					this._set.typ = 'Samsung QM50C';
					break;
				case 'DS-D6050UN-DP':
					this._set.producent = 'HIKVISION';
					this._set.rozmiar = '50';
					this._set.typ = 'HIKVISION DS-D6050UN-DP';
					break;
				case 'QM32C':
					this._set.producent = 'Samsung';
					this._set.rozmiar = '32';
					this._set.typ = 'Samsung QM32C';
					break;
				case 'OM55N-Single':
					this._set.producent = 'Samsung';
					this._set.rozmiar = '55';
					this._set.typ = 'Samsung OM55N-Single';
					break;
				case 'CLEAN':
					// Clean all data
					this._set.producent = '';
					this._set.rozmiar = '';
					// this._set.typ = '';
					this._set.city = '';
					this._set.address = '';
					this._set.tags = [];
					this._set.mpk = '';
					this._set.zone = '';
					this._set.format = '';
					break;
				default:
					alert('Select Device you fool!\n');
			}

			// Assiging values to html
			fieldMonitored.checked = this._set.monitored;
			fieldCity.value = this._set.city;
			fieldAddress.value = this._set.address;
			fieldMpk.value = this._set.mpk;
			fieldDate.value = this._set.date;

			fieldProducent.value = this._set.producent;
			fieldRozmiar.value = this._set.rozmiar;
			fieldTyp.value = this._set.typ;
			fieldFormat.value = this._set.format;
			fieldZone.value = this._set.zone;

			// tags:
			this._set.tags.forEach((tag) => {
				let listTag = Array.from(fieldTags.options).find(
					(opt) => opt.value == tag
				);
				if (!listTag) {
					alert(tag + 'do not exist in tags');
				} else {
					listTag.selected = true;
				}
			});

			// Trigger the change event so Select2 updates the UI
			fieldTags.dispatchEvent(reloadEvent);
		},
		// Check if data is correct
		// Check if data is correct
		check() {
			this._check = null;
			this._check = {
				name: '',
				monitored: false,
				tags: [],
				city: '',
				address: '',
				mpk: '',
				zone: '',
				typ: '',
				producent: '',
				rozmiar: '',
				format: '',
				date: '',
				// Additional fields
				mediaplan: '',
				tests: [],
			};

			// Get current name of terminal
			let fieldName = document
				.querySelector('#tpl_te_name')
				.value.toUpperCase();
			this._check.name = fieldName;

			// Assigning DOM elements to variables for readability
			let fieldMonitored = document.querySelector('#tpl_te_monitored');
			let fieldTags = document.getElementById('tpl_te_tags');
			let fieldCity = document.querySelector('#tpl_te_city');
			let fieldAddress = document.querySelector('#tpl_te_address');
			let fieldMpk = document.querySelector('input.tpl_te_cc[data-cc_id="11"]');
			let fieldZone = document.querySelector(
				'select.tpl_te_cc[data-cc_id="12"]'
			);
			let fieldTyp = document.querySelector(
				'select.tpl_te_cc[data-cc_id="18"]'
			);
			let fieldProducent = document.querySelector(
				'select.tpl_te_cc[data-cc_id="17"]'
			);
			let fieldRozmiar = document.querySelector(
				'select.tpl_te_cc[data-cc_id="16"]'
			);
			let fieldFormat = document.querySelector(
				'select.tpl_te_cc[data-cc_id="14"]'
			);
			let fieldDate = document.querySelector('.tpl_te_cc[data-cc_id="21"]');

			// current tags
			const currentTags = Array.from(
				document.querySelectorAll('.select2-selection__choice')
			)
				.map((e) => e.textContent.trim())
				.map((e) => e.substring(1));

			this._check.tags = currentTags;

			// Assigning values to temp store
			this._check.monitored = fieldMonitored.checked ?? false;
			this._check.city = fieldCity.value ?? '';
			this._check.address = fieldAddress.value ?? '';
			this._check.mpk = fieldMpk.value ?? '';
			this._check.zone = fieldZone.value ?? '';
			this._check.typ = fieldTyp.value ?? '';
			this._check.producent = fieldProducent.value ?? '';
			this._check.rozmiar = fieldRozmiar.value ?? '';
			this._check.format = fieldFormat.value ?? '';
			this._check.date = fieldDate.value ?? '';

			// Check fields for empty strings
			if (this._check.name == '') this._check.tests.push('Empty name');
			if (this._check.city == '') this._check.tests.push('Empty city');
			if (this._check.address == '') this._check.tests.push('Empty address');
			if (this._check.mpk == '') this._check.tests.push('Empty mpk');
			if (this._check.zone == '') this._check.tests.push('Empty zone');
			if (this._check.typ == '') this._check.tests.push('Empty typ');
			if (this._check.producent == '')
				this._check.tests.push('Empty producent');
			if (this._check.rozmiar == '') this._check.tests.push('Empty rozmiar');
			if (this._check.format == '') this._check.tests.push('Empty format');
			if (this._check.date == '') this._check.tests.push('Empty date');

			// Check date format (should be d.m.r)
			const dateFormatRegex = /^\d{1,2}\.\d{1,2}\.\d{4}$/;
			if (this._check.date && !dateFormatRegex.test(this._check.date)) {
				this._check.tests.push(
					'Date format should be d.m.r (e.g., 15.03.2024)'
				);
			}

			// Check if date matches the one from CSV for this MPK
			if (this._check.mpk && mpkDatesData[this._check.mpk.toUpperCase()]) {
				const csvDate = mpkDatesData[this._check.mpk.toUpperCase()];
				if (this._check.date !== csvDate) {
					this._check.tests.push(
						`Date mismatch: Form has "${this._check.date}" but CSV has "${csvDate}" for MPK ${this._check.mpk}`
					);
					console.log(`🔍 [check] Date comparison for MPK ${this._check.mpk}:`);
					console.log(`   Form date: "${this._check.date}"`);
					console.log(`   CSV date: "${csvDate}"`);
					console.log(`   Match: ${this._check.date === csvDate}`);
				}
			} else if (this._check.mpk) {
				// MPK exists but no date in CSV
				console.log(`⚠️ [check] No CSV date found for MPK: ${this._check.mpk}`);
				console.log(`Available MPK dates:`, Object.keys(mpkDatesData));
			}

			// Check name for correctness with mpk, zone
			this._check.name.includes(this._check.mpk.toUpperCase())
				? ''
				: this._check.tests.push('MPK not in name');
			this._check.name.includes(this._check.zone.toUpperCase())
				? ''
				: this._check.tests.push('ZONE not in name');

			// Check tags for correctness with zone, format
			// menuboard
			if (this._check.zone == 'menuboard') {
				// Check for format tags
				if (
					!this._check.tags.some((tag) =>
						tag.includes(this._check.format.replace(' ', '_'))
					)
				)
					this._check.tests.push('Format not in tags');
					// Check for merry tag
				if (!this._check.tags.includes('merry'))
					this._check.tests.push('Merry tag not in tags');
			}
			// promo
			if (this._check.zone == 'promo') {
				// Check for promo tag
				if (!this._check.tags.some((tag) => tag.includes('rmn_ekran:promo')))
					this._check.tests.push('RMN promo tag not in tags');
			}
			// witryna
			if (this._check.zone == 'witryna') {
				// Check for witryna tag
				if (!this._check.tags.some((tag) => tag.includes('rmn_ekran:witryna')))
					this._check.tests.push('RMN witryna tag not in tags');
			}

			// Check typ for correctness with producent and rozmiar
			this._check.typ.includes(this._check.producent)
				? ''
				: this._check.tests.push('Typ and producent do not match');
			this._check.typ.includes(this._check.rozmiar)
				? ''
				: this._check.tests.push('Typ and rozmiar do not match');

			// Alert user if errors exist
			if (this._check.tests.length > 0) {
				alert('Validation errors found:\n\n' + this._check.tests.join('\n'));
			} else {
				alert('✅ All checks passed! Data looks correct.');
			}
		},
	};

	// Inject "Copy"/"Set" buttons when a popup opens
	function insertButtonsIfNeeded() {
		const container = document.querySelector('.popup_content');
		if (!container) return;

		// Check also if correct popup
		const tabLabels = Array.from(container?.querySelectorAll('h2 a') || []).map(
			(a) => a.textContent.trim()
		);

		if (
			!container ||
			!['Edycja', 'Konfiguracja', 'RMN'].every((label) =>
				tabLabels.includes(label)
			)
		) {
			return;
		}

		// If we already injected, there'll be a button with .injector-btn
		if (container.querySelector('.injector-btn')) return;

		const tabHeader = container.querySelector('h2');
		if (!tabHeader) return;

		// Create Copy button
		const copyBtn = document.createElement('a');
		copyBtn.textContent = 'Copy';
		copyBtn.classList.add('injector-btn', 'injector-copy-btn');
		copyBtn.style.cursor = 'pointer';
		copyBtn.style.marginLeft = '15px';
		copyBtn.title =
			'Copies values of monitored, mpk, full address, tags (except "format:*", "rmn_ekran:*") and date to memory';
		copyBtn.onclick = () => window.injector.c();
		addClickEffect(copyBtn, 'Copied!✅');

		// Create Set button
		const setBtn = document.createElement('a');
		setBtn.textContent = 'Set';
		setBtn.classList.add('injector-btn', 'injector-set-btn');
		setBtn.style.cursor = 'pointer';
		setBtn.style.marginLeft = '10px';
		setBtn.title = 'Paste values from memory and selected device from list';
		setBtn.onclick = () => window.injector.s();
		addClickEffect(setBtn, 'Set! ✅');

		// Create list
		const options = [
			'SELECT DEVICE:',
			'---TIZEN',
			'QM43C',
			'QM50C',
			'QM32C',
			'OM55N-Single',
			'QM43B',
			'---HIKVISION',
			'DS-D6043UN-DP',
			'DS-D6050UN-DP',
			'DS-D6043UN-B',
			'---Utility',
			'CLEAN',
		];

		const selectList = document.createElement('select');
		selectList.title = 'Select device or CLEAN to remove all device data';
		selectList.classList.add('injector-btn', 'injector-select');
		selectList.style.cursor = 'pointer';
		selectList.style.marginLeft = '10px';
		selectList.style.maxWidth = '200px';

		options.forEach((opt) => {
			const optionEl = document.createElement('option');
			optionEl.value = opt;
			optionEl.textContent = opt;
			selectList.appendChild(optionEl);
		});

		// Create Check button
		const checkBtn = document.createElement('a');
		checkBtn.textContent = 'Check';
		checkBtn.classList.add('injector-btn', 'injector-check-btn');
		checkBtn.style.cursor = 'pointer';
		checkBtn.style.marginLeft = '10px';
		checkBtn.title = 'Checks values for possible errors';
		checkBtn.onclick = () => window.injector.check();
		addClickEffect(checkBtn, 'Check! ✅');

		// Append
		tabHeader.append(copyBtn, selectList, setBtn, checkBtn);
	}

	// Observe the DOM for any popup_content additions
	const observer = new MutationObserver(insertButtonsIfNeeded);
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	console.log(
		'%cCloudinjector_signiopremium_2.2 ready ✅: "Copy", "Set", "Check" buttons will show whenever a popup appears.',
		'font-weight: bold;'
	);

	function getTodayDate() {
		const today = new Date();
		const dd = String(today.getDate()).padStart(2, '0');
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const yyyy = today.getFullYear();

		const formattedDate = dd + '.' + mm + '.' + yyyy;
		return formattedDate;
	}

	function addClickEffect(button, successText) {
		button.addEventListener('click', () => {
			const originalText = button.textContent;
			button.textContent = successText;
			button.style.transform = 'scale(0.95)';
			button.style.transition = 'transform 0.1s, background-color 0.3s';
			button.style.backgroundColor = '#d4edda'; // light green

			setTimeout(() => {
				button.textContent = originalText;
				button.style.transform = 'scale(1)';
				button.style.backgroundColor = '';
			}, 1000);
		});
	}
})();
