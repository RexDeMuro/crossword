let grid = {};
let clues = {};
let selected = {across : true, clue : {}};
let whereClicked = null;

fetch("/grid")
.then(response => response.json())
.then(data => {
    grid = data.grid;
    clues = data.clues;
    resizePuzzle();
    refreshPuzzle();
    refreshColors();

});

function cellClicked(x, y) {
    if(selected.editing == "clue") {
        action({command : "saveClue", direction : selected.across ? "across" : "down", 
                index: selected.clue.index, clue : selected.clue.element.lastChild.textContent});
        selected.editing = null;
    }
    else if(selected.editing == "title") {
        action({command : "saveTitle", title: document.getElementById("title").textContent});
        selected.editing = null;
    }


    //double click
    if(selected.x == x && selected.y == y) {
        //toggle across
        selected.across = !selected.across;
        //console.log(selected.across);
    }
    else {
        selected.x = x;
        selected.y = y;
        //console.log("selected" + selected.x + ", " + selected.y)
    }

    if (grid.cells[y][x].black) {
        selected.clue = {};
    }
    else {
        while(grid.cells[y] && grid.cells[y][x] && !grid.cells[y][x].black) {
            if(selected.across) {
                x += -1;
            }
            else {
                y += -1;
            }
        }
        selected.clue = clues[selected.across ? "across" : "down"][(selected.across ? y : y + 1) * grid.width + (selected.across ? x + 1 : x)];
        //console.log(selected.clue.index);
        findSelectedClue();
        console.log(selected.clue.element.offsetTop);
        let clueList = document.getElementById(selected.across ? "across" : "down").lastChild
        clueList.scrollTo({top: (selected.clue.element.offsetTop - clueList.offsetHeight), behavior: "smooth"});
        console.log(clueList.offsetHeight);
        console.log(document.getElementById(selected.across ? "across" : "down").lastChild.scrollTop)
        //console.log(selected.clue);
    }
    refreshColors();

    whereClicked = "cell";
}

function clueClicked(index, across) {
    whereClicked = "clue";
    //\console.log(number + " " + across);

    if(!(selected.clue.index == index && selected.across == across)) {
        if(selected.editing == "clue") {
            selected.clue.element.lastChild.contentEditable = "false";
            action({command : "saveClue", direction : selected.across ? "across" : "down", 
                index: selected.clue.index, clue : selected.clue.element.lastChild.textContent});
            selected.editing = null;
        }

        selected.clue = clues[across ? "across" : "down"][index];
        selected.across = across;
        //console.log(across);

        findSelectedClue();
        //console.log(selected.clue.element.lastChild.isContentEditable);
        selected.clue.element.lastChild.contentEditable = true;
        //console.log(selected.clue.element.lastChild.isContentEditable);
        //console.log(selected.clue.element);
        
        for(let row of grid.cells) {
            for(let cell of row) {
                //console.log(cell.number + " =? " + number)
                if ((cell.y * grid.width + cell.x) == index) {
                    selected.x = cell.x;
                    selected.y = cell.y;
                    //console.log(selected);

                    refreshColors();
                    return;
                }
            }
        }
    }
    else {
        console.log("reclicked");
        selected.editing = "clue";
        selected.clue.element.lastChild.contentEditable = "true";
        selected.clue.element.lastChild.style.cursor = "text";
        if(selected.clue.element.lastChild.textContent == "_______") {
            selected.clue.element.lastChild.textContent = "";
        }
        refreshColors();
    }
}

function titleClicked() {
    whereClicked = "title";
    selected.editing = "title";
    console.log("titleClicked");
}

function bodyClicked() {
    console.log(selected.editing);
    console.log(whereClicked);
    if((whereClicked != "clue" && selected.editing == "clue") || 
        (whereClicked != "title" && selected.editing == "title")) {
            if(selected.editing == "title") {
                action({command : "saveTitle", title: document.getElementById("title").textContent});
            }
            else {
                selected.clue.element.lastChild.contentEditable = "false";
                action({command : "saveClue", direction : selected.across ? "across" : "down", 
                    index: selected.clue.index, clue : selected.clue.element.lastChild.textContent});
            }  
            selected.editing = null;
    }
    else if(!whereClicked) {
        //console.log("clearing selected");
        selected = {across : true, clue : {}};
        refreshColors();
    }

    whereClicked = null;
}

document.onkeydown = (event) => {
    if (selected.x != null && selected.y != null) {
        key = event.key
        //console.log(key);

        if(!selected.editing) {
            if (key == "Shift") {
                action({command : "toggleBlack", x : selected.x, y : selected.y});   
                selected.clue = {};  
                refreshColors(); 
            }
            else if(key.match("Arrow\\.?")) {
                if(key == "ArrowRight" && selected.x < (grid.width - 1)) {
                    selected.x = selected.x + 1;
                }
                else if(key == "ArrowLeft" && selected.x > 0) {
                    selected.x = selected.x - 1;
                }
                else if(key == "ArrowUp" && selected.y > 0) {
                    selected.y = selected.y - 1;
                }
                else if(key == "ArrowDown" && selected.y < (grid.height - 1)) {
                    selected.y = selected.y + 1;
                }

                selected.clue = clues[selected.across ? "across" : "down"][selected.across ? (selected.y * grid.width) : selected.x];
                findSelectedClue();
            }
            else if (key == " ") {
                selected.across = !selected.across;
                selected.clue = clues[selected.across ? "across" : "down"][selected.across ? (selected.y * grid.width) : selected.x];
                findSelectedClue();
            }
            else if(!grid.cells[selected.y][selected.x].black) {
                if ((key.match(/[a-z]/i) && key.length == 1)) {
                    //console.log("letter")
                    action({command : "letter", x : selected.x, y : selected.y, letter : key});
                    
                    if(selected.across && selected.x < grid.width - 1 && !grid.cells[selected.y][selected.x + 1].black) {
                        selected.x = selected.x + 1
                    }
                    else if(!selected.across && selected.y < grid.height - 1 && !grid.cells[selected.y + 1][selected.x].black) {
                        selected.y = selected.y + 1
                    }
                }
                else if(key == "Backspace") {
                    action({command : "letter", x : selected.x, y : selected.y, letter : ""});
                    if(selected.across && selected.x != 0 && grid.cells[selected.y][selected.x - 1] && !grid.cells[selected.y][selected.x - 1].black) {
                        selected.x = selected.x - 1
                    }
                    else if(!selected.across && selected.y != 0 && grid.cells[selected.y - 1] && !grid.cells[selected.y - 1][selected.x].black) {
                        selected.y = selected.y - 1
                    }
                }
                else if(key == "Meta") {
                    action({command : "toggleSpecial", x : selected.x, y : selected.y});
                }
            }
            refreshColors();
        }
        else if (key == "Enter") {
            if(selected.editing == "clue") {
                action({command : "saveClue", direction : selected.across ? "across" : "down", 
                    index: selected.clue.index, clue : selected.clue.element.lastChild.textContent});
                selected.clue.element.lastChild.contentEditable = "false";
            }
            else if (selected.editing == "title") {
                action({command : "saveTitle", title : document.getElementById("title").textContent})
            }
            selected.editing = null;
        }
    }
}

function action(body) {
    fetch("/command", {
        method: "post",
        headers : {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        grid = data.grid;
        clues = data.clues;

        refreshPuzzle();
    })
}

function refreshPuzzle() {
    gridElement = document.getElementById("grid");

    for(let row of grid.cells) {
        for(let cell of row) {
            cellElement = document.getElementById("grid").children[grid.width*cell.y + cell.x];
            // console.log(cellElement);
            //console.log(cell);
            cellElement.firstChild.textContent = cell.number;
            cellElement.children[1].textContent = cell.letter;

            let cellTextElement = document.getElementById("grid").children[grid.width*cell.y + cell.x].lastChild;
            if(grid.cells[cell.y][cell.x].special) {
                cellTextElement.style.border = "2px solid black";
                cellTextElement.style["border-radius"] = "100%"
            }
            else {
                cellTextElement.style.border = "none";
            }
        }
    }

    refreshClues("across");
    refreshClues("down");

    findSelectedClue();
    refreshColors();
}

function refreshColors(hoverX, hoverY) {
    let onSelectedWord = false;
    for(let row of grid.cells) {
        for(let cell of row) {
            let cellElement = document.getElementById("grid").children[grid.width*cell.y + cell.x];

            if (cell.black) {
                cellElement.style["background-color"] = "black";

                //end selected clue
                if(onSelectedWord && ((selected.across && cell.y == selected.y) ||
                    (!selected.across && cell.x == selected.x))) {
                        onSelectedWord = false;
                }
            }
            else {
                cellElement.style["background-color"] = "white";

                // color selected clue
                if((selected.clue && (cell.y * grid.width + cell.x) == selected.clue.index) || 
                (onSelectedWord && ((selected.across && cell.y == selected.y) ||
                (!selected.across && cell.x == selected.x)))) {
                    cellElement.style["background-color"] = "#d4ecff";
                    onSelectedWord = true;
                }

                if (cell.x == hoverX && cell.y == hoverY) {
                    cellElement.style["background-color"] = "#a7d8ff";
                }
            }

            if(cell.x == selected.x && cell.y == selected.y) {
                cellElement.style["background-color"] = cell.black ? "#3d3d3d" : "#ffda00";
            }
        }
        if(selected.across) {
            onSelectedWord = false;
        }
    }

    if(selected.clue) {
        document.querySelectorAll(".clue").forEach(clue => {
            if(clue == selected.clue.element) {
                clue.style["background-color"] = "#a7d8ff";
            }
            else {
                clue.style["background-color"] = "white";
            }
        });
    }
}

function refreshClues(direction) {
    clueList = document.querySelector("#" + direction + " > .clueList");
    //console.log(clueList);

    while(clueList.firstChild) {
        clueList.removeChild(clueList.firstChild);
    }

    for(let index in clues[direction]) {
        //console.log(clues[direction][index]);
        let clue = document.createElement("li")
        clue.setAttribute("class", "clue");
        clue.setAttribute("onclick", "clueClicked(" + index + ", " + (direction == "across") + ")");
        clue.appendChild(document.createElement("p"));
        clue.firstChild.setAttribute("class", "clueNumber");
        clue.appendChild(document.createElement("p"));
        clue.lastChild.setAttribute("class", "clueText");

        clue.firstChild.textContent = clues[direction][index].number;
        clue.lastChild.textContent = clues[direction][index].text || "_______";

        clueList.appendChild(clue);
    }
}

window.onresize = resizePuzzle;

function resizePuzzle() {
    //console.log("onresize");
    gridElement = document.getElementById("grid");
    let cellSize = (window.innerWidth * 0.6) / (grid.width) < (window.innerHeight * 0.75) / (grid.height) ?
        (window.innerWidth * 0.6) / (grid.width) : (window.innerHeight * 0.75) / (grid.height);
    //console.log(cellSize);

    gridElement.style["grid-template-columns"] = "repeat(" + grid.width + ", " + cellSize + "px)";
    gridElement.style["grid-template-rows"] = "repeat(" + grid.height + ", " + cellSize + "px)";
    // gridElement.style.width = cellSize * grid.width + "px";
    // gridElement.style.height = cellSize * grid.height + "px";

    document.querySelectorAll(".letter").forEach(letter => {
        letter.style["font-size"] = cellSize * 0.7 + "px";
    });

    document.querySelectorAll(".gridNumber").forEach(number => {
        number.style["font-size"] = cellSize * 0.3 + "px";
    });

    let puzzleArea = document.getElementById("puzzle");
    let header = document.querySelector("header");

    puzzleArea.style["height"] = (window.innerHeight - header.offsetHeight) + "px";
}

function findSelectedClue() {
    document.querySelectorAll(".clue").forEach(clue => {
        if(clue.firstElementChild.textContent == selected.clue.number && 
            clue.parentElement.parentElement.id == (selected.across ? "across" : "down")) {
            selected.clue.element = clue;
            return;
        }
    })
}