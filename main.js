/**
 *
 * @licstart  The following is the entire license notice for the 
 * JavaScript code in this page.
 *
 * "Mensch Ärgere dich nicht" board game for n players
 * Copyright (C) 2021  Thomas Leyh <thomas.leyh@mailbox.org>
 * 
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 * 
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

"use strict";

const playerToPieces = new Map([
    [2, 6],
    [3, 5],
    [4, 4],
    [5, 3],
    [6, 3],
    [7, 2],
    [8, 2],
    [9, 1],
    [10, 1]
])

const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#747474",
    "#bcbd22",
    "#17becf"
]

class Field {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {number} angle 
     * @returns {Field}
     */
    rotate(angle) {
        const xNew = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        this.y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
        this.x = xNew;
        return this;
    }

    /**
     * @param {number} factor 
     * @returns {Field}
     */
    multiply(factor) {
        this.x *= factor;
        this.y *= factor;
        return this;
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @returns {Field}
     */
    add(x, y) {
        this.x += x;
        this.y += y;
        return this;
    }

    /**
     * @returns {Field}
     */
    duplicate() {
        return new Field(this.x, this.y);
    }

    /**
     * @returns {number}
     */
    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
}

/**
 * Creates a board representation with coordinates of fiels
 * @param {number} nrPlayers 
 * @param {number} nrPiecesPerPlayer 
 * @returns {Array.<Array.<Field>>} Coordinates approximately around unit circle
 */
function createBoard(nrPlayers, nrPiecesPerPlayer) {
    console.assert(nrPlayers >= 2 && nrPlayers <= 10,
        "Expected: 2 <= nrPlayers <= 10; Is: nrPlayers == %d", nrPlayers);
    console.assert(nrPiecesPerPlayer >= 1 && nrPiecesPerPlayer <= 6, 
        "Expected: 1 <= nrPiecesPerPlayer <= 6, Is: nrPlayers == %d", nrPiecesPerPlayer);
    const firstOuterAnchorField = new Field(0.0, 1.0);
    const firstInnerAnchorField = firstOuterAnchorField.duplicate().rotate(Math.PI / nrPlayers)
        .multiply(Math.sqrt(2.0) * 0.8 / nrPiecesPerPlayer);
    const outerAnchorFields = createAnchorFields(nrPlayers, firstOuterAnchorField);
    const innerAnchorFields = createAnchorFields(nrPlayers, firstInnerAnchorField);
    console.assert(outerAnchorFields.length == innerAnchorFields.length);
    const houseFields = createHouseFields(outerAnchorFields, innerAnchorFields, nrPiecesPerPlayer);
    const connectionFields = createConnectionFields(outerAnchorFields, innerAnchorFields, nrPiecesPerPlayer);
    const sortedFields = [];
    for (let i = 0; i < nrPlayers; i++) {
        for (let j = 0; j < nrPiecesPerPlayer; j++) {
            sortedFields.push(connectionFields.pop());
        }
        sortedFields.push(innerAnchorFields.pop());
        for (let j = 0; j < nrPiecesPerPlayer; j++) {
            sortedFields.push(connectionFields.pop());
        }
        sortedFields.push(outerAnchorFields.pop());
    }
    console.assert(sortedFields.length == (2 * nrPiecesPerPlayer + 2) * nrPlayers);
    return [sortedFields, houseFields];
}

/**
 * @param {number} nrPlayers 
 * @returns {Array.<Field>}
 */
function createAnchorFields(nrPlayers, firstField) {
    const fields = Array(nrPlayers);
    fields[0] = firstField;
    const angle = 2 * Math.PI / nrPlayers
    for (let i = 1; i < nrPlayers; i++) {
        fields[i] = firstField.duplicate().rotate(i * angle);
    }
    return fields;
}

/**
 * @param {Array.<Field>} outerAnchorFields 
 * @param {Array.<Field>} innerAnchorFields 
 * @param {number} nrPiecesPerPlayer 
 * @returns {Array.<Field>}
 */
function createHouseFields(outerAnchorFields, innerAnchorFields, nrPiecesPerPlayer) {
    const houseFields = Array(outerAnchorFields.length * nrPiecesPerPlayer);
    for (let i = 0; i < outerAnchorFields.length; i++) {
        const outerField = outerAnchorFields[i];
        const innerFieldLeft = innerAnchorFields[i];
        const innerFieldRight = i == 0 ? innerAnchorFields[innerAnchorFields.length - 1] : innerAnchorFields[i - 1];
        const leftToRightField = innerFieldRight.duplicate().add(-innerFieldLeft.x, -innerFieldLeft.y).multiply(0.5);
        const innerOuterParallel = innerFieldLeft.duplicate().add(leftToRightField.x, leftToRightField.y);
        const helperField = outerField.duplicate().add(-innerOuterParallel.x, -innerOuterParallel.y).multiply(1.0 / nrPiecesPerPlayer * 0.9);
        for (let j = 1; j <= nrPiecesPerPlayer; j++) {
            houseFields[i * nrPiecesPerPlayer + j - 1] = outerField.duplicate().add(-helperField.x * j, -helperField.y * j);
        }
    }
    return houseFields;
}

/**
 * @param {Array.<Field>} outerAnchorFields 
 * @param {Array.<Field>} innerAnchorFields 
 * @param {number} nrPiecesPerPlayer 
 * @returns {Array.<Field>}
 */
function createConnectionFields(outerAnchorFields, innerAnchorFields, nrPiecesPerPlayer) {
    console.assert(outerAnchorFields.length === innerAnchorFields.length,
        "Expected: same number of outerAnchorFields and innerAnchorFields");
    const fields = [];
    for (let i = 0; i < innerAnchorFields.length; i++) {
        const innerField = innerAnchorFields[i];
        const outerFieldRight = outerAnchorFields[i];
        const outerFieldRightTarget = createNeighborField(outerFieldRight, innerField, nrPiecesPerPlayer, Math.PI / 2.0);
        const innerToRightTarget = outerFieldRightTarget.duplicate().add(-innerField.x, -innerField.y).multiply(1.0 / nrPiecesPerPlayer);
        fields.push(outerFieldRightTarget);
        for (let i = nrPiecesPerPlayer - 1; i > 0; i--) {
            fields.push(innerField.duplicate().add(i * innerToRightTarget.x, i * innerToRightTarget.y));
        }
        const outerFieldLeft = (i == outerAnchorFields.length - 1) ? outerAnchorFields[0] : outerAnchorFields[i+1];
        const outerFieldLeftTarget = createNeighborField(outerFieldLeft, innerField, nrPiecesPerPlayer, -Math.PI / 2);
        const innerToLeftTarget = outerFieldLeftTarget.duplicate().add(-innerField.x, -innerField.y).multiply(1.0 / nrPiecesPerPlayer);
        for (let i = 1; i < nrPiecesPerPlayer; i++) {
            fields.push(innerField.duplicate().add(i * innerToLeftTarget.x, i * innerToLeftTarget.y));
        }
        fields.push(outerFieldLeftTarget);
    }
    return fields;
}

/**
 * @param {Field} outerField 
 * @param {Field} innerField 
 * @param {number} angle
 * @returns {Field} 
 */
function createNeighborField(outerField, innerField, nrPiecesPerPlayer, angle) {
    const innerToOuterField = outerField.duplicate().add(-innerField.x, -innerField.y).multiply(1.0 / nrPiecesPerPlayer);
    const helperField = outerField.duplicate().rotate(angle).multiply(innerToOuterField.length());
    return outerField.duplicate().add(helperField.x, helperField.y);
}

window.onload = () => {
    const selectNrPlayersElem = document.getElementById("nrPlayers");
    selectNrPlayersElem.onchange = (() => updateSvg(selectNrPlayersElem.value, playerToPieces.get(parseInt(selectNrPlayersElem.value))));
    updateSvg(selectNrPlayersElem.value, playerToPieces.get(parseInt(selectNrPlayersElem.value)));
}

function updateSvg(nrPlayers, nrPiecesPerPlayer) {
    const [fields, houseFields] = createBoard(nrPlayers, nrPiecesPerPlayer);
    const svgElem = document.getElementById("board");
    while (svgElem.lastElementChild) svgElem.removeChild(svgElem.lastElementChild);
    svgElem.appendChild(createPolygonElement(fields));
    let colorindex = 0;
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const circleElem = createCircleElement(field);
        if (i % (2 * nrPiecesPerPlayer + 2) == (2 * nrPiecesPerPlayer)) {
            circleElem.setAttribute("fill", colors[colorindex]);
            for (let j = 0; j < nrPiecesPerPlayer; j++) {
                const houseCircle = createCircleElement(houseFields.pop(), 0.7);
                houseCircle.setAttribute("fill", colors[colorindex]);
                svgElem.appendChild(houseCircle);
            }
            colorindex = colorindex >= colors.length ? 0 : colorindex + 1;
        } else {
            circleElem.setAttribute("fill", "white");
        }
        svgElem.appendChild(circleElem);
    }
}

function createPolygonElement(fields) {
    const polygonElem = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygonElem.setAttribute("points", fields.map(field => `${field.x}, ${field.y}`).join(" "));
    polygonElem.setAttribute("fill", "none");
    polygonElem.setAttribute("stroke", "black");
    polygonElem.setAttribute("stroke-width", "0.01");
    return polygonElem;
}

function createCircleElement(field, scale = 1.0) {
    const circleElem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleElem.setAttribute("cx", field.x);
    circleElem.setAttribute("cy", field.y);
    circleElem.setAttribute("r", 0.075 * scale);
    circleElem.setAttribute("stroke", "black");
    circleElem.setAttribute("stroke-width", 0.01);
    return circleElem;
}
