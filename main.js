        class WordSearch {
            constructor(board, allWords, number=null, bonusWord=null, bonusExcerpt=null) {
                this.hints = [String] // an array of words, queued randomly from this.remainingWords
        
                this.remainingWords = new Set(allWords.map(word => word.toUpperCase()));
                this.foundWords = [];
        
                this.apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

                this.board = board.map(subArray => subArray.map(item => 
                    item !== null ? item.toUpperCase() : item));
                this.selected = [];
        
                this.allCount = allWords.length;
                this.allLetters = allWords.reduce((sum, word) => sum + word.length, 0);
        
                // this.foundOverAll = document.getElementById("number-of-words-found");
                // this.foundOverAll.innerHTML = `0/${this.allCount}`;
        
                this.bonusWord = bonusWord !== null ? bonusWord.toUpperCase() : null;
                this.bonusExcerpt = this.bonusWord ? bonusExcerpt : '';
        
                this.timer = null;
                this.running = false;
                this.seconds = 0;
                this.minutes = 0;
                this.hours = 0;
        
                this.wordEntry = null;
        
                this.number = number;
        
                this.wordBank = document.getElementById("word-bank") || null;
                this.definitions = "";
                
                this.foundOverAll = document.getElementById("number-of-words-found") || null;
                this.progress = document.querySelector('.progress-bar') || null;
        
                // initialize grid when the DOM is loaded
                document.addEventListener("DOMContentLoaded", () => {
                    this.initializeGrid();
                    this.initializeHintButton();
                    this.initializePauseButton();
                    this.initializeRotateButton();
                    this.initializePlayButton();
                    this.initializeDefineButton();
                    window.addEventListener("resize", this.handleResize.bind(this));
                });
                
                // check if the page is hidden or visible
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) {
                        if (this.running) {
                            clearInterval(this.timer);
                            this.running = false;
                            this.clearSelections();
                            document.querySelector('.card').classList.toggle('flip');
                        }
                    }
                });
        
                this.isDragging = false;
            }        

            showHints() {
                // 
            }

            initializeHintButton() {
                
            }

            checkWordAttempt() {
                const attempt = this.selected.map(([r, c]) => this.board[r][c]).join('');
                if (this.foundWords.includes(attempt)) {
                    this.showAlert("already-found");
                } else if (this.remainingWords.has(attempt) || attempt === this.bonusWord) {
                    this.updateFound(attempt, attempt === this.bonusWord);
                } else if (attempt.length >= 4) {
                    this.showAlert("not-valid");
                } else if (attempt.length > 2) {
                    this.showAlert("too-short");
                }
                this.clearSelections();
            }

            updateFound(word, bonus = false) {
                if (bonus) {
                    const wordEntry = document.createElement('div');
                    wordEntry.style.marginBottom = '1em';
        
                    wordEntry.innerHTML = `
                        <strong>★ ${word}</strong><em> bonus word of the day!</em>
                        <div class="definition ${this.definitions}" style="margin-left: 20px;">
                            &nbsp&nbsp ${this.bonusExcerpt}
                        </div>
                    `;
        
                    this.wordBank.appendChild(wordEntry);
                    this.wordBank.scrollTop = this.wordBank.scrollHeight;
                    this.bonusWord = null;
                } else {
                    this.foundWords.push(word);
                    this.remainingWords.delete(word);
            
                    if (this.wordBank) {
                        const wordBank = this.wordBank;
                                    const wordEntry = document.createElement('div');
                                    wordEntry.style.marginBottom = '1em';
                
                        // API call to fetch word information
                        fetch(this.apiUrl + word)
                            .then(response => {
                                if (!response.ok) {
                
                                    wordEntry.innerHTML = `
                                        <strong>• ${word}</strong>
                                    `;
                
                                    // append entry to the word bank
                                    wordBank.appendChild(wordEntry);
                                    wordBank.scrollTop = this.wordBank.scrollHeight;
                                    throw new Error(`Error fetching word: ${response.statusText}`);
                                }
                                return response.json();
                            })
                            .then(data => {
                                // extract word information with API
                                if (data && data[0]) {
                                    const meanings = data[0].meanings || [];
                                    const syllables = data[0].phonetics?.[0]?.text || ""; // default to word if no phonetic info
                                    const partOfSpeech = meanings[0]?.partOfSpeech || "unknown";
                                    const firstDefinition = meanings[0]?.definitions[0]?.definition || "No definition available";
                
                                    // format syllables, part of speech, and definitions
                                    wordEntry.innerHTML = `
                                        <strong>• ${word} ${syllables}</strong><em> ${partOfSpeech}</em>
                                        <div class="definition ${this.definitions}" style="margin-left: 20px;">
                                            &nbsp&nbsp ${firstDefinition}
                                        </div>
                                    `;
                
                                    wordBank.appendChild(wordEntry);
                                    wordBank.scrollTop = this.wordBank.scrollHeight;
                                } else {
                                    console.error(`Word "${word}" not found in API response.`);
                                }
                            })
                            .catch(error => console.error('Error fetching definitions:', error));
                    }
            
                    if (this.foundOverAll) {
                        this.foundOverAll.textContent = `${this.foundWords.length}/${this.allCount}`;
                    }
            
                    if (this.progress) {
                        const computedStyle = getComputedStyle(this.progress);
                        const width = parseFloat(computedStyle.getPropertyValue('--width'));
                        this.progress.style.setProperty('--width', `${width + 100/this.allLetters*word.length}`);

                        const letters = new Set(Array.from(this.remainingWords).flatMap(str => [...str]));
                        document.querySelectorAll(".tile button").forEach(button => {
                            if (!letters.has(button.textContent)) {
                                button.style.transition = 'opacity 1s ease, transform 1s ease';
                                button.classList.add('fade-out');
                                button.addEventListener('transitionend', () => {
                                    button.remove();
                                }, { once: true });
                            };
                        });
                    }
            // NOT UPDATED
                    if (this.foundWords.length === this.allCount) {
                        document.getElementById("to-do-checkmark").style.visibility = 'visible';
                        clearInterval(this.timer);
                        this.running = false;
                        this.clearSelections();
                        this.initializeShareButton();
                        setTimeout(() => {
                            document.getElementById("share-button").classList.toggle('visibility');
                            document.getElementById("lion-dance").classList.toggle('visibility');
                        }, 1000);
                    }
                }
            }

        
            initializeGrid() {
                this.updateGridSize();
                this.populateGrid();
        
                const shiftAmount = new Date().getDay();
                const dow = document.getElementById("day-of-week");
                dow.style.left = `${14.4+(shiftAmount * 4.8)}%`;
        
                const currentDate = new Date();
        
                // set the month abbreviation (e.g., "Nov")
                document.getElementById("month").textContent = currentDate.toLocaleString('en-us', { month: 'short' });
    
                document.getElementById("day-of-month").textContent = currentDate.getDate().toString().padStart(2, '0');
                
                if (this.number) {
                    document.querySelector('.back-of-card').style.backgroundImage = `
                        url('//nshsdenebola.com/wp-content/uploads/2024/11/${this.number.charAt(0)}0.png'),
                        url('//nshsdenebola.com/wp-content/uploads/2024/11/${this.number.charAt(1)}1.png'),
                        url('//nshsdenebola.com/wp-content/uploads/2024/11/${this.number.charAt(2)}2.png'),
                        url('//nshsdenebola.com/wp-content/uploads/2024/11/background.jpg')
                    `;
                }
            }
        
            initializePauseButton() {
                let pause = document.getElementById("pause-button");
                pause.addEventListener("click", () => {
                    if (this.running) {
                        clearInterval(this.timer);
                        this.running = false;
                        this.clearSelections();
                        document.querySelector('.card').classList.toggle('flip');
                    }
                });
            }
        
            initializeRotateButton() {
                let rotate = document.getElementById("rotate-button");
                let deg = 0;
                rotate.addEventListener("click", () => {
                    const grid = document.getElementById("grid");
            
                    deg = (deg + 90) % 360;
            
                    grid.style.transform = `rotate(${deg}deg)`;
            
                    const tiles = grid.querySelectorAll(".tile button");
                    tiles.forEach(tile => {
                        tile.style.transform = `rotate(${-deg}deg)`;
                    });
                });
            }
        
            initializePlayButton() {
                let play = document.getElementById("play-button");
                play.addEventListener("click", () => {
                    document.querySelector('.card').classList.toggle('flip');
                    this.startTimer();
                });
            }
        
            initializeDefineButton() {
                let define = document.getElementById("definitions-button");
                define.addEventListener("click", () => {
                        this.definitions = this.definitions.trim() === "display" ? "" : "display";
                        define.textContent = define.textContent.trim() === "⊕" ? "⊗" : "⊕";
                    const definitions = document.querySelectorAll('.definition');
                    definitions.forEach(definition => {
                        definition.classList.toggle('display');
                    });
                });
            }
        
            handleResize() {
                this.updateGridSize();
            }
        
        
            updateGridSize() {
                const cardRect = document.querySelector(".card").getBoundingClientRect();
                const gameArea = document.querySelector(".grid-area");
                const grid = document.getElementById("grid");
        
                const gameAreaWidth = cardRect.width * 0.387;
                const gameAreaHeight = cardRect.height * 0.6667;
                gameArea.style.width = `${gameAreaWidth}px`;
                gameArea.style.height = `${gameAreaHeight}px`;
        
                const gridSize = Math.min(gameAreaWidth, gameAreaHeight);
                grid.style.width = `${gridSize}px`;
                grid.style.height = `${gridSize}px`;
        
                const rows = this.board.length;
                const cols = this.board[0].length;
        
                grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
                grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
                
                const rotateButton = document.getElementById("rotate-button");
                
                const buttonSize = gridSize * 0.33;
                rotateButton.style.width = `${buttonSize}px`;
                rotateButton.style.height = `${buttonSize}px`;
            }
        
            populateGrid() {
                const grid = document.getElementById("grid");
                grid.innerHTML = "";
        
                const rows = this.board.length;
                const cols = this.board[0].length;
        
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const tile = document.createElement("div");
                        tile.className = "tile";
        
                        if (this.board[row][col] !== null) {
                            tile.appendChild(this.createTileButton(row, col));
                        }
        
                        grid.appendChild(tile);
                    }
                }
        
                this.attachDragHandlers();
            }
        
            createTileButton(row, col) {
                const button = document.createElement("button");
                button.textContent = this.board[row][col];
                button.setAttribute("data-row", row);
                button.setAttribute("data-col", col);
        
                return button;
            }
            
        attachDragHandlers() {
            const grid = document.getElementById("grid");
            const tiles = grid.querySelectorAll(".tile button");
        
            const startDrag = (tile, e) => {
                e.preventDefault();
                this.isDragging = true;
                this.clearSelections();
                this.handleTileSelection(tile);
            };
        
            const continueDrag = (tile, e) => {
                e.preventDefault();
                if (this.isDragging) {
                    this.handleTileSelection(tile);
                }
            };
        
            const endDrag = () => {
                if (this.isDragging) {
                    this.isDragging = false;
                    this.checkWordAttempt();
                }
            };
        
            tiles.forEach(tile => {
                tile.addEventListener("mousedown", (e) => startDrag(tile, e));
                tile.addEventListener("mousemove", (e) => continueDrag(tile, e));
                tile.addEventListener("mouseup", endDrag);
        
                tile.addEventListener("touchstart", (e) => startDrag(tile, e), { passive: false });
                tile.addEventListener("touchmove", (e) => {
                    const touch = e.touches[0];
                    const targetTile = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    continueDrag(targetTile, e);
                }, { passive: false });
                tile.addEventListener("touchend", endDrag);
            });
        
            document.addEventListener("mouseup", endDrag);
            document.addEventListener("touchend", endDrag, { passive: false });
        }
        
            handleTileSelection(tile) {
                const row = parseInt(tile.getAttribute("data-row"), 10);
                const col = parseInt(tile.getAttribute("data-col"), 10);
                
                const isAlreadySelected = this.selected.some(([r, c]) => r === row && c === col);
                if (!isAlreadySelected) {
                    const last = this.selected[this.selected.length - 1];
                    if (
                        !last || // first selection or
                        (Math.abs(last[0] - row) <= 1 && Math.abs(last[1] - col) <= 1) // adjacent
                    ) {
                        this.selected.push([row, col]);
                        tile.classList.add("selected");
                
                        if (!this.wordEntry) {
                            this.wordEntry = document.createElement('div');
                            this.wordEntry.className = "wordEntry";
                            this.wordEntry.style.marginBottom = '1em';
                            
                            this.wordBank.appendChild(this.wordEntry);
                        }
        
                        if (last) {
                            const prevTile = document.querySelector(`[data-row="${last[0]}"][data-col="${last[1]}"]`);
                            this.drawLine(prevTile, tile);
                        }
                    }
                    if (this.wordEntry) {
                        this.wordEntry.textContent = `• ${this.selected.map(([r, c]) => this.board[r][c]).join('')}`;
                        this.wordBank.scrollTop = this.wordBank.scrollHeight;
                    }
                }
            }
        
            drawLine(a, b) {
                const line = document.createElement("div");
                line.className = "line";
            
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                const cardRect = document.querySelector('.card').getBoundingClientRect();
                
                const x1 = rectA.left - cardRect.left + rectA.width / 2;
                const y1 = rectA.top - cardRect.top + rectA.height / 2;
                const x2 = rectB.left - cardRect.left + rectB.width / 2;
                const y2 = rectB.top - cardRect.top + rectB.height / 2;
            
                const length = Math.hypot(x2 - x1, y2 - y1);
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
            
                line.style.width = `${length}px`;
                line.style.transformOrigin = "0 50%";
                line.style.transform = `rotate(${angle}deg)`;
                line.style.left = `${x1}px`;
                line.style.top = `${y1}px`;
            
                document.querySelector(".back-of-card").appendChild(line);
            }    
        
            clearSelections() {
                this.selected = [];
                document.querySelectorAll(".tile button.selected").forEach(btn => btn.classList.remove("selected"));
                document.querySelectorAll(".line").forEach(line => line.remove());
                document.querySelectorAll(".wordEntry").forEach(wordEntry => wordEntry.remove())
                this.wordEntry = null;
            }

            showAlert(alertid) {
                const container = document.querySelector('.card');
                const child = document.getElementById(alertid);

                const containerRect = container.getBoundingClientRect();

                const maxXPercent = (child.offsetWidth / containerRect.width * .516 * 100);
                const maxYPercent = (child.offsetHeight / containerRect.height * .888 * 100);
                const xPercent = Math.random() * maxXPercent;
                const yPercent = Math.random() * maxYPercent;

                child.style.left = `${xPercent}%`;
                child.style.top = `${yPercent}%`;
                
                child.classList.toggle('visibility');

                setTimeout(() => {
                    child.classList.toggle('visibility');
                }, 2000);
            }
        
            initializeShareButton() {
                let share = document.getElementById("share-button");

                share.addEventListener("click", () => {
                    let timeString = '';
                    if (this.hours > 0) timeString += `${this.hours}h `;
                    if (this.minutes > 0) timeString += `${this.minutes}m `;
                    if (this.seconds > 0) timeString += `${this.seconds}s`;
                    
                    timeString = timeString.trim();

                    navigator.clipboard.writeText(`https://nshsdenebola.com/the-denebola-daily I solved The Denebola Daily #${this.number} in ${timeString}! 🦁⋆｡°✩`);
                    alert("Copied!");
                });
            }
        
            startTimer() {
                if (!this.running) {
                    this.timer = setInterval(() => {
                        this.seconds += 1;
        
                        if (this.seconds >= 60) {
                            this.seconds = 0;
                            this.minutes++;
                        }
        
                        if (this.minutes >= 60) {
                            this.minutes = 0;
                            this.hours++;
                        }
        
                        this.updateDisplay();
                    }, 1000);
                    this.running = true;
                }
            }
        
            updateDisplay() {
                const minutesElement = document.getElementById("minutes");
                const secondsElement = document.getElementById("seconds");
                const hoursElement = document.getElementById("hours");

                hoursElement.textContent = this.hours.toString().padStart(2, '0');
                minutesElement.textContent = ":" + this.minutes.toString().padStart(2, '0');
                secondsElement.innerHTML = ":" + this.seconds.toString().padStart(2, '0');
            }
        }
