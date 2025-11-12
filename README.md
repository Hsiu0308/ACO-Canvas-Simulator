# ACO 視覺化

這是一個使用純 JavaScript、HTML 和 Canvas API 打造的蟻群演算法 (Ant Colony Optimization, ACO) 即時視覺化專案。

## 🚀 即時網站預覽 (Live Demo)

[**https://hsiu0308.github.io/ACO-Canvas-Simulator/**](https://hsiu0308.github.io/ACO-Canvas-Simulator/)

---

本專案旨在解決旅行商問題 (Traveling Salesman Problem, TSP)，並透過動畫展示演算法的運作過程：

- **螞蟻模擬：** 每隻螞蟻都是一個獨立的紅點，您可以看到牠們在城市之間移動。
- **費洛蒙路徑：** 螞蟻走過的路徑會留下費洛蒙（藍色線條），路徑會隨著費洛蒙濃度變粗、變不透明。
- **最佳路徑：** 演算法目前找到的最短路徑會以一條鮮紅色的線條標示。

![專案截圖](1.png)
_(上圖顯示了演算法剛開始時的混亂狀態)_
![專案截圖](2.png)
_(上圖顯示了演算法幾秒後的狀態)_

## ✨ 功能特色

- **即時模擬：** 數十隻螞蟻 (`Ant` 物件) 獨立運作，即時更新牠們的位置與狀態。
- **動態視覺化：** 費洛蒙路徑和當前最佳路徑會隨著每一代 (generation) 的演進而動態更新。
- **無需函式庫：** 100% 純 JavaScript，不依賴任何外部函式庫。
- **參數可調：** 可以在 `main.js` 檔案中輕鬆調整演算法的各項參數。

## 🚀 如何使用

本專案無需任何編譯或打包過程。

1.  下載 `index.html`, `style.css`, 和 `main.js` 這三個檔案。
2.  將這三個檔案放在同一個資料夾中。
3.  用任何現代網頁瀏覽器打開 `index.html` 檔案即可。

## ⚙️ 參數調整 (客製化)

您可以直接修改 `main.js` 檔案開頭的 `config` 物件來調整模擬的行為：

- `numAnts`：螞蟻的總數。
- `numCities`：隨機產生的城市數量。
- `alpha`：費洛蒙權重，控制費洛蒙的影響力。
- `beta`：距離權重，控制距離（啟發因子）的影響力。
- `evaporation`：費洛蒙揮發率，決定費洛蒙消失的速度。
- `q`：費洛蒙放置總量，一個常數。
- `antSpeed`：螞蟻（紅點）在畫布上的移動速度。

## 🔬 程式碼結構

- **`index.html`**
  - 提供 HTML 骨架。
  - 包含 `<canvas id="acoCanvas">` 元素。
  - 載入 `style.css` 和 `main.js`。
- **`style.css`**
  - 提供基本的頁面美化與畫布置中。
- **`main.js`**
  - **`config` 物件**：儲存所有可調參數。
  - **`class Ant`**：核心類別，每隻螞蟻都是一個實例。它管理自己的位置 (`x`, `y`)、路徑 (`path`)、已訪問城市 (`visited`) 以及移動邏輯 (`update()`)。
  - **`setup()`**：初始化函式。負責產生城市、計算距離矩陣、建立所有 `Ant` 物件，並啟動主迴圈。
  - **`mainLoop()`**：主要的動畫迴圈 (使用 `requestAnimationFrame`)。它負責：
    1.  清空畫布。
    2.  呼叫所有繪圖函式 (`drawPheromones`, `drawBestPath`, `drawCities`)。
    3.  更新並繪製每一隻螞蟻 (`ant.update()`, `ant.draw()`)。
    4.  檢查所有螞蟻是否都完成了旅程 (`allAntsFinished`)。
  - **世代管理**：當 `allAntsFinished` 為 `true` 時，`mainLoop` 會觸發 `updatePheromones()` (更新費洛蒙) 和 `ant.reset()` (重設所有螞蟻至新一輪)。
  - **演算法函式**：
    - `calculateProbs()`：計算螞蟻下一步的機率。
    - `updatePheromones()`：處理費洛蒙的揮發與放置。
  - **繪圖函式**：
    - `drawPheromones()`：繪製藍色的費洛蒙路徑。
    - `drawBestPath()`：繪製紅色的最佳路徑。
    - `drawCities()`：繪製黑色的城市圓點與編號。
