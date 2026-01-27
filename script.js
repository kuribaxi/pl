class IPTVScanner {
    constructor() {
        this.isScanning = false;
        this.workerPool = [];
        this.totalLinks = 0;
        this.testedLinks = 0;
        this.workingLinks = [];
        this.failedLinks = 0;
        this.startTime = null;
        this.timerInterval = null;
        
        this.baseUrl = "https://lenz.splus.ir/PLTV/88888888/224";
    }
    
    generateLinks(startNum, endNum, fileTypes) {
        const links = [];
        for (let num = startNum; num <= endNum; num++) {
            for (const fileType of fileTypes) {
                links.push(`${this.baseUrl}/322122${num}/${fileType}`);
            }
        }
        return links;
    }
    
    async testLink(url) {
        // Använd CORS proxy för att undvika CORS-fel
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        
        try {
            // Först testa med HEAD för snabbhet
            const headResponse = await fetch(proxyUrl + encodeURIComponent(url), {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (headResponse.ok) {
                // Om HEAD fungerar, gör ett snabbt GET-test också
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                try {
                    const getResponse = await fetch(proxyUrl + encodeURIComponent(url), {
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    clearTimeout(timeoutId);
                    
                    if (getResponse.ok) {
                        return { url, status: 'working' };
                    }
                } catch {
                    clearTimeout(timeoutId);
                }
            }
        } catch (error) {
            // Ignorera fel och fortsätt
        }
        
        return { url, status: 'failed' };
    }
    
    async startScan(startNum, endNum, fileTypes, maxWorkers) {
        this.isScanning = true;
        this.startTime = Date.now();
        this.totalLinks = 0;
        this.testedLinks = 0;
        this.workingLinks = [];
        this.failedLinks = 0;
        
        // Generera alla länkar
        const allLinks = this.generateLinks(startNum, endNum, fileTypes);
        this.totalLinks = allLinks.length;
        
        // Uppdatera UI
        this.updateProgress();
        this.startTimer();
        
        // Skapa worker-promiser
        const workers = [];
        const results = [];
        
        // Dela upp länkar i batchar
        const batchSize = maxWorkers;
        for (let i = 0; i < allLinks.length; i += batchSize) {
            if (!this.isScanning) break;
            
            const batch = allLinks.slice(i, i + batchSize);
            const batchPromises = batch.map(link => this.testLink(link));
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    const { url, status } = result.value;
                    this.testedLinks++;
                    
                    if (status === 'working') {
                        this.workingLinks.push(url);
                        this.addLinkToList(url);
                    } else {
                        this.failedLinks++;
                    }
                    
                    this.updateProgress();
                }
            }
            
            // Liten delay mellan batchar för att inte överbelasta
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.stopScan();
        this.showCompletionMessage();
    }
    
    stopScan() {
        this.isScanning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.updateUIAfterStop();
    }
    
    updateProgress() {
        const progress = (this.testedLinks / this.totalLinks) * 100;
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.getElementById('progressText');
        const percentText = document.getElementById('percentText');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `Testar... ${this.testedLinks} av ${this.totalLinks}`;
        }
        if (percentText) {
            percentText.textContent = `${progress.toFixed(1)}%`;
        }
        
        // Uppdatera statistik
        document.getElementById('testedCount').textContent = this.testedLinks;
        document.getElementById('workingCount').textContent = this.workingLinks.length;
        document.getElementById('failedCount').textContent = this.failedLinks;
        document.getElementById('resultCount').textContent = this.workingLinks.length;
    }
    
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.startTime) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                document.getElementById('timeElapsed').textContent = `${elapsed}s`;
            }
        }, 1000);
    }
    
    addLinkToList(url) {
        const resultsDiv = document.getElementById('results');
        const linkItem = document.createElement('a');
        linkItem.href = url;
        linkItem.target = "_blank";
        linkItem.className = "list-group-item list-group-item-action link-item d-flex justify-content-between align-items-center";
        
        const linkText = document.createElement('span');
        linkText.className = "text-truncate me-2";
        linkText.textContent = url;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = "btn btn-sm btn-outline-success copy-btn";
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(url).then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        };
        
        linkItem.appendChild(linkText);
        linkItem.appendChild(copyBtn);
        resultsDiv.appendChild(linkItem);
        
        // Scrolla till botten
        resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }
    
    updateUIAfterStop() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const progressBar = document.querySelector('.progress-bar');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (progressBar) {
            progressBar.classList.remove('progress-bar-animated');
        }
    }
    
    showCompletionMessage() {
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = `Scanning slutförd! Hittade ${this.workingLinks.length} fungerande länkar.`;
        }
        
        // Visa notis
        this.showNotification(`Scanning klar! Hittade ${this.workingLinks.length} länkar.`, 'success');
    }
    
    showNotification(message, type = 'info') {
        // Skapa en enkel notis
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Ta bort automatiskt efter 5 sekunder
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Global scanner instance
const scanner = new IPTVScanner();

// UI Funktioner
function startScan() {
    const startNum = parseInt(document.getElementById('startNum').value);
    const endNum = parseInt(document.getElementById('endNum').value);
    const maxWorkers = parseInt(document.getElementById('maxWorkers').value);
    
    // Validera input
    if (startNum >= endNum) {
        scanner.showNotification('Startnummer måste vara mindre än slutnummer', 'danger');
        return;
    }
    
    if (endNum - startNum > 1000) {
        if (!confirm(`Du är på väg att testa ${(endNum - startNum) * 4} länkar. Det kan ta lång tid. Vill du fortsätta?`)) {
            return;
        }
    }
    
    // Hämta valda filtyper
    const fileTypes = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => fileTypes.push(cb.value));
    
    if (fileTypes.length === 0) {
        scanner.showNotification('Välj minst en filtyp att testa', 'warning');
        return;
    }
    
    // Rensa tidigare resultat
    document.getElementById('results').innerHTML = '';
    
    // Uppdatera UI
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    document.querySelector('.progress-bar').classList.add('progress-bar-animated');
    
    // Starta scanning
    scanner.startScan(startNum, endNum, fileTypes, maxWorkers);
}

function stopScan() {
    scanner.stopScan();
}

function copyAllLinks() {
    const links = scanner.workingLinks;
    if (links.length === 0) {
        scanner.showNotification('Inga länkar att kopiera', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(links.join('\n')).then(() => {
        scanner.showNotification(`${links.length} länkar kopierade till urklipp`, 'success');
    });
}

function loadPreset(preset) {
    switch(preset) {
        case 'small':
            document.getElementById('startNum').value = 6140;
            document.getElementById('endNum').value = 6180;
            break;
        case 'medium':
            document.getElementById('startNum').value = 6140;
            document.getElementById('endNum').value = 6250;
            break;
        case 'large':
            document.getElementById('startNum').value = 6000;
            document.getElementById('endNum').value = 6200;
            break;
    }
    scanner.showNotification(`Preset "${preset}" laddad`, 'info');
}

// Ladda förinställda intervall vid start
document.addEventListener('DOMContentLoaded', () => {
    // Visa varning om CORS
    console.log('IPTV Scanner loaded. Note: Using CORS proxy for testing.');
    
    // Initiera progress bar
    scanner.updateProgress();
});
