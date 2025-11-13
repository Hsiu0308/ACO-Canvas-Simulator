const canvas = document.getElementById("acoCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

//DOM
const numAntsInput = document.getElementById("numAnts");
const numAntsValue = document.getElementById("numAntsValue");
const numCitiesInput = document.getElementById("numCities");
const numCitiesValue = document.getElementById("numCitiesValue");
const alphaInput = document.getElementById("alpha");
const alphaValue = document.getElementById("alphaValue");
const betaInput = document.getElementById("beta");
const betaValue = document.getElementById("betaValue");
const evaporationInput = document.getElementById("evaporation");
const evaporationValue = document.getElementById("evaporationValue");
const antSpeedInput = document.getElementById("antSpeed");
const antSpeedValue = document.getElementById("antSpeedValue");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");

let config = {};

let cities = [];
let distances = [];
let pheromones = [];
let ants = [];
let bestPath = null;
let bestPathLength = Infinity;
let generationCounter = 0;
let isPaused = false;
let requestID;

numAntsInput.addEventListener(
  "input",
  () => (numAntsValue.textContent = numAntsInput.value)
);
numCitiesInput.addEventListener(
  "input",
  () => (numCitiesValue.textContent = numCitiesInput.value)
);
alphaInput.addEventListener(
  "input",
  () => (alphaValue.textContent = parseFloat(alphaInput.value).toFixed(1))
);
betaInput.addEventListener(
  "input",
  () => (betaValue.textContent = parseFloat(betaInput.value).toFixed(1))
);
evaporationInput.addEventListener(
  "input",
  () =>
    (evaporationValue.textContent = parseFloat(evaporationInput.value).toFixed(
      2
    ))
);
antSpeedInput.addEventListener(
  "input",
  () => (antSpeedValue.textContent = antSpeedInput.value)
);

restartBtn.addEventListener("click", restartSimulation);
pauseBtn.addEventListener("click", togglePause);

function updateConfigFromUI() {
  config = {
    numAnts: parseInt(numAntsInput.value),
    numCities: parseInt(numCitiesInput.value),
    alpha: parseFloat(alphaInput.value),
    beta: parseFloat(betaInput.value),
    evaporation: parseFloat(evaporationInput.value),
    q: 100,
    antSpeed: parseInt(antSpeedInput.value),
  };
}

class Ant {
  constructor() {
    this.reset();
  }

  // 重設螞蟻狀態 (新一輪)
  reset() {
    this.tourComplete = false; //這一輪跑完沒
    this.path = []; //走過的路徑
    this.pathLength = 0; //走過的路徑長度
    this.visited = {}; //拜訪過的城市

    // 隨機選一個起始城市
    let startCityIndex = Math.floor(Math.random() * config.numCities);
    this.currentCity = startCityIndex;
    this.path.push(startCityIndex);
    this.visited[startCityIndex] = true;

    // 設定螞蟻的 "點" 的初始位置
    this.x = cities[startCityIndex].x;
    this.y = cities[startCityIndex].y;

    // 選擇下一個目標
    this.targetCity = this.selectNextCity();
  }

  // 選擇下一個城市 (核心ACO邏輯)
  selectNextCity() {
    let probs = calculateProbs(this.currentCity, this.visited);
    let r = Math.random();
    let cumulativeProb = 0;

    for (let city = 0; city < config.numCities; city++) {
      if (probs[city] > 0) {
        cumulativeProb += probs[city];
        if (r <= cumulativeProb) {
          return city;
        }
      }
    }
    //(如果機率計算出錯)
    for (let city = 0; city < config.numCities; city++) {
      if (!this.visited[city]) return city;
    }
  }

  //每一幀都會呼叫這個函式
  update() {
    // 如果還沒跑完
    if (!this.tourComplete) {
      let target = cities[this.targetCity];

      //向量計算：朝著目標移動
      let dx = target.x - this.x;
      let dy = target.y - this.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      // 如果距離小於速度，代表 "抵達"
      if (dist < config.antSpeed) {
        //抵達新城市
        this.x = target.x;
        this.y = target.y;
        this.currentCity = this.targetCity;
        this.path.push(this.currentCity);
        this.visited[this.currentCity] = true;
        this.pathLength += dist; // 累加路徑長度

        // 檢查是否所有城市都去過了
        if (this.path.length === config.numCities) {
          let firstCity = this.path[0];
          this.pathLength += distances[this.currentCity][firstCity];
          this.path.push(firstCity);
          this.tourComplete = true; // 標記為已完成
        } else {
          // 選擇下一個目標
          this.targetCity = this.selectNextCity();
        }
      } else {
        //未抵達，繼續移動
        //將 (dx, dy) 轉換為單位向量，再乘上速度
        this.x += (dx / dist) * config.antSpeed;
        this.y += (dy / dist) * config.antSpeed;
      }
    }
  }

  // 繪製螞蟻 (紅點)
  draw(ctx) {
    if (!this.tourComplete) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }
  }
}

//Algorithm

//計算機率(全域，供所有螞蟻使用)
function calculateProbs(currentCity, visited) {
  let probs = new Array(config.numCities).fill(0);
  let totalAttraction = 0;

  for (let city = 0; city < config.numCities; city++) {
    if (!visited[city]) {
      let pheromone = Math.pow(pheromones[currentCity][city], config.alpha);
      let heuristic = Math.pow(1.0 / distances[currentCity][city], config.beta);
      let attraction = pheromone * heuristic;

      probs[city] = attraction;
      totalAttraction += attraction;
    }
  }

  if (totalAttraction > 0) {
    for (let i = 0; i < probs.length; i++) {
      probs[i] /= totalAttraction;
    }
  }
  return probs;
}

//更新費洛蒙 (全域)
//參數 allAnts 是 "已完成" 這一輪的所有螞蟻物件
function updatePheromones(allAnts) {
  // 揮發
  for (let i = 0; i < config.numCities; i++) {
    for (let j = 0; j < config.numCities; j++) {
      pheromones[i][j] *= 1.0 - config.evaporation;
    }
  }
  // 放置
  for (let ant of allAnts) {
    let pheromoneDeposit = config.q / ant.pathLength;

    for (let i = 0; i < ant.path.length - 1; i++) {
      let cityA = ant.path[i];
      let cityB = ant.path[i + 1];
      pheromones[cityA][cityB] += pheromoneDeposit;
      pheromones[cityB][cityA] += pheromoneDeposit;
    }
  }
}

//繪圖函式
function drawPheromones() {
  let maxPheromone = Math.max(...pheromones.flat());
  if (maxPheromone === 0) maxPheromone = 1;

  for (let i = 0; i < config.numCities; i++) {
    for (let j = i + 1; j < config.numCities; j++) {
      let p = pheromones[i][j] / maxPheromone;

      ctx.beginPath();
      ctx.moveTo(cities[i].x, cities[i].y);
      ctx.lineTo(cities[j].x, cities[j].y);
      // 讓低費洛蒙的路徑非常透明
      ctx.strokeStyle = `rgba(0, 0, 255, ${p * p})`;
      ctx.lineWidth = p * 4 + 0.5; // 加上 0.5 確保細線也能被看見
      ctx.stroke();
    }
  }
}

function drawBestPath() {
  if (bestPath) {
    ctx.beginPath();
    ctx.moveTo(cities[bestPath[0]].x, cities[bestPath[0]].y);
    for (let i = 1; i < bestPath.length; i++) {
      ctx.lineTo(cities[bestPath[i]].x, cities[bestPath[i]].y);
    }
    ctx.strokeStyle = "rgba(255, 0, 0, 1)"; // 鮮紅色
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawCities() {
  for (let i = 0; i < cities.length; i++) {
    let city = cities[i];
    ctx.beginPath();
    ctx.arc(city.x, city.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#000000";
    ctx.fill();

    //標示城市編號
    ctx.fillStyle = "white";
    ctx.font = "8px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(i, city.x, city.y);
  }
}

function drawInfo() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, 220, 60);

  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`世代: ${generationCounter}`, 10, 10);
  ctx.fillText(`目前最佳路徑長度: ${bestPathLength.toFixed(2)}`, 10, 35);
}

function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "繼續" : "暫停";
  pauseBtn.classList.toggle("paused", isPaused);
  if (!isPaused) {
    mainLoop();
  }
}

function restartSimulation() {
  if (requestID) {
    cancelAnimationFrame(requestID);
  }

  updateConfigFromUI();

  cities = [];
  distances = [];
  pheromones = [];
  ants = [];
  bestPath = null;
  bestPathLength = Infinity;
  generationCounter = 0;
  isPaused = false;
  pauseBtn.textContent = "暫停";
  pauseBtn.classList.remove("paused");

  setup();
}

//初始化函式 (Setup)
function setup() {
  if (config.numCities < 2) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "red";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("錯誤：城市數量必須至少為 2", W / 2, H / 2);
    return;
  }

  // 隨機生成城市
  for (let i = 0; i < config.numCities; i++) {
    cities.push({
      x: Math.random() * (W - 40) + 20,
      y: Math.random() * (H - 40) + 20,
    });
  }

  // 計算距離矩陣和費洛蒙矩陣
  distances = new Array(config.numCities)
    .fill(0)
    .map(() => new Array(config.numCities).fill(0));
  pheromones = new Array(config.numCities)
    .fill(0)
    .map(() => new Array(config.numCities).fill(1.0));

  for (let i = 0; i < config.numCities; i++) {
    for (let j = i; j < config.numCities; j++) {
      let dx = cities[i].x - cities[j].x;
      let dy = cities[i].y - cities[j].y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      distances[i][j] = dist;
      distances[j][i] = dist;
    }
  }

  //建立螞蟻物件
  for (let i = 0; i < config.numAnts; i++) {
    ants.push(new Ant());
  }

  // 啟動動畫迴圈
  mainLoop();
}

function mainLoop() {
  if (isPaused) {
    cancelAnimationFrame(requestID);
    return;
  }

  //清空
  ctx.clearRect(0, 0, W, H);

  //繪製所有圖層 (費洛蒙在最底層)
  drawPheromones();
  drawBestPath();
  drawCities();

  //更新並繪製每一隻螞蟻
  let allAntsFinished = true;
  for (let ant of ants) {
    ant.update();
    ant.draw(ctx);
    if (!ant.tourComplete) {
      allAntsFinished = false; //有螞蟻還沒跑完，就繼續
    }
  }

  drawInfo();

  //檢查是否結束
  if (allAntsFinished) {
    generationCounter++;

    //找最佳路徑
    for (let ant of ants) {
      if (ant.pathLength < bestPathLength) {
        bestPathLength = ant.pathLength;
        bestPath = ant.path;
      }
    }

    //更新費洛蒙
    updatePheromones(ants);

    //重設所有螞蟻，開始下一輪
    for (let ant of ants) {
      ant.reset();
    }
  }

  // 下一幀
  requestID = requestAnimationFrame(mainLoop);
}

// Initial start
restartSimulation();
