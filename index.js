const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const crypto = require("crypto");

const { constantManager, mapManager, itemManager } = require("./datas/Manager");
const { Player } = require("./models/Player");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

mongoose.connect(
  "mongodb+srv://mud-user:mud123@cluster0.pfhgn.mongodb.net/db1?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.sendStatus(401);
  const [bearer, key] = authorization.split(" ");
  if (bearer !== "Bearer") return res.sendStatus(401);
  const player = await Player.findOne({ key });
  if (!player) return res.sendStatus(401);

  req.player = player;
  next();
};

app.get("/", (req, res) => {
  res.render("index", { gameName: constantManager.gameName });
});

app.get("/game", (req, res) => {
  res.render("game");
});

app.post("/signup", async (req, res) => {
  const { name } = req.body;

  if (await Player.exists({ name })) {
    return res.status(400).send({ error: "Player already exists" });
  }

  const player = new Player({
    name,
    maxHP: 10,
    HP: 10,
    str: 5,
    def: 5,
    x: 0,
    y: 0
  });

  const key = crypto.randomBytes(24).toString("hex");
  player.key = key;

  await player.save();

  return res.send({ key });
});

app.post("/action", authentication, async (req, res) => {
  const { action } = req.body;
  const player = req.player;
  let event = null;
  if (action === "query") {
    const field = mapManager.getField(req.player.x, req.player.y);

    return res.send({ player, field });
  } else if (action === "move") {
    const direction = parseInt(req.body.direction, 0); // 0 북. 1 동 . 2 남. 3 서.
    let x = req.player.x;
    let y = req.player.y;
    if (direction === 0) {
      y -= 1;
    } else if (direction === 1) {
      x += 1;
    } else if (direction === 2) {
      y += 1;
    } else if (direction === 3) {
      x -= 1;
    } else {
      res.sendStatus(400);
    }
    const field = mapManager.getField(x, y);
    if (!field) res.sendStatus(400);
    player.x = x;
    player.y = y;

    const events = field.events;

    if (events.length > 0) {
      // TODO : 확률별로 이벤트 발생하도록 변경
      // 한 Field에 있는 event 개수는 최대 2개라고 가정
      if(Math.random()*100 > parseInt(events[0].percent)){
        const _event = events[0]
      } else {
        const _event = events[1]
      }
  
      if (_event.type === "battle") {
        // TODO: 이벤트 별로 events.json 에서 불러와 이벤트 처리

        event = { description: "늑대와 마주쳐 싸움을 벌였다." };
        player.incrementHP(-1);
      } else if (_event.type === "heal") {
        event = { description: "포션을 획득해 체력을 회복했다." };
        player.incrementHP(1);
        player.HP = Math.min(player.maxHP, player.HP + 1);
      } else if (_event.type === "item") {
        if(player.items.length > 10){ //Inventory의 개수는 10개로 한정한다 .
          event = { description: `가방이 가득찼다`}
        } else{
          const { name } = itemManager.getRandItem()
          event = { description: `땅에서 반짝이는 ${name}을 발견했다.`};
          console.log(event);
          player.items.push({name, quantity:1});
        }
      }
    }

    await player.save();
    return res.send({ player, field, event });
  }
});

// function getRandomitem() {
  
// }

app.listen(3000);
