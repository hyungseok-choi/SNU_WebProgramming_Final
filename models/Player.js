const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  name: String,
  key: String,

  level: { type: Number, default: 1},
  exp: { type: Number, default: 0},
  maxHP: { type: Number, default: 10 },
  HP: { type: Number, default: 10 },
  str: { type: Number, default: 5 },
  def: { type: Number, default: 5 },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  stradd: { type: Number, default: 0 },
  defadd: { type: Number, default: 0 },
  maxHPadd: { type: Number, default: 0 },
  items: [{
    name: String,
    quantity: {
      type: Number,
      default: 1},
    str: Number,
    def: Number,
    maxHP: Number}]
});

schema.methods.incrementHP = function (val) {
  const hp = this.HP + val;
  this.HP = Math.min(Math.max(0, hp), this.maxHP);
};

schema.methods.addstr = function (val) {
  this.stradd = this.stradd + val;
};

schema.methods.adddef = function (val) {
  this.defadd = this.defadd + val;
};

schema.methods.addmaxHP = function (val) {
  this.maxHPadd = this.maxHPadd + val;
};



schema.methods.monsterAtk = function (monster) {
  let damage = monster.str - this.def;
  if (damage <= 0) {
    damage = Math.round(Math.random())
  }
  this.HP = this.HP - damage
  return damage
};

const Player = mongoose.model("Player", schema);

module.exports = {
  Player
};
