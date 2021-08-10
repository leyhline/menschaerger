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

window.onload = main;

function main() {
	const nrPlayersElem = document.getElementById('nrPlayers');
	const customNrPlayersElem = document.getElementById('customNrPlayers');
	const customNrPiecesPerPlayerElem = document.getElementById('customNrPiecesPerPlayer');
	nrPlayersElem.oninput = () => {
		const nrPlayers = parseInt(nrPlayersElem.value);
		const nrPiecesPerPlayer = PLAYER_TO_PIECES.get(nrPlayers);
		customNrPlayersElem.value = nrPlayers;
		customNrPiecesPerPlayerElem.value = nrPiecesPerPlayer;
		updateSvg(nrPlayers, nrPiecesPerPlayer);
	};
	customNrPlayersElem.oninput = () => {
		const nrPlayers = parseInt(customNrPlayersElem.value);
		const nrPiecesPerPlayer = parseInt(customNrPiecesPerPlayerElem.value);
		nrPlayersElem.value = nrPlayers;
		updateSvg(nrPlayers, nrPiecesPerPlayer);
	};
	customNrPiecesPerPlayerElem.oninput = () => {
		const nrPlayers = parseInt(customNrPlayersElem.value);
		const nrPiecesPerPlayer = parseInt(customNrPiecesPerPlayerElem.value);
		updateSvg(nrPlayers, nrPiecesPerPlayer);
	};
	updateSvg(nrPlayersElem.value, PLAYER_TO_PIECES.get(parseInt(nrPlayersElem.value)));
}

function updateSvg(nrPlayers, nrPiecesPerPlayer) {
	const [fields, houses] = createBoard(nrPlayers, nrPiecesPerPlayer);
	const spanElem = document.getElementById('nrPlayersDisplay');
	spanElem.textContent = nrPlayers;
	const divElem = document.getElementById('board');
	const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svgElem.setAttribute('width', 800);
	svgElem.setAttribute('height', 800);
	svgElem.setAttribute('viewBox', '-1.5 -1.5 3 3');
	svgElem.appendChild(createPolygonElement(fields));
	let colorindex = 0;
	for (let i = 0; i < fields.length; i++) {
		const field = fields[i];
		const circleElem = createCircleElement(field);
		if (i % (2 * nrPiecesPerPlayer + 2) == 2 * nrPiecesPerPlayer) {
			circleElem.setAttribute('fill', COLORS[colorindex]);
			for (let j = 0; j < nrPiecesPerPlayer; j++) {
				const houseCircle = createCircleElement(houses.pop(), 0.7);
				houseCircle.setAttribute('fill', COLORS[colorindex]);
				svgElem.appendChild(houseCircle);
			}
			colorindex = colorindex >= COLORS.length ? 0 : colorindex + 1;
		} else {
			circleElem.setAttribute('fill', 'white');
		}
		svgElem.appendChild(circleElem);
	}
	divElem.replaceChildren(svgElem);
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
