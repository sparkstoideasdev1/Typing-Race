const canvas = document.getElementById('raceCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('typingInput');
const sentenceEl = document.getElementById('sentence');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const countdownEl = document.getElementById('countdown');
const bannerEl = document.getElementById('banner');
const messageEl = document.getElementById('message');
const resultsEl = document.getElementById('results');

const racers = [
    { name: 'Roshi', color: '#f05b64', wpm: 100, progress: 0 },
    { name: 'Cutleleader Bug', color: '#4b91ff', wpm: 40, progress: 0 },
    { name: 'Snapdragonmare', color: '#ffb347', wpm: 40, progress: 0 },
    { name: 'Turbo Tortoise', color: '#b879ff', wpm: 40, progress: 0 },
    { name: 'You', color: '#35df86', wpm: 0, progress: 0, player: true }
];
let state = 'ready';
let sentence = sentenceEl.textContent.trim();
let startTime = 0, elapsed = 0, animationStart = performance.now(), lastFrame = 0;
let countdownStart = 0, typedCount = 0, errors = 0, finishedAt = 0;
const TRACK_END = 1;

function drawCar(x, y, color, name, player = false) {
    ctx.save(); ctx.translate(x, y);
    // Simple car illustration drawn with Canvas (no image assets needed).
    ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(0, 22, 34, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-34, -4, 68, 22, 7); ctx.fill();
    ctx.fillStyle = player ? '#d7ffea' : '#e8f2ff'; ctx.beginPath(); ctx.moveTo(-17, -4); ctx.lineTo(-8, -17); ctx.lineTo(14, -17); ctx.lineTo(25, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#21364b'; ctx.fillRect(-7, -14, 15, 8); ctx.fillRect(11, -14, 8, 8);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(27, 2, 5, 5); ctx.fillStyle = '#ffcf5c'; ctx.fillRect(-33, 3, 4, 5);
    ctx.fillStyle = '#09111b'; for (const wx of [-21, 20]) { ctx.beginPath(); ctx.arc(wx, 17, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#aab8c9'; ctx.beginPath(); ctx.arc(wx, 17, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#09111b'; }
    ctx.fillStyle = '#e7f0fb'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(name, 0, -23); ctx.restore();
}
function drawTrack(now = performance.now()) {
    const w = canvas.width, h = canvas.height; const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#10263a'); sky.addColorStop(1, '#1a3945'); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // Distant city and moving lights.
    for (let i = 0; i < 32; i++) { const bx = (i * 47 - (now * .025) % 47 + w) % w; const bh = 25 + (i * 29 % 65); ctx.fillStyle = i % 2 ? '#1b3347' : '#203c50'; ctx.fillRect(bx, 130 - bh, 30, bh); for (let wy = 145 - bh; wy < 120; wy += 14) { ctx.fillStyle = '#f7d98a88'; ctx.fillRect(bx + 7, wy, 4, 5); } }
    const roadTop = 105, laneH = 54, roadBottom = roadTop + laneH * 5; ctx.fillStyle = '#2a3340'; ctx.fillRect(0, roadTop, w, roadBottom - roadTop);
    ctx.fillStyle = '#b5c1cb'; ctx.fillRect(0, roadTop, w, 5); ctx.fillRect(0, roadBottom - 5, w, 5);
    for (let i = 1; i < 5; i++) { ctx.strokeStyle = '#c4ced766'; ctx.lineWidth = 2; ctx.setLineDash([24, 20]); ctx.lineDashOffset = -(now * .07) % 44; ctx.beginPath(); ctx.moveTo(0, roadTop + i * laneH); ctx.lineTo(w, roadTop + i * laneH); ctx.stroke(); } ctx.setLineDash([]);
    // Finish stripe.
    const finishX = w - 70; for (let y = roadTop; y < roadBottom; y += 14) { for (let x = finishX; x < finishX + 14; x += 14) { ctx.fillStyle = ((Math.floor((y - roadTop) / 14) + Math.floor((x - finishX) / 14)) % 2 === 0) ? '#fff' : '#10151b'; ctx.fillRect(x, y, 14, 14); } }
    racers.forEach((r, i) => { const laneY = roadTop + laneH * i + laneH / 2; const x = 45 + Math.min(1, r.progress) * (w - 150); drawCar(x, laneY, r.color, r.name, r.player); });
    ctx.fillStyle = '#d8e7f7'; ctx.font = '13px Arial'; ctx.textAlign = 'left'; ctx.fillText('START', 16, roadTop - 13); ctx.textAlign = 'right'; ctx.fillText('FINISH', w - 18, roadTop - 13);
}
function updateSentence() {
    const typed = input.value; let html = '';
    for (let i = 0; i < sentence.length; i++) {
        let cls = ''; if (i < typed.length) cls = typed[i] === sentence[i] ? 'correct' : 'incorrect'; else if (i === typed.length) cls = 'next';
        html += `<span class="${cls}">${escapeHtml(sentence[i])}</span>`;
    }
    sentenceEl.innerHTML = html;
}
function escapeHtml(ch) { return ch.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function getStats() {
    const typed = input.value; let correct = 0; for (let i = 0; i < typed.length; i++) if (typed[i] === sentence[i]) correct++;
    const minutes = Math.max(elapsed / 60, 1 / 60); const wpm = Math.round((correct / 5) / minutes); const accuracy = typed.length ? Math.round(correct / typed.length * 100) : 100;
    return { wpm, accuracy, correct, typed: typed.length };
}
function updateHUD() { const s = getStats(); document.getElementById('wpm').textContent = s.wpm; document.getElementById('accuracy').textContent = s.accuracy + '%'; document.getElementById('time').textContent = elapsed.toFixed(1) + 's'; const rank = [...racers].sort((a, b) => b.progress - a.progress).findIndex(r => r.player) + 1; document.getElementById('position').textContent = `${rank} / ${racers.length}`; }
function startRace() {
    input.value = ''; typedCount = 0; errors = 0; elapsed = 0; finishedAt = 0; racers.forEach(r => r.progress = 0); racers.forEach(r => { if (!r.player) r.wpm = 30 + Math.random() * 30; });
    state = 'countdown'; countdownStart = performance.now(); countdownEl.classList.remove('hidden'); bannerEl.classList.add('hidden'); resultsEl.classList.add('hidden'); input.disabled = true; input.focus(); startBtn.disabled = true; restartBtn.disabled = true; messageEl.textContent = 'Get ready...'; updateSentence(); updateHUD();
}
function beginActualRace() { state = 'racing'; startTime = performance.now(); input.disabled = false; input.focus(); countdownEl.classList.add('hidden'); messageEl.textContent = 'Go! Type the sentence as accurately as you can.'; }
function finishRace(reason = 'Finished!') {
    if (state !== 'racing') return; state = 'finished'; finishedAt = performance.now(); input.disabled = true; startBtn.disabled = false; restartBtn.disabled = false; bannerEl.textContent = reason; bannerEl.classList.remove('hidden');
    const s = getStats(); const place = [...racers].sort((a, b) => b.progress - a.progress).findIndex(r => r.player) + 1;
    document.getElementById('resultPlace').textContent = place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : place + 'th'; document.getElementById('resultWpm').textContent = s.wpm; document.getElementById('resultAccuracy').textContent = s.accuracy + '%'; document.getElementById('resultTime').textContent = elapsed.toFixed(1) + 's'; resultsEl.classList.remove('hidden'); messageEl.textContent = 'Race complete. Click Race Again to play a new random sentence.';
}
async function loadNewSentence() { try { const response = await fetch(NEW_SENTENCE_URL); if (!response.ok) throw new Error('Request failed'); const data = await response.json(); sentence = data.sentence; sentenceEl.textContent = sentence; } catch (err) { messageEl.textContent = 'Could not load a new sentence. Refresh the page and try again.'; } }
startBtn.addEventListener('click', startRace);
restartBtn.addEventListener('click', async () => { await loadNewSentence(); startRace(); });
input.addEventListener('input', () => { if (state !== 'racing') return; updateSentence(); const s = getStats(); typedCount = input.value.length; errors = Math.max(0, typedCount - s.correct); const player = racers.find(r => r.player); player.progress = Math.min(.99, s.correct / Math.max(sentence.length, 1)); updateHUD(); if (input.value === sentence) finishRace('Sentence complete!'); });
input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (state === 'racing') finishRace('Race ended'); } });
function frame(now) {
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0; lastFrame = now;
    if (state === 'countdown') { const left = 3 - Math.floor((now - countdownStart) / 1000); countdownEl.textContent = left > 0 ? left : 'GO!'; if (now - countdownStart >= 3000) beginActualRace(); }
    if (state === 'racing') {
        elapsed = (now - startTime) / 1000; const player = racers.find(r => r.player); const s = getStats(); player.progress = Math.min(.99, s.correct / Math.max(sentence.length, 1));
        racers.filter(r => !r.player).forEach(r => { r.progress = Math.min(1, r.progress + (r.wpm / 60 / 5) * dt / Math.max(sentence.length / 5, 1) * 1.6); });
        if (racers.some(r => !r.player && r.progress >= 1)) finishRace('A bot crossed the finish line!'); updateHUD();
    }
    drawTrack(now); requestAnimationFrame(frame);
}
updateSentence(); drawTrack(); requestAnimationFrame(frame);
