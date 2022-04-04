
const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
const pug = require('pug');
const path = require('path');
const { nanoid } = require('nanoid');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('crosswords.db');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'public'));

app.use('/', express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: "crossword" + toString(Date.getTime),
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false}))

// app.use('/', (req, res, next) => {
//     if(req.path != '/puzzle') {
//         res.redirect('/puzzle');
//     }
//     else {
//         next();
//     }
// });

app.get("/home", (req, res) => {
    db.all("SELECT * FROM crosswords", (err, rows) => {
        if (err) {
            console.log(err);
            res.status(400).json("failed");
        }
        else {
            res.render("home", {crosswords : rows});
        }
    });    
});

app.get("/editing/:id", (req, res) => {
    const query = "SELECT puzzle FROM crosswords WHERE id = '" + req.params.id + "'";

    console.log(query);
    db.get(query, (err, row) => {
        if (err) {
            console.log(err);
            res.status(400).json("failed");
        }
        else {
            crossword = JSON.parse(row.puzzle);
            res.redirect("/");
        }
    });
});

app.get("/new", (req, res) => {
    insertInto("crosswords", ["id"], req.body, res);
    crossword = {title : "Title"};
    crossword.grid = {width : 5, height : 5, cells : [], symmetry : false};
    crossword.clues = {across : {}, down : {}};
    res.redirect("/");
})

app.get("/", (req, res) => {
    makeGrid();
    res.render("puzzle", {crossword : crossword});
});

app.post('/command', (req, res) => {
    console.log(req.body);

    if(req.body.command == "resize") {
        crossword.grid.width = req.body.width;
        crossword.grid.height = req.body.height;
        makeGrid();  
        res.redirect("/");
    }
    else if(req.body.command == "symmetry") {
        crossword.grid.symmetry = !crossword.grid.symmetry;
        res.send(crossword);
    }
    else if(req.body.command == "toggleBlack") {
        //console.log(req.body);

        if(crossword.grid.symmetry &&
            !(req.body.y == (crossword.grid.height - 1) / 2 && req.body.x == (crossword.grid.width - 1) / 2)) {
                crossword.grid.cells[crossword.grid.height - req.body.y - 1][crossword.grid.width - req.body.x - 1].black = 
                    !crossword.grid.cells[req.body.y][req.body.x].black

                // console.log("symmetry");
        }

        crossword.grid.cells[req.body.y][req.body.x].black = !crossword.grid.cells[req.body.y][req.body.x].black;
        //console.log(crossword.grid.cells[req.body.y][req.body.x])

        makeGrid();
        res.send(crossword);
    }
    else if(req.body.command == "letter") {
        crossword.grid.cells[req.body.y][req.body.x].letter = req.body.letter.toUpperCase();
        //console.log(crossword.grid.cells[req.body.y][req.body.x].letter);
        res.send(crossword);
    }
    else if(req.body.command == "saveClue") {
        console.log(req.body.clue);
        crossword.clues[req.body.direction][req.body.index].text = req.body.clue;

        res.send(crossword);
    }
    else if(req.body.command == "saveTitle") {
        crossword.title = req.body.title;
        res.send(crossword);
    }
    else if(req.body.command == "toggleSpecial") {
        crossword.grid.cells[req.body.y][req.body.x].special = !crossword.grid.cells[req.body.y][req.body.x].special;
        res.send(crossword);
    }
    else if(req.body.command == "reset") {
        crossword.grid.cells = [];
        crossword.clues = {across : {}, down : {}};
        res.redirect("/");
    }
    else if(req.body.command == "save") {
        update("crosswords", {title : crossword.title, author : "me", puzzle : JSON.stringify(crossword)}, req, res);
    }
});

app.get("/grid", (req, res) => {
    res.send(crossword);
});

app.listen(port, () => {
    console.log(`Crossword Server at http://localhost:${port}`)
});

//––––––––––––––––––––––– EDITOR CODE ––––––––––––––––––––––––––

let crossword = {title : "Title"};
crossword.grid = {width : 5, height : 5, cells : [], symmetry : false};
crossword.clues = {across : {}, down : {}};

// function makeGrid() {
//     crossword.grid.cells = crossword.grid.cells.slice(0, crossword.grid.height);
//     let num = 1;
//     let newClues = {across : {}, down : {}};

//     for(let y = 0; y < crossword.grid.height; y ++) {
//         if (crossword.grid.cells[y]) {
//             crossword.grid.cells[y] = crossword.grid.cells[y].slice(0, crossword.grid.width);
//         }
//         else {
//             crossword.grid.cells[y] = [];
//         }

//         for(let x = 0; x < crossword.grid.width; x ++) {
//             // console.log("init: ");
//             // console.log(crossword.grid.cells[y][x]);

//             cell = crossword.grid.cells[y][x];

//             if(!cell) {
//                 cell = {
//                     x : x,
//                     y : y,
//                     letter : null,
//                     number : null,
//                     black : false,
//                     special : false
//                 }
//             }

//             cell.number = null;

//             let index = y * crossword.grid.width + x;
//             if(cell.black) {
//                 cell.letter = null;
//                 cell.special = false;
//             }
//             else {
//                 if(y == 0 ||  crossword.grid.cells[y - 1][x].black || 
//                     x == 0 || crossword.grid.cells[y][x - 1].black) {
//                         cell.number = num;
//                         num ++;

//                         if(x == 0 || crossword.grid.cells[y][x - 1].black) {
//                             if(crossword.clues.across[index]) {
//                                 newClues.across[index] = crossword.clues.across[index];
//                                 newClues.across[index].number = cell.number;
//                             }
//                             else {
//                                 newClues.across[index] = {index : index, number : cell.number};
//                             }
//                         }
//                         if(y == 0 || crossword.grid.cells[y - 1][x].black) {
//                             if(crossword.clues.down[index]) {
//                                 newClues.down[index]= crossword.clues.down[index];
//                                 newClues.down[index].number = cell.number;
//                             }
//                             else {
//                                 newClues.down[index] = {index : index, number : cell.number};
//                             }
//                         }
//                 }
//             }   
//             crossword.grid.cells[y][x] = cell;
//         }
//     }
//     crossword.clues = newClues;
// }

function getAllFrom(table) {
    const query = "SELECT * FROM " + table;

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            res.status(400).json("failed");
        }
        else {
            console.log(rows);
            return(rows);
        }
    });
}

function getOneFrom(table, id, res) {
    const query = "SELECT * FROM " + table + " WHERE id = '" + id + "'";

    db.get(query, (err, row) => {
        if (err) {
            console.log(err);
            res.status(400).json("failed");
        }
        else {
            return(row);
        }
    });
}

function insertInto(table, variables, values, res) {
    let query = "INSERT INTO " + table + " (";
    query += variables.join() + ") VALUES (";

    let temp = [];
    for (let i = 0; i < variables.length; i ++) {
        temp.push("?");
    }
    query += temp.join() + ");"

    const newID = nanoid();
    let params = [newID];
    for (let i = 1; i < variables.length; i ++) {
        console.log(variables[i], " = ", values[variables[i]])
        params.push(values[variables[i]]);
    }

    console.log(query);
    console.log(params);

    db.run(query, params, (err) => {
        if (err) {
            console.log(err);
            res.status(400).json("failed");
        }
        else {
            return;
        }
    });
}

function update(table, values, res) {
    let query = "UPDATE " + table + " SET ";

    let temp = [];
    for (const i in params) {
        temp.push(params[i] + " = ?");
        params[i] = req.body[params[i]];
    }
    query += temp.join(", ") + " WHERE id = '" + req.params.id + "'";

    db.run(query, params, (err) => {
        if (err) {
            console.log(err);
            res.status(400).json("failed");
        }
        else {
            return;
        }
    });
}