const gameState = {
  points: 0,
  totalPoints: 0,
  clickPower: 1,
  autoPointsPerSecond: 0,
  level: 1,
  currentImage: 1,
  itemsPurchased: {}
};

const shopItems = [
  { id: 'click_boost', name: 'チョメチョメ', description: 'クリック +1 ポイント', basePrice: 10, priceMultiplier: 1.5, effect: { type: 'clickPower', value: 1 } },
  { id: 'auto_clicker', name: 'バイブ（小）', description: '自動 +1 ポイント/秒', basePrice: 50, priceMultiplier: 1.5, effect: { type: 'autoPoints', value: 1 } },
  { id: 'super_click', name: 'バイブ（大）', description: 'クリック +10 ポイント', basePrice: 500, priceMultiplier: 1.8, effect: { type: 'clickPower', value: 10 } },
  { id: 'mega_auto', name: 'ゴッドハンド', description: '自動 +10 ポイント/秒', basePrice: 1000, priceMultiplier: 1.8, effect: { type: 'autoPoints', value: 10 } }
];

const levelConfig = [
  { level: 1, requiredPoints: 0, image: 'level_1.png' },
  { level: 2, requiredPoints: 100, image: 'level_2.png' },
  { level: 3, requiredPoints: 1000, image: 'level_3.png' },
  { level: 4, requiredPoints: 10000, image: 'level_4.png' },
  { level: 5, requiredPoints: 100000, image: 'level_5.png' }
];

const elements = {
  points: document.getElementById('points'),
  level: document.getElementById('level'),
  clickPower: document.getElementById('click-power'),
  autoPoints: document.getElementById('auto-points'),
  totalPoints: document.getElementById('total-points'),
  nextLevelPoints: document.getElementById('next-level-points'),
  progressFill: document.getElementById('progress-fill'),
  clickTarget: document.getElementById('click-target'),
  clickImage: document.getElementById('click-image'),
  shopItems: document.getElementById('shop-items'),
  imageGallery: document.getElementById('image-gallery')
};

function initGame() {
  loadGame();
  renderShop();
  renderImageGallery();
  updateDisplay();
  elements.clickTarget.addEventListener('click', handleClick);
  startAutoClicker();
  startAutoSave();
}

function handleClick(event) {
  const pointsEarned = gameState.clickPower;
  gameState.points += pointsEarned;
  gameState.totalPoints += pointsEarned;
  showClickEffect();
  showFloatingPoints(event, pointsEarned);
  checkLevelUp();
  updateDisplay();
}

function showClickEffect() {
  elements.clickTarget.classList.add('clicked');
  setTimeout(() => elements.clickTarget.classList.remove('clicked'), 200);
}

function showFloatingPoints(event, points) {
  const floating = document.createElement('div');
  floating.className = 'floating-points';
  floating.textContent = `+${formatNumber(points)}`;
  const rect = elements.clickTarget.getBoundingClientRect();
  floating.style.left = `${event.clientX - rect.left}px`;
  floating.style.top = `${event.clientY - rect.top}px`;
  floating.style.position = 'absolute';
  elements.clickTarget.appendChild(floating);
  setTimeout(() => floating.remove(), 1000);
}

function getItemPrice(item) {
  const purchased = gameState.itemsPurchased[item.id] || 0;
  return Math.floor(item.basePrice * Math.pow(item.priceMultiplier, purchased));
}

function renderShop() {
  elements.shopItems.innerHTML = '';
  shopItems.forEach(item => {
    const price = getItemPrice(item);
    const canAfford = gameState.points >= price;
    const purchased = gameState.itemsPurchased[item.id] || 0;
    const itemEl = document.createElement('div');
    itemEl.className = `shop-item ${canAfford ? '' : 'disabled'}`;
    itemEl.innerHTML = `
      <div class="shop-item-header">
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-price">${formatNumber(price)} pts</span>
      </div>
      <div class="shop-item-description">${item.description}</div>
      <div class="shop-item-owned">Owned: ${purchased}</div>
    `;
    itemEl.addEventListener('click', () => purchaseItem(item));
    elements.shopItems.appendChild(itemEl);
  });
}

function purchaseItem(item) {
  const price = getItemPrice(item);
  if (gameState.points < price) return;
  gameState.points -= price;
  gameState.itemsPurchased[item.id] = (gameState.itemsPurchased[item.id] || 0) + 1;
  if (item.effect.type === 'clickPower') gameState.clickPower += item.effect.value;
  else if (item.effect.type === 'autoPoints') gameState.autoPointsPerSecond += item.effect.value;
  renderShop();
  updateDisplay();
}

function startAutoClicker() {
  setInterval(() => {
    if (gameState.autoPointsPerSecond > 0) {
      gameState.points += gameState.autoPointsPerSecond;
      gameState.totalPoints += gameState.autoPointsPerSecond;
      checkLevelUp();
      updateDisplay();
    }
  }, 1000);
}

function checkLevelUp() {
  for (let i = levelConfig.length - 1; i >= 0; i--) {
    if (gameState.totalPoints >= levelConfig[i].requiredPoints) {
      if (gameState.level < levelConfig[i].level) {
        gameState.level = levelConfig[i].level;
        showLevelUpNotification(gameState.level);
        renderImageGallery();
      }
      break;
    }
  }
}

function showLevelUpNotification(level) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;`;

  const title = document.createElement('div');
  title.style.cssText = `color:#ffd700;font-size:32px;font-weight:bold;margin-bottom:20px;text-shadow:0 0 20px rgba(255,215,0,0.8);`;
  title.textContent = `Level ${level} 解放！`;

  const video = document.createElement('video');
  video.src = `images/level_${level}.mp4`;
  video.style.cssText = `max-width:80%;max-height:60%;border-radius:10px;box-shadow:0 0 30px rgba(255,215,0,0.5);`;
  video.controls = true;
  video.autoplay = true;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '閉じる';
  closeBtn.style.cssText = `margin-top:20px;padding:15px 40px;background:#ffd700;border:none;border-radius:10px;cursor:pointer;font-size:18px;font-weight:bold;`;
  closeBtn.addEventListener('click', () => overlay.remove());

  video.onerror = () => {
    video.style.display = 'none';
    const noVideo = document.createElement('div');
    noVideo.style.cssText = `color:#888;font-size:16px;margin:20px;`;
    noVideo.textContent = `動画ファイル: images/level_${level}.mp4`;
    overlay.insertBefore(noVideo, closeBtn);
  };

  overlay.appendChild(title);
  overlay.appendChild(video);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}

function renderImageGallery() {
  elements.imageGallery.innerHTML = '';
  levelConfig.forEach(config => {
    const isUnlocked = gameState.level >= config.level;
    const isActive = gameState.currentImage === config.level;
    const galleryItem = document.createElement('div');
    galleryItem.className = `gallery-item ${isUnlocked ? '' : 'locked'} ${isActive ? 'active' : ''}`;
    if (isUnlocked) {
      const img = document.createElement('img');
      img.src = `images/${config.image}`;
      img.alt = `Level ${config.level}`;
      img.onerror = function() { this.style.display = 'none'; this.parentElement.innerHTML = config.level; };
      galleryItem.appendChild(img);
      galleryItem.addEventListener('click', () => selectImage(config.level));
    }
    elements.imageGallery.appendChild(galleryItem);
  });
}

function selectImage(level) {
  gameState.currentImage = level;
  const config = levelConfig.find(c => c.level === level);
  if (config) {
    elements.clickImage.src = `images/${config.image}`;
    elements.clickImage.style.display = 'block';
    elements.clickTarget.classList.remove('placeholder');
  }
  renderImageGallery();
}

function updateDisplay() {
  elements.points.textContent = formatNumber(gameState.points);
  elements.level.textContent = gameState.level;
  elements.clickPower.textContent = formatNumber(gameState.clickPower);
  elements.autoPoints.textContent = formatNumber(gameState.autoPointsPerSecond);
  elements.totalPoints.textContent = formatNumber(gameState.totalPoints);
  const currentLevelConfig = levelConfig.find(c => c.level === gameState.level);
  const nextLevelConfig = levelConfig.find(c => c.level === gameState.level + 1);
  if (nextLevelConfig) {
    elements.nextLevelPoints.textContent = formatNumber(nextLevelConfig.requiredPoints);
    const progress = ((gameState.totalPoints - currentLevelConfig.requiredPoints) / (nextLevelConfig.requiredPoints - currentLevelConfig.requiredPoints)) * 100;
    elements.progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  } else {
    elements.nextLevelPoints.textContent = 'MAX';
    elements.progressFill.style.width = '100%';
  }
  renderShop();
}

function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toString();
}

function saveGame() {
  const saveData = { ...gameState, savedAt: Date.now() };
  localStorage.setItem('clickerGameSave', JSON.stringify(saveData));
}

function loadGame() {
  const saveData = localStorage.getItem('clickerGameSave');
  if (saveData) {
    try {
      const parsed = JSON.parse(saveData);
      Object.assign(gameState, { points: parsed.points || 0, totalPoints: parsed.totalPoints || 0, clickPower: parsed.clickPower || 1, autoPointsPerSecond: parsed.autoPointsPerSecond || 0, level: parsed.level || 1, currentImage: parsed.currentImage || 1, itemsPurchased: parsed.itemsPurchased || {} });
      if (parsed.savedAt && gameState.autoPointsPerSecond > 0) {
        const offlineSeconds = Math.min(Math.floor((Date.now() - parsed.savedAt) / 1000), 3600);
        const offlineEarnings = offlineSeconds * gameState.autoPointsPerSecond;
        if (offlineEarnings > 0) {
          gameState.points += offlineEarnings;
          gameState.totalPoints += offlineEarnings;
          showOfflineEarnings(offlineEarnings, offlineSeconds);
        }
      }
      const config = levelConfig.find(c => c.level === gameState.currentImage);
      if (config) elements.clickImage.src = `images/${config.image}`;
    } catch (e) { console.error('Failed to load:', e); }
  }
}

function showOfflineEarnings(earnings, seconds) {
  const notification = document.createElement('div');
  notification.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:#ffd700;padding:30px 50px;border-radius:20px;font-size:20px;z-index:1000;text-align:center;border:2px solid #ffd700;box-shadow:0 0 30px rgba(255,215,0,0.5);`;
  notification.innerHTML = `<div style="font-size:16px;color:#aaa;margin-bottom:10px;">Welcome back!</div><div style="font-size:28px;font-weight:bold;">+${formatNumber(earnings)} points</div><div style="font-size:14px;color:#888;margin-top:10px;">earned in ${Math.floor(seconds/60)} min</div><button style="margin-top:20px;padding:10px 30px;background:#ffd700;border:none;border-radius:10px;cursor:pointer;font-size:16px;font-weight:bold;">OK</button>`;
  notification.querySelector('button').addEventListener('click', () => notification.remove());
  document.body.appendChild(notification);
}

function startAutoSave() {
  setInterval(saveGame, 10000);
  window.addEventListener('beforeunload', saveGame);
}

document.addEventListener('DOMContentLoaded', initGame);
