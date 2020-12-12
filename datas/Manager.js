const fs = require("fs");

class Manager {
  constructor() {}
}

class ConstantManager extends Manager {
  constructor(datas) {
    super();
    this.gameName = datas.gameName;
  }
}

class MapManager extends Manager {
  constructor(datas) {
    super();
    this.id = datas.id;
    this.fields = {};

    datas.fields.forEach((field) => {
      this.fields[`${field[0]}_${field[1]}`] = {
        x: field[0],
        y: field[1],
        description: field[2],
        canGo: field[3],
        events: field[4]
      };
    });
  }

  getField(x, y) {
    return this.fields[`${x}_${y}`];
  }
}

class MonsterManager extends Manager {
  constructor(datas) {
    super();
    this.monsters = {};
  
    datas.forEach((monster) => {
        this.monsters[`${monster.id}`] = {
          name: monster['name'],
          str: monster['str'],
          def: monster['def'],
          hp: monster['hp'],
          middleName: monster['middleName']
      }
    })
  };

  meetRandMonster() {
    const keys = Object.keys(this.monsters)
    const num = keys.length
    const randomNumber = Math.floor(Math.random() * (num));
    const randomMonster = this.monsters[keys[randomNumber]]
    const middleName = randomMonster.middleName[Math.floor(Math.random() * (randomMonster.middleName.length))]
    return [randomMonster, middleName];
  }


}



class ItemManager extends Manager {
  constructor(datas) {
    super();
    this.items = {};

    datas.forEach((item) => {
      this.items[`${item.id}`] = {
        name: item['name'],
        str: item['str'],
        def: item['def'],
        maxHP: item['maxHP']
      }
    })
  };

  getItem(name) {
    const keys = Object.keys(this.items)
    const num = keys.length;
    for(i = 0; i< num; i++){
      if(this.items[keys[i]].name === name){
        return this.items[keys[i]]
      }
    }
    return "Not Found"
  }

  getRandItem() {
    const keys = Object.keys(this.items)
    const num = keys.length;
    const randomNumber = Math.floor(Math.random() * (num));
    
    return this.items[keys[randomNumber]];
  }
  
}


const constantManager = new ConstantManager(
  JSON.parse(fs.readFileSync(__dirname + "/constants.json"))
);

const mapManager = new MapManager(
  JSON.parse(fs.readFileSync(__dirname + "/map.json"))
);

const itemManager = new ItemManager(
  JSON.parse(fs.readFileSync(__dirname + "/items.json"))
)

const monsterManager = new MonsterManager(
  JSON.parse(fs.readFileSync(__dirname + "/monsters.json"))
)

module.exports = {
  constantManager,
  mapManager,
  itemManager,
  monsterManager
};
