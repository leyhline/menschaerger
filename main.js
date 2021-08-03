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

'use strict';

const playerToPieces = new Map([
	[2, 6],
	[3, 5],
	[4, 4],
	[5, 3],
	[6, 3],
	[7, 2],
	[8, 2],
	[9, 1],
	[10, 1],
]);

const colors = [
	'#1f77b4',
	'#ff7f0e',
	'#2ca02c',
	'#d62728',
	'#9467bd',
	'#8c564b',
	'#e377c2',
	'#747474',
	'#bcbd22',
	'#17becf',
];

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	rotate(angle) {
		const xNew = this.x * Math.cos(angle) - this.y * Math.sin(angle);
		this.y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
		this.x = xNew;
		return this;
	}

	multiply(factor) {
		this.x *= factor;
		this.y *= factor;
		return this;
	}

	add(x, y) {
		this.x += x;
		this.y += y;
		return this;
	}

	duplicate() {
		return new Vector(this.x, this.y);
	}

	length() {
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	}
}

/**
 * Creates a board representation with coordinates of fiels
 * @param {number} nrPlayers
 * @param {number} nrPiecesPerPlayer
 * @returns {Array.<Array.<Vector>>} Tuple of (field, house) positions
 */
function createBoard(nrPlayers, nrPiecesPerPlayer) {
	console.assert(
		nrPlayers >= 2 && nrPlayers <= 10,
		'Expected: 2 <= nrPlayers <= 10; Is: nrPlayers == %d',
		nrPlayers
	);
	console.assert(
		nrPiecesPerPlayer >= 1 && nrPiecesPerPlayer <= 6,
		'Expected: 1 <= nrPiecesPerPlayer <= 6, Is: nrPlayers == %d',
		nrPiecesPerPlayer
	);
	const firstOuterAnchor = new Vector(0.0, 1.0);
	const firstInnerAnchor = firstOuterAnchor
		.duplicate()
		.rotate(Math.PI / nrPlayers)
		.multiply((Math.sqrt(2.0) * 0.8) / nrPiecesPerPlayer);
	const outerAnchors = createAnchors(nrPlayers, firstOuterAnchor);
	const innerAnchors = createAnchors(nrPlayers, firstInnerAnchor);
	console.assert(outerAnchors.length == innerAnchors.length);
	const houses = createHouses(outerAnchors, innerAnchors, nrPiecesPerPlayer);
	const connections = createConnections(outerAnchors, innerAnchors, nrPiecesPerPlayer);
	const board = mergeToSortedBoard(outerAnchors, innerAnchors, connections, nrPlayers, nrPiecesPerPlayer);
	console.assert(board.length == (2 * nrPiecesPerPlayer + 2) * nrPlayers);
	return [board, houses];
}

function mergeToSortedBoard(outerAnchors, innerAnchors, connections, nrPlayers, nrPiecesPerPlayer) {
	const sortedVectors = [];
	for (let i = 0; i < nrPlayers; i++) {
		for (let j = 0; j < nrPiecesPerPlayer; j++) {
			sortedVectors.push(connections.pop());
		}
		sortedVectors.push(innerAnchors.pop());
		for (let j = 0; j < nrPiecesPerPlayer; j++) {
			sortedVectors.push(connections.pop());
		}
		sortedVectors.push(outerAnchors.pop());
	}
	return sortedVectors;
}

/**
 * @param {number} nrPlayers
 * @param {Vector} firstAnchor
 * @returns {Array.<Vector>}
 */
function createAnchors(nrPlayers, firstAnchor) {
	const anchors = Array(nrPlayers);
	anchors[0] = firstAnchor;
	const angle = (2 * Math.PI) / nrPlayers;
	for (let i = 1; i < nrPlayers; i++) {
		anchors[i] = firstAnchor.duplicate().rotate(i * angle);
	}
	return anchors;
}

/**
 * @param {Array.<Vector>} outerAnchors
 * @param {Array.<Vector>} innerAnchors
 * @param {number} nrPiecesPerPlayer
 * @returns {Array.<Vector>}
 */
function createHouses(outerAnchors, innerAnchors, nrPiecesPerPlayer) {
	const houses = Array(outerAnchors.length * nrPiecesPerPlayer);
	for (let i = 0; i < outerAnchors.length; i++) {
		const outer = outerAnchors[i];
		const innerLeft = innerAnchors[i];
		const innerRight = i == 0 ? innerAnchors[innerAnchors.length - 1] : innerAnchors[i - 1];
		const leftToRight = innerRight.duplicate().add(-innerLeft.x, -innerLeft.y).multiply(0.5);
		const innerOuterParallel = innerLeft.duplicate().add(leftToRight.x, leftToRight.y);
		const helper = outer
			.duplicate()
			.add(-innerOuterParallel.x, -innerOuterParallel.y)
			.multiply((1.0 / nrPiecesPerPlayer) * 0.9);
		for (let j = 1; j <= nrPiecesPerPlayer; j++) {
			houses[i * nrPiecesPerPlayer + j - 1] = outer.duplicate().add(-helper.x * j, -helper.y * j);
		}
	}
	return houses;
}

/**
 * @param {Array.<Vector>} outerAnchors
 * @param {Array.<Vector>} innerAnchors
 * @param {number} nrPiecesPerPlayer
 * @returns {Array.<Vector>}
 */
function createConnections(outerAnchors, innerAnchors, nrPiecesPerPlayer) {
	console.assert(
		outerAnchors.length === innerAnchors.length,
		'Expected: same number of outerAnchors and innerAnchors'
	);
	const fields = [];
	for (let i = 0; i < innerAnchors.length; i++) {
		const inner = innerAnchors[i];
		const outerRight = outerAnchors[i];
		const outerRightTarget = createNeighbor(outerRight, inner, nrPiecesPerPlayer, Math.PI / 2.0);
		const innerToRightTarget = outerRightTarget
			.duplicate()
			.add(-inner.x, -inner.y)
			.multiply(1.0 / nrPiecesPerPlayer);
		fields.push(outerRightTarget);
		for (let i = nrPiecesPerPlayer - 1; i > 0; i--) {
			fields.push(inner.duplicate().add(i * innerToRightTarget.x, i * innerToRightTarget.y));
		}
		const outerLeft = i == outerAnchors.length - 1 ? outerAnchors[0] : outerAnchors[i + 1];
		const outerLeftTarget = createNeighbor(outerLeft, inner, nrPiecesPerPlayer, -Math.PI / 2);
		const innerToLeftTarget = outerLeftTarget
			.duplicate()
			.add(-inner.x, -inner.y)
			.multiply(1.0 / nrPiecesPerPlayer);
		for (let i = 1; i < nrPiecesPerPlayer; i++) {
			fields.push(inner.duplicate().add(i * innerToLeftTarget.x, i * innerToLeftTarget.y));
		}
		fields.push(outerLeftTarget);
	}
	return fields;
}

/**
 * @param {Vector} outer
 * @param {Vector} inner
 * @param {number} angle
 * @returns {Vector}
 */
function createNeighbor(outer, inner, nrPiecesPerPlayer, angle) {
	const innerToOuter = outer
		.duplicate()
		.add(-inner.x, -inner.y)
		.multiply(1.0 / nrPiecesPerPlayer);
	const helper = outer.duplicate().rotate(angle).multiply(innerToOuter.length());
	return outer.duplicate().add(helper.x, helper.y);
}

function updateSvg(nrPlayers, nrPiecesPerPlayer) {
	const [fields, houses] = createBoard(nrPlayers, nrPiecesPerPlayer);
	const spanElem = document.getElementById('nrPlayersDisplay');
	spanElem.textContent = nrPlayers;
	const svgElem = document.getElementById('board');
	while (svgElem.lastElementChild) svgElem.removeChild(svgElem.lastElementChild);
	svgElem.appendChild(createPolygonElement(fields));
	let colorindex = 0;
	for (let i = 0; i < fields.length; i++) {
		const field = fields[i];
		const circleElem = createCircleElement(field);
		if (i % (2 * nrPiecesPerPlayer + 2) == 2 * nrPiecesPerPlayer) {
			circleElem.setAttribute('fill', colors[colorindex]);
			for (let j = 0; j < nrPiecesPerPlayer; j++) {
				const houseCircle = createCircleElement(houses.pop(), 0.7);
				houseCircle.setAttribute('fill', colors[colorindex]);
				svgElem.appendChild(houseCircle);
			}
			colorindex = colorindex >= colors.length ? 0 : colorindex + 1;
		} else {
			circleElem.setAttribute('fill', 'white');
		}
		svgElem.appendChild(circleElem);
	}
}

function createPolygonElement(fields) {
	const polygonElem = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
	polygonElem.setAttribute('points', fields.map((field) => `${field.x}, ${field.y}`).join(' '));
	polygonElem.setAttribute('fill', 'none');
	polygonElem.setAttribute('stroke', 'black');
	polygonElem.setAttribute('stroke-width', '0.01');
	return polygonElem;
}

function createCircleElement(field, scale = 1.0) {
	const circleElem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	circleElem.setAttribute('cx', field.x);
	circleElem.setAttribute('cy', field.y);
	circleElem.setAttribute('r', 0.075 * scale);
	circleElem.setAttribute('stroke', 'black');
	circleElem.setAttribute('stroke-width', 0.01);
	return circleElem;
}

window.onload = () => {
	const selectNrPlayersElem = document.getElementById('nrPlayers');
	selectNrPlayersElem.oninput = () =>
		updateSvg(selectNrPlayersElem.value, playerToPieces.get(parseInt(selectNrPlayersElem.value)));
	updateSvg(selectNrPlayersElem.value, playerToPieces.get(parseInt(selectNrPlayersElem.value)));
};
