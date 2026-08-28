// --- FİREBASE BAĞLANTISI ---
const firebaseConfig = {
    apiKey: "AIzaSyBZ9hoDmIkTX1wa3Fybr_HBEjb1NNWqpXM",
    authDomain: "tokat-oyunu-57fc9.firebaseapp.com",
    databaseURL: "https://tokat-oyunu-57fc9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tokat-oyunu-57fc9",
    storageBucket: "tokat-oyunu-57fc9.firebasestorage.app",
    messagingSenderId: "320289328095",
    appId: "1:320289328095:web:1bf1b56dfde061ed86d26a",
    measurementId: "G-WV0HE72HMZ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database(); // Artık Realtime Database kullanıyoruz!

// --- UYGULAMA DURUMU VE BULUT SENKRONİZASYONU ---
let globalCount = 0;
let userCount = 0;
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let currentUser = localStorage.getItem('currentUser') || null;
let currentWeapon = "🖐️"; // Varsayılan silah

let accounts = JSON.parse(localStorage.getItem('accounts')) || {};
let usersDatabase = [];
let characterStats = JSON.parse(localStorage.getItem('characterStats')) || {};
let characterGlobalStats = {};
let duelLeaderboard = [];
let customCharacters = {};

// --- CANLI BULUT DİNLEYİCİLERİ (Realtime Database) ---
db.ref("oyunData/genelSayac").on("value", (snapshot) => {
    const val = snapshot.val();
    if (val !== null) {
        globalCount = val.count || 0;
        globalCountEl.textContent = globalCount;
    }
});

db.ref("oyunData/tumKarakterler").on("value", (snapshot) => {
    const val = snapshot.val();
    if (val && val.list) {
        customCharacters = val.list;
        Object.keys(customCharacters).forEach(charName => {
            let savedChar = customCharacters[charName];
            characterData[charName] = {
                desc: savedChar.desc || "",
                normalImg: savedChar.normalImg,
                slappedImg: savedChar.slappedImg,
                sound: savedChar.sound || "",
                creator: savedChar.creator || "Bilinmiyor"
            };
        });
        renderCustomCharacterList();
    }
});

db.ref("oyunData/skorlarTablosu").on("value", (snapshot) => {
    const val = snapshot.val();
    if (val) {
        if (val.users) usersDatabase = val.users;
        if (val.duels) duelLeaderboard = val.duels;
        if (val.charGlobals) characterGlobalStats = val.charGlobals;
        
        if (currentUser) {
            let foundUser = usersDatabase.find(u => u.name === currentUser);
            if (foundUser) {
                userCount = foundUser.count;
                userCountEl.textContent = userCount;
            }
        }
    }
});

function syncCloudData() {
    db.ref("oyunData/skorlarTablosu").set({
        users: usersDatabase,
        duels: duelLeaderboard,
        charGlobals: characterGlobalStats
    }).catch(err => {});
}

// Varsayılan Ses Havuzu
const defaultSlapAudioPool = [
    new Audio('sounds/klasik.mp3'),
    new Audio('sounds/klasik.mp3'),
    new Audio('sounds/klasik.mp3'),
    new Audio('sounds/klasik.mp3')
];
let defaultAudioPoolIndex = 0;
const characterAudioPools = {};

function getCharacterAudioPool(soundPath) {
    if (!soundPath) return null;
    if (!characterAudioPools[soundPath]) {
        characterAudioPools[soundPath] = [
            new Audio(soundPath),
            new Audio(soundPath),
            new Audio(soundPath),
            new Audio(soundPath)
        ];
        characterAudioPools[soundPath].index = 0;
    }
    let pool = characterAudioPools[soundPath];
    let audio = pool[pool.index];
    pool.index = (pool.index + 1) % pool.length;
    return audio;
}

function playSlapSound(charName) {
    if (!soundEnabled) return;
    try {
        let charInfo = characterData[charName];
        let soundToPlay = null;

        if (charInfo && charInfo.sound) {
            soundToPlay = getCharacterAudioPool(charInfo.sound);
        }

        if (soundToPlay) {
            soundToPlay.currentTime = 0;
            soundToPlay.play().catch(err => {});
        } else {
            let sound = defaultSlapAudioPool[defaultAudioPoolIndex];
            sound.currentTime = 0;
            sound.play().catch(err => {});
            defaultAudioPoolIndex = (defaultAudioPoolIndex + 1) % defaultSlapAudioPool.length;
        }
    } catch(e) {}
}

// --- KARAKTER TANIMLARI ---
const characterData = {
    "Büşra": { desc: "", normalImg: "images/Büşra.png", slappedImg: "images/Büşra.png", sound: "sounds/büşra2.mp3" , creator: "Sistem" },
    "Beyza": { desc: "", normalImg: "images/Beyza.png", slappedImg: "images/Beyza-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Şebo": { desc: "", normalImg: "images/Şebo.png", slappedImg: "images/Şebo-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "İrem": { desc: "", normalImg: "images/İrem.png", slappedImg: "images/İrem-slapped.png", sound: "sounds/irem.mp3", creator: "Sistem" },
    "Esma": { desc: "", normalImg: "images/Esma.png", slappedImg: "images/Esma-slapped.png", sound: "sounds/esma2.mp3", creator: "Sistem" },
    "Eko": { desc: "", normalImg: "images/Eko.png", slappedImg: "images/Ekin-slapped.png", sound: "sounds/ekin.mp3", creator: "Sistem" },
    "Cemal": { desc: "", normalImg: "images/Cemal.png", slappedImg: "images/Cemal-slapped.png", sound: "sounds/cemal1.mp3", creator: "Sistem" },
    "Furkan": { desc: "", normalImg: "images/Furkan.png", slappedImg: "images/Furkan-slapped.png", sound: "sounds/furkan.mp3", creator: "Sistem" },
    "Tuğulu": { desc: "", normalImg: "images/Tuğulu.png", slappedImg: "images/Tuğulu-slapped.png", sound: "sounds/tuğulu2.mp3", creator: "Sistem" },
    "İso": { desc: "", normalImg: "images/İso.png", slappedImg: "images/İso-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Kaan": { desc: "", normalImg: "images/Kaan.png", slappedImg: "images/Kaan-slapped.png", sound: "sounds/kaan.mp3", creator: "Sistem" },
    "Berat": { desc: "", normalImg: "images/Berat.png", slappedImg: "images/Berat-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Emir": { desc: "", normalImg: "images/Emir.png", slappedImg: "images/Emir-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Zelal": { desc: "", normalImg: "images/Zelal.png", slappedImg: "images/Zelal-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Aysima": { desc: "", normalImg: "images/Aysima.png", slappedImg: "images/Aysima-slapped.png", sound: "sounds/aysima.mp3", creator: "Sistem" },
    "Zümra": { desc: "", normalImg: "images/Zümra.png", slappedImg: "images/Zümra-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Yalçın": { desc: "", normalImg: "images/Yalçın.png", slappedImg: "images/Yalçın-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Çiçek": { desc: "", normalImg: "images/Çiçek.png", slappedImg: "images/Çiçek-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Hatice": { desc: "", normalImg: "images/Hatice.png", slappedImg: "images/Hatice-slapped.png", sound: "sounds/hatice1.mp3", creator: "Sistem" },

    "Oscar Piastri": { desc: "", normalImg: "images/Oscarpiastri.png", slappedImg: "images/Oscarpiastri-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "George Russell": { desc: "", normalImg: "images/Georgerussell.png", slappedImg: "images/Georgerussell-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Max Verstappen": { desc: "", normalImg: "images/Maxverstappen.png", slappedImg: "images/Maxverstappen-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Charles Leclerc": { desc: "", normalImg: "images/Charlesleclerc.png", slappedImg: "images/Charlesleclerc-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Lando Norris": { desc: "", normalImg: "images/Landonorris.png", slappedImg: "images/Landonorris-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },

    "Tarkan": { desc: "", normalImg: "images/Tarkan.png", slappedImg: "images/Tarkan-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" },
    "Edis": { desc: "", normalImg: "images/Edis.png", slappedImg: "images/Edis-slapped.png", sound: "sounds/klasik.mp3", creator: "Sistem" }
};

let activeCharacter = localStorage.getItem('activeCharacter') || null;
let isDuelActive = false;
let duelTimeLeft = 10;
let duelInterval = null;
let slapTimeout = null;
let slapEffectTimeout = null;
let blueHitTimeout = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration, type = 'sine') {
    if (!soundEnabled) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

let currentScale = 1;
const zoomContainer = document.getElementById('zoom-container');
const characterImg = document.getElementById('character-img');

zoomContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
        currentScale = Math.min(currentScale + 0.1, 2.0);
    } else {
        currentScale = Math.max(currentScale - 0.1, 0.7);
    }
    characterImg.style.transform = `scale(${currentScale})`;
}, { passive: false });

const globalCountEl = document.getElementById('global-slap-count');
const userCountEl = document.getElementById('user-slap-count');
const characterTarget = document.getElementById('character-target');
const characterTextEl = document.getElementById('character-text');
const activeCharNameTag = document.getElementById('active-character-name');
const slapEffect = document.getElementById('slap-effect');
const blueHitGlow = document.getElementById('blue-hit-glow');

const duelResultDisplay = document.getElementById('duel-result-display');
const finalDuelScoreText = document.getElementById('final-duel-score-text');
const duelTimerBox = document.getElementById('duel-timer-box');
const duelTimeLeftEl = document.getElementById('duel-time-left');
const cancelDuelBtn = document.getElementById('cancel-duel-btn');
const duelCountdownModal = document.getElementById('duel-countdown-modal');
const countdownNumberEl = document.getElementById('countdown-number');

const leaderboardBtn = document.getElementById('leaderboard-btn');
const settingsBtn = document.getElementById('settings-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const aboutBtn = document.getElementById('about-btn');

const leaderboardDrawer = document.getElementById('leaderboard-drawer');
const modalOverlay = document.getElementById('modal-overlay');
const closeDrawerBtn = document.getElementById('close-drawer');
const drawerTabBtns = document.querySelectorAll('.drawer-tab-btn');

const navTabs = document.querySelectorAll('.nav-tab');
const authNavBtn = document.getElementById('auth-nav-btn');

const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const closeAuthBtn = document.getElementById('close-auth');
const switchModeBtn = document.getElementById('switch-mode-btn');
const authToggleText = document.getElementById('auth-toggle-text');

const accountModal = document.getElementById('account-modal');
const accUsernameTitle = document.getElementById('acc-username-title');
const accTotalSlaps = document.getElementById('acc-total-slaps');
const accCharacterStats = document.getElementById('acc-character-stats');
const logoutBtn = document.getElementById('logout-btn');
const closeAccountModal = document.getElementById('close-account-modal');

const appearanceModal = document.getElementById('appearance-modal');
const closeAppearance = document.getElementById('close-appearance');
const catBtns = document.querySelectorAll('.cat-btn');

const customCharNameInput = document.getElementById('custom-char-name');
const customCharDescInput = document.getElementById('custom-char-desc');
const customNormalImgInput = document.getElementById('custom-normal-img');
const customSlappedImgInput = document.getElementById('custom-slapped-img');
const customSoundInput = document.getElementById('custom-sound');
const saveCustomCharBtn = document.getElementById('save-custom-char-btn');
const customCharacterList = document.getElementById('custom-character-list');

const weaponModal = document.getElementById('weapon-modal');
const closeWeapon = document.getElementById('close-weapon');

const aboutModal = document.getElementById('about-modal');
const closeAboutModal = document.getElementById('close-about-modal');

let isRegisterMode = false;

updateUIAuthStatus();
soundToggleBtn.textContent = soundEnabled ? "🔊 Ses: Açık" : "🔇 Ses: Kapalı";
updateActiveCharacterUI();

function updateUIAuthStatus() {
    if (currentUser) authNavBtn.textContent = currentUser;
    else authNavBtn.textContent = "Giriş Yap";
}

function updateActiveCharacterUI() {
    if (!activeCharacter || !characterData[activeCharacter]) {
        activeCharNameTag.textContent = "Karakter Seç";
        characterTextEl.textContent = "Lütfen bir karakter seçin!";
        characterImg.src = ""; 
        characterImg.style.display = "none"; // Karakter yoksa gizle
        return;
    }

    let charInfo = characterData[activeCharacter];
    if (charInfo) {
        activeCharNameTag.textContent = activeCharacter;
        characterTextEl.textContent = charInfo.desc || "";
        characterImg.src = charInfo.normalImg;
        characterImg.style.display = ""; // Karakter varsa gizliliği kaldır, normal göster!
    }
}

// --- TIKLAMA VE VURMA EFEKTİ ---
characterTarget.addEventListener('click', (e) => {
    if (!activeCharacter) {
        alert("Önce bir karakter seçmelisin!");
        appearanceModal.classList.remove('hidden');
        return;
    }
    if (!duelResultDisplay.classList.contains('hidden')) return;
    const rect = characterTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isRightSide = clickX > (rect.width / 2);

    slapEffect.textContent = currentWeapon;
    slapEffect.classList.remove('hidden', 'from-left', 'from-right');
    void slapEffect.offsetWidth; 

    if (isRightSide) {
        slapEffect.classList.add('from-right');
    } else {
        slapEffect.classList.add('from-left');
    }

    clearTimeout(slapEffectTimeout);
    slapEffectTimeout = setTimeout(() => {
        slapEffect.classList.add('hidden');
    }, 280);

    blueHitGlow.classList.remove('active');
    void blueHitGlow.offsetWidth;
    blueHitGlow.classList.add('active');

    clearTimeout(blueHitTimeout);
    blueHitTimeout = setTimeout(() => {
        blueHitGlow.classList.remove('active');
    }, 250);

    characterTarget.classList.add('shake');
    setTimeout(() => characterTarget.classList.remove('shake'), 120);

    let charInfo = characterData[activeCharacter];
    if (charInfo && charInfo.slappedImg) {
        characterImg.src = charInfo.slappedImg;
        clearTimeout(slapTimeout);
        slapTimeout = setTimeout(() => {
            characterImg.src = charInfo.normalImg;
        }, 150);
    }

    globalCount++;
    globalCountEl.textContent = globalCount;
    
    // Realtime Database ile global sayacı kaydet
    db.ref("oyunData/genelSayac").set({ count: globalCount }).catch(err => {});

    if (currentUser) {
        userCount++;
        userCountEl.textContent = userCount;
        let userObj = usersDatabase.find(u => u.name === currentUser);
        if (userObj) userObj.count = userCount;
        else usersDatabase.push({ name: currentUser, count: userCount });

        if (!characterStats[currentUser]) characterStats[currentUser] = {};
        if (!characterStats[currentUser][activeCharacter]) characterStats[currentUser][activeCharacter] = 0;
        characterStats[currentUser][activeCharacter]++;
        localStorage.setItem('characterStats', JSON.stringify(characterStats));
    } else {
        userCount++;
        userCountEl.textContent = userCount;
    }

    if (!characterGlobalStats[activeCharacter]) characterGlobalStats[activeCharacter] = 0;
    characterGlobalStats[activeCharacter]++;
    
    syncCloudData();

    if (isDuelActive) {
        window.currentDuelScore = (window.currentDuelScore || 0) + 1;
    }

    playSlapSound(activeCharacter);
});

// --- ÖZEL KARAKTERLER ---
function renderCustomCharacterList() {
    let html = '';
    let keys = Object.keys(customCharacters);
    if (keys.length === 0) {
        html = '<p style="font-size:9px; color:#666; text-align:center; padding:10px;">Henüz özel karakter yok.</p>';
    } else {
        keys.forEach(charName => {
            let item = customCharacters[charName];
            html += `<div style="display:flex; justify-content:space-between; align-items:center; background:#f0f0f0; padding:6px 10px; border-radius:8px; border:2px solid #000; margin-bottom:5px;">
                <div style="font-size:9px;">
                    <b>⭐ ${charName}</b><br><span style="font-size:8px; color:#555;">Yapan: ${item.creator || 'Bilinmiyor'}</span>
                </div>
                <button class="primary-btn char-select-btn" data-char="${charName}" style="background-color: #caf0f8; font-size:8px; padding:6px 10px;">Seç</button>
            </div>`;
        });
    }
    customCharacterList.innerHTML = html;
    bindCharSelectEvents();
}

saveCustomCharBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert("Özel karakter oluşturabilmek için giriş yapmalısın!");
        appearanceModal.classList.add('hidden');
        authModal.classList.remove('hidden');
        return;
    }

    const name = customCharNameInput.value.trim();
    const desc = customCharDescInput.value.trim() || "";
    const normalImg = customNormalImgInput.value.trim();
    const slappedImg = customSlappedImgInput.value.trim() || normalImg;
    const sound = customSoundInput.value.trim() || "";

    if (!name || !normalImg) {
        alert("Lütfen karakter adı ve normal resim linkini girin!");
        return;
    }

    customCharacters[name] = {
        desc: desc,
        normalImg: normalImg,
        slappedImg: slappedImg,
        sound: sound,
        creator: currentUser
    };

    // Realtime Database ile özel karakterleri gönder
    db.ref("oyunData/tumKarakterler").set({
        list: customCharacters
    }).catch(err => {});

    customCharNameInput.value = '';
    customCharDescInput.value = '';
    customNormalImgInput.value = '';
    customSlappedImgInput.value = '';
    customSoundInput.value = '';

    renderCustomCharacterList();
    alert("Karakter başarıyla kaydedildi!");
});

// --- ALT SEKMELER ---
navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        const section = e.target.getAttribute('data-section');
        if (section === 'slap') {
            if (isDuelActive) return;
            duelResultDisplay.classList.add('hidden');
            navTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            return;
        }
        if (section === 'duel') {
            duelResultDisplay.classList.add('hidden');
            startDuelSequence();
            return;
        }
        if (section === 'appearance') {
            if (isDuelActive) return;
            renderCustomCharacterList();
            appearanceModal.classList.remove('hidden');
            
            document.querySelectorAll('.sub-char-container').forEach(el => el.classList.add('hidden'));
            let insanContainer = document.getElementById('sub-chars-insan');
            if (insanContainer) insanContainer.classList.remove('hidden');
        }
        if (section === 'weapons') {
            if (isDuelActive) return;
            weaponModal.classList.remove('hidden');
        }
        if (section === 'auth') {
            if (isDuelActive) return;
            if (currentUser) openAccountModal();
            else authModal.classList.remove('hidden');
        }
    });
});

// --- SAĞ ÜST GİRİŞ / HESAP BUTONU ---
authNavBtn.addEventListener('click', () => {
    if (isDuelActive) return;
    if (currentUser) {
        openAccountModal();
    } else {
        authModal.classList.remove('hidden');
    }
});

function resetNavTabsToSlap() {
    navTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('.nav-tab[data-section="slap"]').classList.add('active');
}

// --- DÜELLO ---
function startDuelSequence() {
    duelResultDisplay.classList.add('hidden');
    duelCountdownModal.classList.remove('hidden');
    let count = 3;
    countdownNumberEl.textContent = count;
    playTone(400, 0.15);

    let countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumberEl.textContent = count;
            playTone(400, 0.15);
        } else {
            clearInterval(countdownInterval);
            duelCountdownModal.classList.add('hidden');
            playTone(800, 0.3);
            beginDuelTimer();
        }
    }, 1000);
}

function beginDuelTimer() {
    isDuelActive = true;
    window.currentDuelScore = 0;
    duelTimeLeft = 10;
    duelTimerBox.classList.remove('hidden');
    duelTimeLeftEl.textContent = duelTimeLeft + "s";

    navTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('.nav-tab[data-section="duel"]').classList.add('active');

    duelInterval = setInterval(() => {
        duelTimeLeft--;
        duelTimeLeftEl.textContent = duelTimeLeft + "s";
        if (duelTimeLeft <= 0) {
            clearInterval(duelInterval);
            playTone(200, 0.5);
            endDuel();
        }
    }, 1000);
}

cancelDuelBtn.addEventListener('click', () => {
    if (isDuelActive) {
        clearInterval(duelInterval);
        isDuelActive = false;
        duelTimerBox.classList.add('hidden');
        resetNavTabsToSlap();
    }
});

function endDuel() {
    isDuelActive = false;
    duelTimerBox.classList.add('hidden');
    let finalScore = window.currentDuelScore || 0;
    let playerName = currentUser || "Misafir Oyuncu";
    
    let existingIndex = duelLeaderboard.findIndex(item => item.name === playerName);
    if (existingIndex !== -1) {
        if (finalScore > duelLeaderboard[existingIndex].score) duelLeaderboard[existingIndex].score = finalScore;
    } else {
        duelLeaderboard.push({ name: playerName, score: finalScore });
    }
    syncCloudData();

    finalDuelScoreText.textContent = `${finalScore} Tokat`;
    duelResultDisplay.classList.remove('hidden');
    resetNavTabsToSlap();
}

// --- HESAP İŞLEMLERİ ---
function openAccountModal() {
    accUsernameTitle.textContent = `Hesap: ${currentUser}`;
    accTotalSlaps.textContent = userCount;
    let statsHtml = '';
    let userChars = characterStats[currentUser] || {};
    let sortedChars = Object.entries(userChars).sort((a, b) => b[1] - a[1]);

    if (sortedChars.length === 0) statsHtml = '<p>Henüz hiç karaktere vurmadın!</p>';
    else {
        sortedChars.forEach(([charName, count]) => {
            statsHtml += `<div style="padding: 4px 0; border-bottom: 1px dashed #ddd;">• ${charName}: <b>${count}</b> Vuruş</div>`;
        });
    }
    accCharacterStats.innerHTML = statsHtml;
    accountModal.classList.remove('hidden');
}

closeAccountModal.addEventListener('click', () => {
    accountModal.classList.add('hidden');
    resetNavTabsToSlap();
});

logoutBtn.addEventListener('click', () => {
    if (confirm("Oturumu kapatmak istediğine emin misin?")) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        userCount = 0;
        userCountEl.textContent = userCount;
        updateUIAuthStatus();
        accountModal.classList.add('hidden');
        resetNavTabsToSlap();
    }
});

switchModeBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
        authTitle.textContent = "Kayıt Ol";
        authSubmitBtn.textContent = "Kayıt Ol";
        authToggleText.textContent = "Zaten hesabın var mı?";
        switchModeBtn.textContent = "Giriş Yap";
    } else {
        authTitle.textContent = "Giriş Yap";
        authSubmitBtn.textContent = "Giriş Yap";
        authToggleText.textContent = "Hesabın yok mu?";
        switchModeBtn.textContent = "Kayıt Ol";
    }
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username || !password) return;

    if (isRegisterMode) {
        if (accounts[username]) alert("Bu kullanıcı adı zaten alınmış!");
        else {
            accounts[username] = password;
            localStorage.setItem('accounts', JSON.stringify(accounts));
            currentUser = username;
            localStorage.setItem('currentUser', currentUser);
            userCount = 0;
            userCountEl.textContent = userCount;
            let existing = usersDatabase.find(u => u.name === currentUser);
            if (!existing) {
                usersDatabase.push({ name: currentUser, count: 0 });
                syncCloudData();
            }
            updateUIAuthStatus();
            authModal.classList.add('hidden');
            resetNavTabsToSlap();
        }
    } else {
        if (accounts[username] && accounts[username] === password) {
            currentUser = username;
            localStorage.setItem('currentUser', currentUser);
            let existingUser = usersDatabase.find(u => u.name === currentUser);
            if (existingUser) userCount = existingUser.count;
            else {
                userCount = 0;
                usersDatabase.push({ name: currentUser, count: 0 });
                syncCloudData();
            }
            userCountEl.textContent = userCount;
            updateUIAuthStatus();
            authModal.classList.add('hidden');
            resetNavTabsToSlap();
        } else {
            alert("Hatalı kullanıcı adı veya şifre!");
        }
    }
    usernameInput.value = '';
    passwordInput.value = '';
});

closeAuthBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
    resetNavTabsToSlap();
});

// --- KATEGORİ VE KARAKTER SEÇİMİ ---
catBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cat = e.target.getAttribute('data-cat');
        document.querySelectorAll('.sub-char-container').forEach(el => el.classList.add('hidden'));
        document.getElementById(`sub-chars-${cat}`).classList.remove('hidden');
    });
});

function bindCharSelectEvents() {
    document.querySelectorAll('.char-select-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            activeCharacter = e.target.getAttribute('data-char');
            localStorage.setItem('activeCharacter', activeCharacter); // Seçimi kaydet
            updateActiveCharacterUI();
            currentScale = 1;
            characterImg.style.transform = `scale(1)`;

            document.querySelectorAll('.sub-char-container').forEach(el => el.classList.add('hidden'));
            appearanceModal.classList.add('hidden');
            resetNavTabsToSlap();
        });
    });
}
bindCharSelectEvents();

closeAppearance.addEventListener('click', () => {
    appearanceModal.classList.add('hidden');
    resetNavTabsToSlap();
});

// --- SİLAHLAR ---
document.querySelectorAll('.weapon-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentWeapon = e.currentTarget.getAttribute('data-weapon');
        weaponModal.classList.add('hidden');
        resetNavTabsToSlap();
    });
});

closeWeapon.addEventListener('click', () => {
    weaponModal.classList.add('hidden');
    resetNavTabsToSlap();
});

// --- SIRALAMALAR ---
leaderboardBtn.addEventListener('click', () => {
    dropdownMenu.classList.add('hidden');
    leaderboardDrawer.classList.remove('hidden');
    modalOverlay.classList.remove('hidden');
    renderRanking('alltime');
});

function closeDrawer() {
    leaderboardDrawer.classList.add('hidden');
    modalOverlay.classList.add('hidden');
}

closeDrawerBtn.addEventListener('click', closeDrawer);
modalOverlay.addEventListener('click', closeDrawer);

drawerTabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        drawerTabBtns.forEach(b => b.classList.remove('active-tab'));
        e.target.classList.add('active-tab');
        renderRanking(e.target.getAttribute('data-target'));
    });
});

function renderRanking(type) {
    document.querySelectorAll('.ranking-list').forEach(list => list.classList.add('hidden'));
    const activeListContainer = document.getElementById(`list-${type}`);
    activeListContainer.classList.remove('hidden');
    let htmlContent = '';

    if (type === 'alltime') {
        let sortedData = [...usersDatabase].sort((a, b) => b.count - a.count);
        if (sortedData.length === 0) htmlContent = '<p style="text-align:center; padding:20px; color:#666;">Henüz kimse yok!</p>';
        else {
            sortedData.forEach((item, index) => {
                htmlContent += `<div class="ranking-item"><span>${index + 1}. ${item.name}</span><span>${item.count} Vuruş</span></div>`;
            });
        }
    } else if (type === 'character-ranking') {
        let sortedChars = Object.entries(characterGlobalStats).sort((a, b) => b[1] - a[1]);
        if (sortedChars.length === 0) htmlContent = '<p style="text-align:center; padding:20px; color:#666;">Henüz vurulan karakter yok!</p>';
        else {
            sortedChars.forEach(([charName, count], index) => {
                htmlContent += `<div class="ranking-item"><span>${index + 1}. ${charName}</span><span>${count} Vuruş</span></div>`;
            });
        }
    } else if (type === 'duel-ranking') {
        let sortedDuel = [...duelLeaderboard].sort((a, b) => b.score - a.score);
        if (sortedDuel.length === 0) htmlContent = '<p style="text-align:center; padding:20px; color:#666;">Henüz düello rekoru yok!</p>';
        else {
            sortedDuel.forEach((item, index) => {
                htmlContent += `<div class="ranking-item"><span>${index + 1}. ${item.name}</span><span>${item.score} Skor (10sn)</span></div>`;
            });
        }
    }
    activeListContainer.innerHTML = htmlContent;
}

// --- AYARLAR ---
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('hidden');
});

window.addEventListener('click', (e) => {
    if (!settingsBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
    }
});

soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    soundToggleBtn.textContent = soundEnabled ? "🔊 Ses: Açık" : "🔇 Ses: Kapalı";
});

aboutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.add('hidden');
    aboutModal.classList.remove('hidden');
});

closeAboutModal.addEventListener('click', () => {
    aboutModal.classList.add('hidden');
});
