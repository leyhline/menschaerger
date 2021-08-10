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

const PLAYER_TO_PIECES = new Map([
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

const COLORS = [
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
		Object.freeze(this);
	}

	rotate(angle) {
		return new Vector(
			this.x * Math.cos(angle) - this.y * Math.sin(angle),
			this.x * Math.sin(angle) + this.y * Math.cos(angle)
		);
	}

	multiply(factor) {
		return new Vector(
			this.x * factor,
			this.y * factor
		);
	}

	divide(divisor) {
		return new Vector(
			this.x / divisor,
			this.y / divisor
		);
	};

	add(vector) {
		return new Vector(
			this.x + vector.x,
			this.y + vector.y
		);
	}

	subtract(vector) {
		return new Vector(
			this.x - vector.x,
			this.y - vector.y
		);
	};

	length() {
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	}
}

/**
 * @param {number} nrPlayers
 * @param {number} nrPiecesPerPlayer
 * @returns {Array.<Array.<Vector>>} Tuple of (fields, houses) positions
 */
function createBoard(nrPlayers, nrPiecesPerPlayer) {
	console.assert(nrPlayers >= 2 && nrPlayers <= 10, 'Expected: 2 <= nrPlayers <= 10; Is: nrPlayers == %d', nrPlayers);
	console.assert(
		nrPiecesPerPlayer >= 1 && nrPiecesPerPlayer <= 6,
		'Expected: 1 <= nrPiecesPerPlayer <= 6, Is: nrPlayers == %d',
		nrPiecesPerPlayer
	);
	const firstOuterAnchor = new Vector(0.0, 1.0);
	const firstInnerAnchor = firstOuterAnchor
		.rotate(Math.PI / nrPlayers)
		.multiply(Math.sqrt(2.0) / (nrPiecesPerPlayer + 1));
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
		anchors[i] = firstAnchor.rotate(i * angle);
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
		const leftToRight = innerRight.subtract(innerLeft).divide(2.0);
		const innerOuterParallel = innerLeft.add(leftToRight);
		const helper = outer
			.subtract(innerOuterParallel)
			.multiply((1.0 / nrPiecesPerPlayer) * 0.9);
		for (let j = 1; j <= nrPiecesPerPlayer; j++) {
			houses[i * nrPiecesPerPlayer + j - 1] = outer.subtract(helper.multiply(j));
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
			.subtract(inner)
			.divide(nrPiecesPerPlayer);
		fields.push(outerRightTarget);
		for (let i = nrPiecesPerPlayer - 1; i > 0; i--) {
			fields.push(inner.add(innerToRightTarget.multiply(i)));
		}
		const outerLeft = i == outerAnchors.length - 1 ? outerAnchors[0] : outerAnchors[i + 1];
		const outerLeftTarget = createNeighbor(outerLeft, inner, nrPiecesPerPlayer, -Math.PI / 2);
		const innerToLeftTarget = outerLeftTarget
			.subtract(inner)
			.divide(nrPiecesPerPlayer);
		for (let i = 1; i < nrPiecesPerPlayer; i++) {
			fields.push(inner.add(innerToLeftTarget.multiply(i)));
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
		.subtract(inner)
		.divide(nrPiecesPerPlayer);
	const helper = outer.rotate(angle).multiply(innerToOuter.length());
	return outer.add(helper);
}