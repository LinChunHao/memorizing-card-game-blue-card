// 宣告遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

// 24 種顏色卡片，各 2 張
const colorHEX = [
  '#F0F8FF', '#007FFF', '#0000FF', '#007BA7', '#2A52BE', '#0047AA', '#6495ED', '#000092', '#1560BD', '#1E90FF', '#00BFFF', '#B57EDC', '#191970', '#000080', '#CCCCFF', '#32127A', '#003399', '#00206A', '#4169E1', '#082567', '#4682B4', '#10098F', '#7FC3FF', '#C4D8E2'
]

const view = {

  // 回傳卡片的外層元素，只顯示卡背，接收一個 index 參數，將其存放在 dataset 中
  getCardElement(index) {
    return `
      <div data-index="${index}" class="card back">
      </div>
    `
  },

  // 當翻開卡片時，回傳卡片顏色，接收一個 index 參數，將其換算成卡片顏色
  getCardContent(index) {
    const colorHEXIndex = colorHEX[index % 24]
    return colorHEXIndex
  },

  // 接收一個 indexes 參數，是一個 index 的陣列
  // 用 map() 將每個 index 轉換成卡背元素，加到 #cards 內容裡
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("");
  },

  // 翻開卡片
  // 如果卡片的 class 有 back，則拿掉 back class 並將顏色加上去
  // 如果卡片的 class 沒有 back，則拿掉內層元素，並加上 back class
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
      card.classList.remove('back')
      card.style.backgroundColor = this.getCardContent(Number(card.dataset.index))
      return
    }
    card.classList.add('back')
    card.style.backgroundColor = null
    })

  },
  // 當卡片配對成功時，加上 paired class
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
      card.style.backgroundColor = null
    })
  },
  // 更新 Score 畫面
  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`;
  },

  // 更新 Tried times 畫面
  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`;
  },
  
  // 卡片加上嘗試失敗的動畫，先加上一個 animation class，動畫結束後把 class 拿掉
  // 後面的 once: true 是指這個 event listener 在執行一次之後就會消失
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  // 卡片加上配對成功的動畫，先加上一個 animation class，動畫結束後把 class 拿掉
  appendRightAnimation(...cards) {
    cards.map(card => {
      card.classList.add('right')
      card.addEventListener('animationend', event => event.target.classList.remove('right'), { once: true })
    })
  },

  // 顯示遊戲結束的畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  },

}

const model = {
  // 儲存翻開卡片資料
  revealedCards: [],

  // 檢查 model 內記錄的兩張卡片是否數字相同
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 24 === this.revealedCards[1].dataset.index % 24
  },

  score: 0,

  triedTimes: 0

}

const controller = {
  // 當前狀態，一開始設定為 FirstCardAwaits
  currentState: GAME_STATE.FirstCardAwaits,

  // 呼叫 view，並傳入一個隨機 48 數字的陣列
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(48))
  },

  // 在點擊卡片時，依照不同的狀態，會執行不同的動作
  dispatchCardAction(card) {
    // 不是牌背狀態的卡片，點了不執行動作
    if (!card.classList.contains('back')) {
      return
    }
    // 在 FirstCardAwaits 狀態點擊卡片的話，會將卡片翻開，然後進入 SecondCardAwaits 狀態
    switch (this.currentState) {

      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.appendRightAnimation(...model.revealedCards)
          setTimeout(this.pairCards, 1000)
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1500)
        }
        break
    }
  },

  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  },

  pairCards() {
    view.pairCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
    if (model.score === 240) {
      controller.currentState = GAME_STATE.GameFinished
      view.showGameFinished()
      return
    }
  },


}

const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

controller.generateCards()

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => 
    controller.dispatchCardAction(card)
  )
})