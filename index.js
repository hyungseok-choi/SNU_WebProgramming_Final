const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

const {
  constantManager,
  mapManager,
  itemManager,
  monsterManager,
  bossManager,
} = require('./datas/Manager');
const { Player } = require('./models/Player');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

mongoose.connect(
  'mongodb+srv://mud-user:mud123@cluster0.pfhgn.mongodb.net/db1?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.sendStatus(401);
  const [bearer, key] = authorization.split(' ');
  if (bearer !== 'Bearer') return res.sendStatus(401);
  const player = await Player.findOne({ key });
  if (!player) return res.sendStatus(401);

  req.player = player;
  next();
};

app.get('/', (req, res) => {
  res.render('index', { gameName: constantManager.gameName });
});

app.get('/game', (req, res) => {
  res.render('game');
});

app.post('/signup', async (req, res) => {
  const { name, password } = req.body;
  if(name === "고블린"){
    return res.send('수업중 사라진 고블린에게 조의를 표하자');
  }
  if (await Player.exists({ name })) {
    return res.send(name + '은 이미 웹프 드랍한 학생입니다...');
  }

  encryptedpw = crypto.createHash('sha512').update(password).digest('base64');

  const player = new Player({
    name,
    password: encryptedpw,
  });

  const key = crypto.randomBytes(24).toString('hex');
  player.key = key;

  await player.save();

  return res.send({ key });
});

app.post('/signin', async (req, res) => {
  const { name, password } = req.body;
  encryptedpw = crypto.createHash('sha512').update(password).digest('base64');

  const player = await Player.findOne({ name });
  if (!player) {
    return res.send('아이디를 확인해주세요!');
  } else if (player.password !== encryptedpw) {
    return res.send('비밀번호를 확인해주세요!');
  }

  const key = crypto.randomBytes(24).toString('hex');
  player.key = key;

  await player.save();

  return res.send({ key });
});

app.get('/stat', (req, res) => {
  res.render('stat');
});

app.post('/stat', authentication, async (req, res) => {
  const player = req.player;
  if (player.statCount <= 0) {
    return res.send({ player });
  }

  const str = Math.round(Math.random() * 3) + 3;
  const def = 8 - str;
  const hp = Math.round(Math.random() * 40) + 80;

  player.str = str;
  player.def = def;
  player.maxHP = player.HP = hp;
  player.subCount();
  await player.save();

  return res.send({ player });
});

app.post('/statfix', authentication, async (req, res) => {
  const player = req.player;
  player.statfix();
  await player.save();
  return res.send({ player });
});

app.post('/action', authentication, async (req, res) => {
  const { action } = req.body;
  const player = req.player;
  let event = null;
  let run = 0;
  if (action === 'query') {
    const field = mapManager.getField(req.player.x, req.player.y);

    return res.send({ player, field });
  } else if (action === 'move') {
    const direction = parseInt(req.body.direction, 0); // 0 북. 1 동 . 2 남. 3 서.
    let x = req.player.x;
    let y = req.player.y;
    if (direction === 0) {
      y += 1;
    } else if (direction === 1) {
      x += 1;
    } else if (direction === 2) {
      y -= 1;
    } else if (direction === 3) {
      x -= 1;
    } else {
      res.sendStatus(400);
    }
    let field = mapManager.getField(x, y);
    if (!field) res.sendStatus(400);
    player.x = x;
    player.y = y;

    const events = field.events;
    let _event = {};

    if (events.length > 0) {
      const probability = Math.random();
      if (probability * 100 < parseInt(events[0].percent)) {
        _event = events[0];
      } else if (probability * 100 < parseInt(events[1].percent)) {
        _event = events[1];
      } else {
        _event = { type: 'nothing' };
      }
      if (_event.type === 'battle' || _event.type === 'boss') {
        // 몬스터 선택
        let [randomMonster, middleName] = monsterManager.meetRandMonster();
        let monsterStr = randomMonster.str + (player.level - 1) * 5;
        let monsterDef = randomMonster.def + player.level * 3;
        let monsterHP = randomMonster.hp + player.level * 15;
        if (_event.type === 'boss') {
          [randomMonster, middleName] = bossManager.meetBoss();
          monsterStr = randomMonster.str + (player.level - 1) * 5;
          monsterDef = randomMonster.def + player.level * 3;
          monsterHP = randomMonster.hp + player.level * 20;
        }
        const playerStr = player.str + player.stradd;
        const playerDef = player.def + player.defadd;
        let description = `${middleName} ${randomMonster.name}이(가) 인사를 건네온다.<br>`;
        description += `(STR: ${monsterStr}, DEF: ${monsterDef}, HP : ${monsterHP})<br>`;
        // 사람 선공
        let round;
        for (round = 1; round <= 10; round++) {
          description += `=======ROUND ${round}=======<br>`;
          let attackDamage = playerStr - monsterDef;
          if (attackDamage <= 0) {
            attackDamage = Math.round(Math.random());
          }
          if (attackDamage > monsterHP) {
            attackDamage = monsterHP;
            monsterHP = 0;
          } else {
            monsterHP -= attackDamage;
          }
          description += `나(HP: ${player.HP}) ---공격${attackDamage}--> ${randomMonster.name}(HP: ${monsterHP})<br>`;
          if (monsterHP > 0) {
            let damage = monsterStr - playerDef;
            if (damage <= 0) {
              damage = Math.round(Math.random());
            }
            if (damage > player.HP) {
              damage = player.HP;
              player.HP = 0;
            } else {
              player.HP -= damage;
            }
            description += `나(HP: ${player.HP}) <--공격${damage}--- ${randomMonster.name}(HP: ${monsterHP})<br>`;
            if (player.HP <= (player.maxHP + player.maxHPadd) * 0.2) {
              round++;
              break;
            }
          }
          if (monsterHP <= 0) {
            description += '--------전투종료---------<br>';
            description += `${middleName} ${randomMonster.name}을(를) 쫓아냈다.<br>`;
            const exp = await player.playerExpUP();
            description += `${exp} exp를 획득했다!<br>`;
            const isLvUP = await player.playerLvUP();
            if (isLvUP) {
              description += '레벨이 올랐다!<br>기본 STR, DEF, HP 증가!<br>';
            }
            break;
          }
        }
        if (monsterHP > 0) {
          if (player.HP === 0) {
            description += '--------전투종료---------<br>';
            const itemLoss = await player.playerInit();
            description += `${middleName} ${randomMonster.name}의 공격으로 사망했습니다.<br>`;
            if (itemLoss.length) {
              description += `${itemLoss[0].name}을(를) ${randomMonster.name}에게 뺏겼다...<br>`;
            }
            description += `학교 정문으로 돌아갑니다.<br>`;
            field = mapManager.getField(9, 0);
          } else {
            if (player.HP <= (player.maxHP + player.maxHPadd) * 0.2) {
              description += '나의 체력이 20% 이하이다. ';
            } else {
              description += '10턴이 지났다. ';
            }
            description += `도망을 가야할까?`;
            run = 1;
          }
        }
        event = {
          description,
          monsterStr,
          monsterDef,
          monsterHP,
          monsterName: randomMonster.name,
          middleName,
          round,
        };
      } else if (_event.type === 'heal') {
        const healed = player.incrementHP();
        if (healed == 0) {
          event = {
            description: `HP가 충분하다! 더이상 커피를 먹으면 카페인 중독이 될지도?`,
          };
        } else {
          description = `커피를 마셔서 ${healed}만큼 회복했다.<br>`;
          if (player.maxHP + player.maxHPadd === player.HP) {
            description += `더이상 커피를 먹으면 카페인 중독이 될지도?`;
          }
          event = { description };
        }
      } else if (_event.type === 'item') {
        if (player.items.length > 14) {
          // Inventory의 개수는 15개로 한정한다 .
          event = { description: `가방이 가득찼다` };
        } else {
          const item = itemManager.getRandItem();
          let duplicate = false;
          for (let i = 0; i < player.items.length; i++) {
            if (player.items[i].name === item.name) {
              duplicate = true;
            }
          }
          if (duplicate) {
            event = { description: `${item.name}..? 이미 가지고 있다 ` };
          } else {
            event = {
              description: `지나가다가 ${item.name}을(를) 주웠다.`,
            };
            player.addstr(item.str);
            player.adddef(item.def);
            player.addmaxHP(item.maxHP);
            player.items.push({
              name: item.name,
              str: item.str,
              def: item.def,
              maxHP: item.maxHP,
              quantity: 1,
            });
          }
        }
      } else {
        event = {
          description: `아무일도 일어나지 않았다`,
        };
      }
    }

    await player.save();
    return res.send({ player, field, event, run });
  } else if (action === 'run') {
    const x = req.player.x;
    const y = req.player.y;
    let field = mapManager.getField(x, y);
    const runaway = parseInt(req.body.run, 0);
    let description = req.body.description;
    if (runaway === 4) {
      description += '<br> 무사히 도망 쳤다!<br>';
    } else {
      description += '<br>계속 싸웠다!<br>';
      const playerStr = player.str + player.stradd;
      const playerDef = player.def + player.defadd;
      const monsterStr = req.body.monsterStr;
      const monsterDef = req.body.monsterDef;
      const monsterName = req.body.monsterName;
      const middleName = req.body.middleName;
      let monsterHP = req.body.monsterHP;
      let round = req.body.round;

      while (round) {
        description += `=======ROUND ${parseInt(round)}=======<br>`;
        round++;
        let attackDamage = playerStr - monsterDef;
        if (attackDamage <= 0) {
          attackDamage = Math.round(Math.random());
        }
        if (attackDamage > monsterHP) {
          attackDamage = monsterHP;
          monsterHP = 0;
        } else {
          monsterHP -= attackDamage;
        }
        description += `나(HP: ${player.HP}) ---공격${attackDamage}--> ${monsterName}(HP: ${monsterHP})<br>`;
        if (monsterHP > 0) {
          let damage = monsterStr - playerDef;
          if (damage <= 0) {
            damage = Math.round(Math.random());
          }
          if (damage > player.HP) {
            damage = player.HP;
            player.HP = 0;
          } else {
            player.HP -= damage;
          }
          description += `나(HP: ${player.HP}) <--공격${damage}--- ${monsterName}(HP: ${monsterHP})<br>`;
          if (player.HP <= 0) {
            description += '--------전투종료---------<br>';
            break;
          }
        }
        if (monsterHP <= 0) {
          description += '--------전투종료---------<br>';
          description += `${middleName} ${monsterName}을(를) 쫓아냈다.<br>`;
          const exp = await player.playerExpUP();
          description += `${exp} exp를 획득했다!<br>`;
          const isLvUP = await player.playerLvUP();
          if (isLvUP) {
            description += '레벨이 올랐다!<br>기본 STR, DEF, HP 증가!<br>';
          }
          break;
        }
      }
      if (monsterHP > 0) {
        if (player.HP === 0) {
          const itemLoss = await player.playerInit();
          description += `${middleName} ${monsterName}의 공격으로 사망했습니다.<br>`;
          if (itemLoss.length) {
            description += `${itemLoss[0].name}을(를) ${monsterName}에게 뺏겼다...<br>`;
          }
          description += `학교 정문으로 돌아갑니다.<br>`;
          field = mapManager.getField(9, 0);
        }
      }
    }
    event = { description };
    await player.save();
    return res.send({ player, field, event, run });
  }
});

// function getRandomitem() {

// }

app.listen(3000);
