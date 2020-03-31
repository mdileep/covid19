// STATE : PERSON
const HEALTHY = 0;
const INCUBATED = 1
const INFECTED = 2;
const DIED = 3;
const CREMATED = 4;

// STATE : COMMUNIY
const UNLOCKED = 0;
const LOCKED = 1;

//
const qNONE = 0;
const qINFECTED = 1;
const qCOMMINITY = 2;
const qSELF = 3;
//
let POPULATION = 0;
let GENERATION = 0;
let TICK = 0;
let persons = [];
let communities = [];
let SIZE = 600;
let RADIUS = 0;
let SAFE_DISTANCE = 0;
let INCUBATION_TIME = 0;
let COVERAGE = 0;
let RECOVERY_THRESHOLD = 0;

//
let SUFFERING_TIME = 0;
let CREMATION_TIME = 0;
//
let TOT_ALIVE = 0;
let TOT_INFECTIONS = 0;
let TOT_DEATHS = 0;
let TOT_POP = 0;
let TOP_INC = 0;
//
let SINCE = 0;
let VIRUS_DOB = 0;
let START_AT = 0;
let SEED_INFECTIONS = 0;
let QUARENTINE = 0;
let GRID_SIZE = 200;
let QUARENTINE_TYPE = 0;
let STOP = 0;
let REINFECT = false;
//
function initConfig() {
    frameCount = 0;
    POPULATION = 200;
    GENERATION = 0;
    TICK = 10;
    persons = [];
    communities = [];
    RADIUS = 10;
    SAFE_DISTANCE = RADIUS * 2;
    COVERAGE = RADIUS * 4;
    RECOVERY_THRESHOLD = 50;
    //
    INCUBATION_TIME = 7;
    SUFFERING_TIME = 21;
    CREMATION_TIME = 7;
    //
    TOT_ALIVE = 0;
    TOT_INFECTIONS = 0;
    TOT_DEATHS = 0;
    TOT_POP = 0;
    TOP_INC = 0;
    //
    START_AT = 40;
    VIRUS_DOB = 100;
    SINCE = 0;
    SEED_INFECTIONS = 10;
    QUARENTINE = 0;
    QUARENTINE_TYPE = 0;
    STOP = 0;
    REINFECT = false;
}

function updateStats() {

    TOT_ALIVE = 0;
    TOT_INFECTIONS = 0;
    TOT_DEATHS = 0;
    TOT_POP = 0;
    TOP_INC = 0;

    for (let i = 0; i < persons.length; i++) {
        const person = persons[i];

        if (person.state == HEALTHY) {
            TOT_ALIVE += 1;
            TOT_POP += 1;
            continue;
        }

        if (person.state == INCUBATED) {
            TOT_ALIVE += 1;
            TOP_INC += 1;
            continue;
        }

        if (person.state == INFECTED) {
            TOT_INFECTIONS += 1;
            TOT_POP += 1;
        }

        if (person.state == DIED || person.state == CREMATED) {
            TOT_DEATHS += 1;
        }
    }
}

let Community = function (id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.state = UNLOCKED;
    this.since = 0;
    this.tot = 0;
    this.immune = false;
}

let Person = function (id) {
    this.id = id;
    this.x = random(RADIUS, SIZE - RADIUS);
    this.y = random(RADIUS, SIZE - RADIUS);
    this.immunity = random(0, 100);
    this.state = HEALTHY;
    this.since = 0;
    this.died = 0;
}

function moveEveryWhere(person) {

    person.x += random(-1 * COVERAGE, COVERAGE);
    person.y += random(-1 * COVERAGE, COVERAGE);

    person.x = fit(person.x, RADIUS, SIZE - RADIUS);
    person.y = fit(person.y, RADIUS, SIZE - RADIUS);

}

function getCommunity(x, y) {
    const cx = Math.floor(x / GRID_SIZE, 0);
    const cy = Math.floor(y / GRID_SIZE, 0);

    for (let i = 0; i < communities.length; i++) {
        const c = communities[i];
        if (c.x == cx && c.y == cy) {
            return c;
        }
    }
    debugger;
    return null;
}

function moveToUnlockedLoc(person) {

    let x = person.x + random(-1 * COVERAGE, COVERAGE);
    let y = person.y + random(-1 * COVERAGE, COVERAGE);

    x = fit(x, RADIUS, SIZE - RADIUS);
    y = fit(y, RADIUS, SIZE - RADIUS);

    const community = getCommunity(x, y);
    if (community.state == LOCKED) {
        //  Try Again or Don't move.
        return;
    }

    person.x = x;
    person.y = y;
}

function moveInCommunity(person) {
    // Move with-in community only
    const cx = Math.floor(person.x / GRID_SIZE, 0);
    const lowerX = (cx * GRID_SIZE) + SAFE_DISTANCE;
    const upperX = ((cx + 1) * GRID_SIZE) - SAFE_DISTANCE;

    const cy = Math.floor(person.y / GRID_SIZE, 0);
    const lowerY = (cy * GRID_SIZE) + SAFE_DISTANCE;
    const upperY = ((cy + 1) * GRID_SIZE) - SAFE_DISTANCE;


    person.x += random(-1 * COVERAGE, COVERAGE);
    person.y += random(-1 * COVERAGE, COVERAGE);

    person.x = fit(person.x, lowerX, upperX);
    person.y = fit(person.y, lowerY, upperY);
}

function movePerson(person) {

    if (person.state == DIED) {
        return;
    }


    if (QUARENTINE_TYPE == qNONE) {
        moveEveryWhere(person);
        return;
    }

    if (QUARENTINE_TYPE == qINFECTED) {
        if (person.state == INFECTED && QUARENTINE >= 0 && GENERATION - person.since > QUARENTINE) {
            // No movement.
            return;
        }
        moveEveryWhere(person);
        return;
    }

    if (QUARENTINE_TYPE == qCOMMINITY) {

        const community = getCommunity(person.x, person.y);
        if (community.state == LOCKED) {
            //  No movement
            return;
        }
        moveToUnlockedLoc(person);
        //moveEveryWhere(person);
        return;
    }

    if (QUARENTINE_TYPE == qSELF) {

        if (QUARENTINE >= 0 && SINCE > 0 && GENERATION - SINCE > QUARENTINE) {
            //Stay at Home
            return;
        }

        moveEveryWhere(person);
        return;
    }


    return;
}

function transmitToPerson(person) {
    if (person.state != HEALTHY) {
        return;
    }

    if (person.immune) {
        return;
    }

    person.state = INCUBATED;
    person.since = GENERATION;
}

function infectPerson(person) {
    if (person.state != INCUBATED) {
        return;
    }

    if (GENERATION - person.since < INCUBATION_TIME) {
        return;
    }

    person.state = INFECTED;
    person.since = GENERATION;
}

function fit(x, lowerX, upperX) {

    if (x < lowerX) {
        return lowerX;
    }

    if (x > upperX) {
        return upperX;
    }

    return x;
}

function killPerson(person) {
    if (person.state !== INFECTED) {
        return;
    }
    if (GENERATION - person.since < SUFFERING_TIME) {
        return;
    }
    if (person.immunity >= RECOVERY_THRESHOLD) {
        // Don't Kiil
        return;
    }
    person.state = DIED;
    person.died = GENERATION;
}

function recoverPerson(person) {
    if (person.state !== INFECTED) {
        return;
    }
    if (GENERATION - person.since < SUFFERING_TIME) {
        return;
    }
    if (person.immunity < RECOVERY_THRESHOLD) {
        // Don't Recover
        return;
    }
    person.state = HEALTHY;
    person.since = 0;
    person.immune = REINFECT;
}

function crematePerson(person) {
    if (person.state !== DIED) {
        return;
    }
    if (GENERATION - person.died < CREMATION_TIME) {
        return;
    }
    person.state = CREMATED;
}

function cleanupPerson(person) {
    if (person.state !== DIED) {
        return;
    }
    person.state = CREMATED;
}

function addPersons(len) {
    for (let i = 0; i < len; i++) {
        const p = new Person(i + 1);
        persons.push(p);
    }
}

function movePersons() {
    for (let i = 0; i < persons.length; i++) {
        movePerson(persons[i]);
    }
}

function infectPersons() {
    for (let i = 0; i < persons.length; i++) {
        infectPerson(persons[i]);
    }
}

function recoverPersons() {
    for (let i = 0; i < persons.length; i++) {
        recoverPerson(persons[i]);
    }
}

function transmitToPersons(persons) {
    for (let i = 0; i < persons.length; i++) {
        transmitToPerson(persons[i]);
    }
}

function getDistance(p1, p2) {
    const L1 = (p1.x - p2.x) * (p1.x - p2.x);
    const L2 = (p1.y - p2.y) * (p1.y - p2.y);
    return Math.sqrt(L1 + L2);
}

function getAllNeighbors(i) {
    const neighbors = [];
    const me = persons[i];
    // It's a hit on performance.. use a better algorithm
    for (let j = 0; j < persons.length; j++) {
        if (i == j) {
            continue;
        }
        const neighbor = persons[j];
        const distance = getDistance(me, neighbor);

        if (distance >= SAFE_DISTANCE) {
            continue;
        }

        neighbors.push(neighbor)
    }
    return neighbors;
}

function transmit() {
    for (let i = 0; i < persons.length; i++) {
        const person = persons[i];
        if (!(person.state == INFECTED || person.state == INCUBATED)) {
            continue;
        }
        const neighbors = getAllNeighbors(i);
        transmitToPersons(neighbors);
    }
}

function killPersons() {
    for (let i = 0; i < persons.length; i++) {
        killPerson(persons[i]);
    }
}

function crematePersons() {
    for (let i = 0; i < persons.length; i++) {
        crematePerson(persons[i]);
    }
}

function cleanupPersons() {
    for (let i = 0; i < persons.length; i++) {
        cleanupPerson(persons[i]);
    }
}

function birthOfVirus() {
    SINCE = GENERATION;
    for (let i = 0; i < SEED_INFECTIONS; i++) {
        // Choose a random Person
        let person = random(persons);
        transmitToPerson(person);
    }
}


function worldSaved() {
    showMessage("End of Virus and Rise of Humans");
}

function worldDoomed() {
    showMessage("End of Humans and Rise of Virus");
}

function canStart(timeline) {
    return timeline < START_AT;
}

function run(timeline) {


    if (timeline == VIRUS_DOB) {
        birthOfVirus();
    }

    if (timeline > VIRUS_DOB && GENERATION > SINCE + INCUBATION_TIME && TOT_POP > 0 && TOT_INFECTIONS == 0) {
        cleanupPersons();
        lockCommunities();
        unlockCommunites();
        updateStats();
        STOP = 1;
        return;
    }

    if (timeline > VIRUS_DOB && GENERATION > SINCE + INCUBATION_TIME && TOT_POP == 0) {
        cleanupPersons();
        lockCommunities();
        unlockCommunites();
        updateStats();
        STOP = 2;
        return;
    }

    if (timeline % TICK == 0) {
        movePersons();
        transmit();
        GENERATION += 1;
        infectPersons();
        recoverPersons();
        killPersons();
        crematePersons();
        lockCommunities();
        unlockCommunites();
        updateStats();
    }
    return;
}

function stop() {
    if (STOP == 1) {
        worldSaved();
        noLoop();
        return;
    }

    if (STOP == 2) {
        worldDoomed();
        noLoop();
        return;
    }
}

function addCommunities() {
    for (let i = 0; i < SIZE / GRID_SIZE; i++) {
        for (let j = 0; j < SIZE / GRID_SIZE; j++) {
            const c = new Community(communities.length + 1, i, j);
            communities.push(c);
        }
    }
}


function lockCommunities() {
    if (QUARENTINE_TYPE != qCOMMINITY) {
        return;
    }
    for (let i = 0; i < persons.length; i++) {
        const person = persons[i];
        if (person.state == INFECTED && QUARENTINE >= 0 && GENERATION - person.since > QUARENTINE) {
            // MARK COMMINITY LOCKED
            const c = getCommunity(person.x, person.y);
            if (c.state == LOCKED) {
                // Already Locked
                continue;
            }
            c.state = LOCKED;
            c.since = GENERATION;
        }
    }
}

function unlockCommunites() {
    if (QUARENTINE_TYPE != qCOMMINITY) {
        return;
    }

    for (let i = 0; i < communities.length; i++) {
        const c = communities[i];
        c.tot = 0;
        // TODO: Improve performance
        for (let j = 0; j < persons.length; j++) {
            const p = persons[j];
            const c2 = getCommunity(p.x, p.y);
            if (c2.id != c.id) {
                continue;
            }
            if (p.state != INFECTED) {
                continue;
            }
            c.tot += 1;
        }

        if (c.tot == 0) {
            c.state = UNLOCKED;
            c.since = 0;
        }
    }
}

function init() {
    initConfig();
    refreshConfig();
    //
    refreshUI();
    addPersons(POPULATION);
    addCommunities();
    loop();
}

function getChecked(id) {
    return document.getElementById(id).checked;
}
function getSelected(id) {
    return document.querySelector(`input[name="${id}"]:checked`).value;
}

function refeshLabel(src) {
    document.getElementById("lbl_" + src.id).innerHTML = src.value;
}

function refeshQuarentineLabel(src) {
    if (src.value == -1) {
        document.getElementById("lbl_" + src.id).innerHTML = "Never";
        return;
    }
    if (src.value == 0) {
        document.getElementById("lbl_" + src.id).innerHTML = "Immediate";
        return;
    }
    refeshLabel(src);
}

function sliderChanged(e) {
    refeshLabel(e.target);
}

function qaurentineChanged(e) {
    refeshQuarentineLabel(e.target);
}

function toggleQuarentine(qt) {
    document.getElementById("qZone").style.visibility = (qt == 0) ? "hidden" : "visible";
}

function qaurentineTypeChanged(e) {
    var qt = parseInt(e.target.value);
    toggleQuarentine(qt);
}

function refreshConfig() {
    POPULATION = parseInt(document.getElementById("population").value);
    SAFE_DISTANCE = parseInt(document.getElementById("safe_distance").value);
    COVERAGE = parseInt(document.getElementById("coverage").value);
    SEED_INFECTIONS = parseInt(document.getElementById("seed_infections").value);
    INCUBATION_TIME = parseInt(document.getElementById("incubation_time").value);
    SUFFERING_TIME = parseInt(document.getElementById("suffering_time").value);
    RECOVERY_THRESHOLD = parseInt(document.getElementById("recovery_threshold").value);
    QUARENTINE = parseInt(document.getElementById("quarentine").value);
    QUARENTINE_TYPE = parseInt(getSelected("qType"));
    REINFECT = getChecked("reinfect");
}

function attachEvents() {
    document.getElementById("btnSubmit").addEventListener("click", init);
    document.getElementById("population").addEventListener("input", sliderChanged, false);
    document.getElementById("safe_distance").addEventListener("input", sliderChanged, false);
    document.getElementById("coverage").addEventListener("input", sliderChanged, false);
    document.getElementById("seed_infections").addEventListener("input", sliderChanged, false);
    document.getElementById("incubation_time").addEventListener("input", sliderChanged, false);
    document.getElementById("suffering_time").addEventListener("input", sliderChanged, false);
    document.getElementById("recovery_threshold").addEventListener("input", sliderChanged, false);
    document.getElementById("quarentine").addEventListener("input", qaurentineChanged, false);
    const elems = document.getElementsByName("qType");
    elems.forEach(e => { e.addEventListener("input", qaurentineTypeChanged, false); });
}

function refreshUI() {
    refeshLabel(document.getElementById("population"));
    refeshLabel(document.getElementById("safe_distance"));
    refeshLabel(document.getElementById("coverage"));

    refeshLabel(document.getElementById("incubation_time"));
    refeshLabel(document.getElementById("suffering_time"));
    refeshLabel(document.getElementById("seed_infections"));
    refeshLabel(document.getElementById("recovery_threshold"));
    refeshQuarentineLabel(document.getElementById("quarentine"));

    let qt = parseInt(getSelected("qType"));
    toggleQuarentine(qt);
}

function setSize() {
    const availble = window.innerWidth;

    if (availble < 300) {
        SIZE = 300;
        return;
    }
    else {
        SIZE = availble - 200;
    }
    GRID_SIZE = SIZE / 3;
}

function showPersons() {
    for (let i = 0; i < persons.length; i++) {
        drawPerson(persons[i]);
    }
}

function showMessage(msg) {
    textSize(18);
    fill(255);
    text(msg, 300, 20);
}


function showCommunities() {
    // Draw Harizontal & Vertical Lines
    stroke(126);

    for (let i = 0; i < SIZE / GRID_SIZE; i++) {
        line(0, i * GRID_SIZE, SIZE, i * GRID_SIZE);
        line(i * GRID_SIZE, 0, i * GRID_SIZE, SIZE);
    }

    // FENCE
    for (let i = 0; i < communities.length; i++) {
        const c = communities[i];
        if (c.state == LOCKED) {
            strokeWeight(2);
            stroke(255, 0, 0);
            noFill();
            rect(c.x * GRID_SIZE, c.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    }
}

function drawPerson(person) {

    if (person.state == CREMATED) {
        return;
    }

    if (person.state == DIED) {
        fill(255, 0, 0, 128);
    }

    if (person.state == INCUBATED) {
        fill(0xFD, 0x7F, 0x20, 128);
    }

    if (person.state == INFECTED) {
        fill(0xF5, 0x16, 0x63, 128);
    }

    if (person.state == HEALTHY) {
        fill(0, 255, 0, 128);
    }


    stroke(50);
    ellipse(person.x, person.y, RADIUS, RADIUS);

    noFill();
    stroke(10);
    ellipse(person.x, person.y, SAFE_DISTANCE, SAFE_DISTANCE);
}

function showStats() {
    textSize(16);


    fill(100, 100, 100, 100);
    rect(0, 0, 50, 30);
    fill(255);
    text(GENERATION, 5, 20);


    fill(100, 100, 100, 100);
    rect(55, 0, 50, 30);
    fill(0, 255, 0, 128);
    text(TOT_ALIVE, 60, 20);


    fill(200, 200, 200, 200);
    rect(110, 0, 50, 30);
    fill(0xF5, 0x16, 0x63, 128);
    text(TOT_INFECTIONS, 115, 20);

    fill(200, 200, 200, 200);
    rect(165, 0, 50, 30);
    fill(255, 0, 0, 128);
    text(TOT_DEATHS, 170, 20);

    fill(100, 100, 100, 100);
    rect(220, 0, 50, 30);
    fill(255);
    text(TOT_POP, 225, 20);

}

function initUI() {
    let cnv = createCanvas(SIZE, SIZE);
    cnv.parent('canvas');
    attachEvents();
}

function setup() {
    init();
    initUI();
}


function draw() {
    background(0);

    if (canStart(frameCount)) {
        return;
    }

    showCommunities();
    showPersons();
    showStats();

    if (STOP > 0) {
        stop();
        return;
    }

    run(frameCount);

}