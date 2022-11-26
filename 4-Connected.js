


const human_button       = document.getElementsByClassName("vs-human")[0];
const robot_button       = document.getElementsByClassName("vs-robot")[0];
const start_button       = document.getElementsByClassName("start")[0];
const difficulty_section = document.getElementsByClassName("difficulty-section")[0];
const time               = document.getElementsByClassName("time")[0];
const lines              = document.getElementsByClassName("line");

const ROW    = 6;
const COLUMN = 7;
const TIE    = 0;
const EMPTY  = 0;
const HUMAN  = 1;
const AI     = 2;
const EASY   = 2;
const MEDIUM = 3;
const HARD   = 4;

let round            = AI;
let start_indicator  = true;
let blinking_counter = 6;
let animation_swap   = 1;
let game_time        = [0, 0];
let winning_chain    = [[0, 0], [0, 0], [0, 0], [0, 0]];
let count_down_interval;
let interval;
let player_swap = 1;

let difficulty = HUMAN;
let start      = false;

//Directions
let dx = [0, 0, 1, -1, -1, 1, -1, 1];
let dy = [-1, 1, -1, 1, -1, 1, 0, 0];
let swap   = 1;
let winner = 0;

//Deifne board and initialize it as empty board
let board = new Array(ROW);
for (let i = 0; i < ROW; i++) {
    board[i] = new Array(COLUMN);
    for (let j = 0; j < COLUMN; j++) {
        board[i][j] = EMPTY;
    }
}

const is_valid_point = (x, y) => {
    return x >= 0 && x < ROW && y >= 0 && y < COLUMN;
};

const shift = (arr) => {
    for (let i = 0; i < 3; i++) {
        arr[i] = arr[i + 1];
    }
}

const check = (x, y, node) => {
    let player = node[x][y];
    let count;
    for (let i = 0; i < 8; i++) { // loop in directions 
        if (i % 2 == 0) count = 0;
        else {
            count -= 1;
            shift(winning_chain);
        }
        let newX = x;
        let newY = y;
        while (is_valid_point(newX, newY) && node[newX][newY] == player && count < 4) {
            winning_chain[count] = [newX, newY];
            count++;
            newX += dx[i];
            newY += dy[i];
        }
        if (count >= 4) return player;
    }
    return 0;
};

const eval_three_connect = (x, y, node, player) => {
    let score = 0;
    for(let i = 0; i < 8; i++) {
        if (
         is_valid_point(x + 3 * dx[i], y + 3 * dy[i]) &&
         node[x + 1 * dx[i]][y + 1 * dy[i]] == player &&
         node[x + 2 * dx[i]][y + 2 * dy[i]] == player &&
         node[x + 3 * dx[i]][y + 3 * dy[i]] == 0
        ) score += 100;
    }
    return score;
};

const eval_two_connect = (x, y, node, player) => {
    let score = 0;
    for(let i = 0; i < 8; i++) {
        if (
         is_valid_point(x + 3 * dx[i], y + 3 * dy[i]) &&
         node[x + 1 * dx[i]][y + 1 * dy[i]] == player &&
         node[x + 2 * dx[i]][y + 2 * dy[i]] == 0
        ) 
        score++;
    }
    return score;
};

const evaluation = (node) => {
    let score_AI    = 0;
    let score_Human = 0;
    for (let i = 0; i < ROW; i++)
        for (let j = 0; j < COLUMN; j++) {
            let player = node[i][j];
            if (player == EMPTY) continue;
            else if(player == AI) {
                score_AI    += eval_two_connect(i, j, node, AI) + eval_three_connect(i, j, node, AI);
            }
            else if(player == HUMAN) {
                score_Human += eval_two_connect(i, j, node, HUMAN) + eval_three_connect(i, j, node, HUMAN);
            }
        }
    return score_AI - score_Human;
};

const is_available_column = (c, node) => {
    return node[ROW - 1][c] == 0;
}

const add_to_column = (c, player,  node) => {
    for(let i = 0; i < ROW; i++) {
        if (node[i][c] == EMPTY) {
            node[i][c] = player;
            return node;
        }
    }
}

const is_game_over = (node) => {
    for (let i = 0; i < ROW; i++) {
        for (let j = 0; j < COLUMN; j++) {
            let f = check(i, j, node);
            if (f != 0) return [1, f];
        }
    }
    for (let i = 0; i < 7; i++) {
        if (is_available_column(i, node)) return [0, 0];
    }
    return [1, 0];
};

const alphabeta = (node, depth, alpha, beta, maximizingPlayer) => {
    let [is_terminal, win] = is_game_over(node);

    if (is_terminal) {
        if (win == TIE)   return [-1, 0];
        if (win == HUMAN) return [-1, -99998 * Math.pow(10, depth)];
        if (win == AI)    return [-1,  99999 * Math.pow(10, depth)];
    }
    if (depth == 0) {
        return [-1, evaluation(node)];
    }

    if (maximizingPlayer) {
        let best = [-1, -999980000]; // index, value
        for (let i = 0; i < 7; i++) {
            if (is_available_column(i, node)) {
                // possibe child
                let child = JSON.parse(JSON.stringify(node));
                child = add_to_column(i, AI, child);
                let value = alphabeta(child, depth - 1, alpha, beta, false);
                if (best[0] == -1 || value[1] > best[1]) {
                    best[0] = i;
                    best[1] = value[1];
                    alpha   = value[1];
                }
                if (beta <= alpha) {
                    break;
                }
            }
        }
        return best;
    } 
    else {
        let best = [-1, 999990000]; // index, value
        for (let i = 0; i < 7; i++) {
            if (is_available_column(i, node)) {
                // possibe child
                let child = JSON.parse(JSON.stringify(node));
                child = add_to_column(i, HUMAN, child);
                let value = alphabeta(child, depth - 1, alpha, beta, true);
                if (best[0] == -1 || value[1] < best[1]) {
                    best[0] = i;
                    best[1] = value[1];
                    beta = value[1];
                }
                if (beta <= alpha) {
                    break;
                }
            }
        }
        return best;
    }
};

const random_move = () => {
    let found = false;
    let rand_index;
    while (!found) {
        rand_index = Math.floor(Math.random() * 7);
        if (is_available_column(rand_index, board)) {
            found = true;
        }
    }
    setIndex(rand_index);
};

const AI_Move = () => {
    let [index, value] = alphabeta(board, 5, -1000000000, 1000000000, true);
    setIndex(index);
};

const easy_mode = () => {
    if (swap < 2) {
        AI_Move();
        swap++;
    } 
    else {
        random_move();
        swap = 1;
    }
};

const medium_mode = () => {
    if (swap < 3) {
        AI_Move();
        swap++;
    } 
    else {
        random_move();
        swap = 1;
    }
};

const hard_mode = () => {
    AI_Move();
};

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function robot_turn() {
    for (let i = 0; i < 7; i++) {
        let new_line = lines[i].cloneNode(true);
        lines[i].parentNode.replaceChild(new_line, lines[i]);
    
        lines[i].addEventListener("mouseover", function () {
            if (start) {
                if (is_available_column(i, board))
                    lines[i].style.backgroundColor = "var(--pointSelection)";
                else
                    lines[i].style.backgroundColor = "var(--robot)";
            }
        });
    
        lines[i].addEventListener("mouseout", function () {
            lines[i].style.backgroundColor = "var(--background)";
        });
    }
    await delay(500);

    if (difficulty == EASY) {
        easy_mode();
    }
    else if (difficulty == MEDIUM) {
        medium_mode();
    }
    else if (difficulty == HARD) {
        hard_mode();
    }

    for (let i = 0; i < COLUMN; i++) {
        lines[i].addEventListener("click", function () {
            let index = $(this).index();
            click_action(index);
        });
    }
};

const go_default = () => {
    if (!start) {
        start_indicator = true;
        start_button.children[0].innerHTML = "Start";
        if (difficulty == HUMAN) {
            human_button.style.backgroundColor = "var(--human-selected)";
            robot_button.style.backgroundColor = "var(--robot)";
            difficulty_section.classList.add("hidden");
        } 
        else {
            human_button.style.backgroundColor = "var(--human)";
            robot_button.style.backgroundColor = "var(--robot-selected)";
            difficulty_section.classList.remove("hidden");
            difficulty_section.children[0].children[0].style.transform = "matrix(2, 0, 0, 2, 0, -20)";
            difficulty_section.children[1].children[0].style.transform = "matrix(1, 0, 0, 1, 0, 0)";
            difficulty_section.children[2].children[0].style.transform = "matrix(1, 0, 0, 1, 0, 0)";
        }

        if (difficulty == EASY) {
            difficulty_section.children[0].children[0].style.transform = "matrix(2, 0, 0, 2, 0, -20)";
            difficulty_section.children[1].children[0].style.transform = "matrix(1, 0, 0, 1, 0, 0)";
            difficulty_section.children[2].children[0].style.transform = "matrix(1, 0, 0, 1, 0, 0)";
        } 
        else if (difficulty == MEDIUM) {
            difficulty_section.children[0].children[0].style.transform = "matrix(1, 0, 0, 1, 0, 0)";
            difficulty_section.children[1].children[0].style.transform = "matrix(2, 0, 0, 2, 0, -20)";
            difficulty_section.children[2].children[0].style.transform = "matrix(1, 0, 0, 1, 0, 0)";
        } 
        else {
            difficulty_section.children[0].children[0].style.transform = "matrix(1, 0, 0, 1, 0, 0)";
            difficulty_section.children[1].children[0].style.transform = "matrix(1, 0, 0, 1, 0, 0)";
            difficulty_section.children[2].children[0].style.transform = "matrix(2, 0, 0, 2, 0, -20)";
        }
    } 
    else {
        if (start_indicator) {
            start_button.style.backgroundColor = "var(--stop)";
            start_button.children[0].innerHTML = "Stop";
            start_indicator = false;
        }
    }
};

const start_timer = (start) => {
    let seconds, minutes;
    if (start) {
        let start_time = new Date().getTime();
        count_down_interval = setInterval(function () {
            let now = new Date().getTime();
            let distance = now - start_time;
            minutes = Math.floor(
                (distance % (1000 * 60 * 60)) / (1000 * 60)
            );
            seconds = Math.floor((distance % (1000 * 60)) / 1000);
            seconds = seconds.toLocaleString("en-US", {
                minimumIntegerDigits: 2,
                useGrouping: false,
            });
            start_button.children[0].innerHTML =
                "Stop " + minutes + ":" + seconds;
            game_time = [minutes, seconds];
        }, 1000);
    } 
    else {
        clearInterval(count_down_interval);
        start_button.style.backgroundColor = "var(--start)";
    }
};

const fill = (x, y, player) => {
    if (player == HUMAN)
        lines[y].children[x].children[0].style.backgroundColor = "var(--human-selected)";
    else if (player == AI)
        lines[y].children[x].children[0].style.backgroundColor = "var(--robot-selected)";
    else
        lines[y].children[x].children[0].style.backgroundColor = "var(--background)";
};

const winner_boxs = (x, y, clear) => {
    if (clear) {
        lines[y].children[x].style.backgroundColor = "var(--pointColors)";
    } 
    else
        lines[y].children[x].style.backgroundColor = "var(--winning-line)";
}


const blinking = (color) => {
    if (blinking_counter > 0) {
        animation_swap = 1 - animation_swap;
        for (let i = 0; i < 4; i++) {
            if (animation_swap == 1) {
                fill(5 - winning_chain[i][0], winning_chain[i][1], -1);
            }
            else {
                fill(5 - winning_chain[i][0], winning_chain[i][1], color);
            }
        }
        blinking_counter = blinking_counter - 1;
    }

}

const winning_animation = (color) => {
    if (winner == HUMAN && difficulty == HUMAN) {
        alert("Player 1 won in " + game_time[0] + ":" + game_time[1]);
    } 
    else if (winner == AI && difficulty == HUMAN) {
        alert("Player 2 won in " + game_time[0] + ":" + game_time[1]);
    } 
    else if (winner == AI) {
        alert("AI won in " + game_time[0] + ":" + game_time[1]);
    } 
    else
        alert("You won in " + game_time[0] + ":" + game_time[1]);

    for (let i = 0; i < 4; i++)
        winner_boxs(5 - winning_chain[i][0], winning_chain[i][1], false);

    animation_swap = 0;
    interval = setInterval(blinking, 750, color);
}

const setIndex = (index) => {
    let i;
    round = 3 - round;
    for (i = 0; i < 6; i++) {
        if (board[i][index] == 0) {
            board[i][index] = round;
            fill(5 - i, index, round);
            winner = check(i, index, board);
            if (winner != 0) {
                winning_animation(winner);
                start_action(false);
            }
            break;
        }
    }
};

const start_action = (clear) => {
    if (clear) {
        blinking_counter = 6;
        swap = 1;
        animation_swap = 1;
        clearInterval(interval);
        for (let i = 0; i < 4; i++)
            winner_boxs(5 - winning_chain[i][0], winning_chain[i][1], true);
        for (let i = 0; i < ROW; i++)
            for (let j = 0; j < COLUMN; j++) {
                lines[j].children[i].children[0].style.backgroundColor = "var(--background)";
                board[i][j] = 0;
            }
        if (!start) {
            player_swap = 1 - player_swap;
            if (player_swap == 0) {
                round = AI;
            } else if (player_swap == 1 && difficulty == HUMAN)
                round = HUMAN;
            else if (player_swap == 1) {
                round = HUMAN;
                robot_turn();
            }
        }
    }
    start = !start;
    start_timer(start);
    go_default();
    winner = 0;
};

human_button.addEventListener("click", function () {
    difficulty = HUMAN;
    go_default();
});

robot_button.addEventListener("click", function () {
    difficulty = EASY;
    go_default();
});

start_button.addEventListener("click", function () {
    start_action(true);
});

start_button.addEventListener("mouseover", function () {
    if (start) start_button.style.backgroundColor = "var(--stop-selected)";
    else start_button.style.backgroundColor = "var(--start-selected)";
});

start_button.addEventListener("mouseout", function () {
    if (start) start_button.style.backgroundColor = "var(--stop)";
    else start_button.style.backgroundColor = "var(--start)";
});

difficulty_section.children[0].addEventListener("click", function () {
    difficulty = EASY;
    go_default();
});

difficulty_section.children[1].addEventListener("click", function () {
    difficulty = MEDIUM;
    go_default();
});

difficulty_section.children[2].addEventListener("click", function () {
    difficulty = HARD;
    go_default();
});

const click_action = (index) => {
    if (start) {
        if (difficulty == HUMAN) setIndex(index);
        else if (difficulty != HUMAN && winner == 0) {
            setIndex(index);
            if (winner == 0) robot_turn();
        }
        if (winner != 0) start_action(false);
    }
}

for (let i = 0; i < COLUMN; i++) {
    lines[i].addEventListener("click", function () {
        let index = $(this).index();
        click_action(index);
    });

    lines[i].addEventListener("mouseover", function () {
        if (start) {
            if (is_available_column(i, board))
                lines[i].style.backgroundColor = "var(--pointSelection)";
            else lines[i].style.backgroundColor = "var(--robot)";
        }
    });

    lines[i].addEventListener("mouseout", function () {
        lines[i].style.backgroundColor = "var(--background)";
    });
}
