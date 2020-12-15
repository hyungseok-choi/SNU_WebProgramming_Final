const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  name: String,
  key: String,

  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  maxExp: { type: Number, default: 100 },
  maxHP: { type: Number, default: 100 },
  HP: { type: Number, default: 100 },
  str: { type: Number, default: 3 },
  def: { type: Number, default: 2 },
  x: { type: Number, default: 3 },
  y: { type: Number, default: 1 },
  stradd: { type: Number, default: 0 },
  defadd: { type: Number, default: 0 },
  maxHPadd: { type: Number, default: 0 },
  statCount: { type: Number, default: 1 },
  items: [
    {
      name: String,
      quantity: {
        type: Number,
        default: 1,
      },
      str: Number,
      def: Number,
      maxHP: Number,
    },
  ],
})

schema.methods.incrementHP = function (val) {
  const hp = this.HP + val
  this.HP = Math.min(Math.max(0, hp), this.maxHP)
}

schema.methods.addstr = function (val) {
  this.stradd += val
}

schema.methods.adddef = function (val) {
  this.defadd += val
}

schema.methods.addmaxHP = function (val) {
  this.maxHPadd += val
}

schema.methods.monsterAtk = function (monster) {
  let damage = monster.str - this.def
  if (damage <= 0) {
    damage = Math.round(Math.random())
  }
  this.HP = this.HP - damage
  return damage
}

schema.methods.playerDie = function () {
  if (this.HP <= 0) {
    return 1
  } else {
    return 0
  }
}

schema.methods.playerInit = function () {
  this.HP = 10
  this.x = 9
  this.y = 0
  const num = this.items.length
  const randomNumber = Math.floor(Math.random() * num)
  this.items.splice(randomNumber, 1)
}

schema.methods.playerExpUP = function () {
  //this.exp += 50
}

schema.methods.playerLvUP = function () {
  if (this.exp >= this.maxExp) {
    this.maxHP += this.maxHP * 1.5
    this.HP = this.maxHP
    this.level += 1
    this.exp -= this.maxExp
    this.maxExp = Math.round((this.maxExp * 1.5))
  }
}

schema.methods.addCount = function () {
  this.statCount += 1;
}

const Player = mongoose.model('Player', schema)

module.exports = {
  Player,
}
