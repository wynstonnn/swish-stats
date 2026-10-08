/* Shared parser: SWISH Player Tracker workbook -> dashboard JSON.
   Runs in Node (to build the initial data) and in the browser (when a coach uploads a new file). */
(function (root) {
  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function num(v) {
    if (v == null || v === '' || v === '-') return null;
    var n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : null;
  }
  function str(v) { return v == null ? '' : String(v).trim(); }
  function serialToISO(s) {
    if (typeof s !== 'number' || s < 20000) return null;
    var d = new Date(Math.round((s - 25569) * 86400000));
    return d.toISOString().slice(0, 10);
  }
  function rows(XLSX, wb, name) {
    var ws = wb.Sheets[name];
    if (!ws) return null;
    return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
  }
  function colFinder(header) {
    var h = header.map(norm);
    return function () {
      for (var a = 0; a < arguments.length; a++) {
        var t = arguments[a];
        for (var i = 0; i < h.length; i++) {
          if (typeof t === 'function' ? t(h[i]) : h[i] === t) return i;
        }
      }
      return -1;
    };
  }
  function abbr(code) { return function (h) { return h.indexOf('(' + code + ')') !== -1; }; }
  function startsWith(p) { return function (h) { return h.indexOf(p) === 0; }; }
  function isRealOpponent(o) { return typeof o === 'string' && o.trim() !== '' && !/^[\d._\-]+$/.test(o.trim()); }
  function gameKey(date, opp) { return String(num(date)) + '|' + norm(opp); }

  function parse(XLSX, wb) {
    var warnings = [];
    var out = { generated: new Date().toISOString(), games: [], players: [], lines: [], shots: [], warnings: warnings };

    /* Roster */
    var rr = rows(XLSX, wb, 'Player_Roster') || [];
    var roster = {};
    if (rr.length) {
      var c = colFinder(rr[0]);
      var cN = c('player name'), cP = c('position'), cS = c('shoots'), cSt = c('status');
      rr.slice(1).forEach(function (r) {
        var n = str(r[cN]);
        if (!n || n.toUpperCase() === 'SWISH') return;
        roster[n] = {
          name: n,
          pos: str(r[cP]) === '-' ? '' : str(r[cP]),
          shoots: str(r[cS]) === '-' ? '' : str(r[cS]),
          status: str(r[cSt])
        };
      });
    } else warnings.push('No Player_Roster sheet found.');

    /* Games */
    var gr = rows(XLSX, wb, 'Games') || [];
    var games = {};
    if (gr.length) {
      var g = colFinder(gr[0]);
      var gId = g('game id'), gNo = g('game no.'), gD = g('date'), gT = g('type'), gO = g('opponent'),
          gR = g('result'), gUs = g('points swish'), gThem = g('points opponent');
      gr.slice(1).forEach(function (r) {
        var opp = r[gO], res = str(r[gR]).toUpperCase();
        if (!isRealOpponent(opp) || (res !== 'W' && res !== 'L' && res !== 'D')) return;
        var us = num(r[gUs]), them = num(r[gThem]);
        if (us == null || them == null) return;
        var d = num(r[gD]);
        var key = gameKey(d, opp);
        games[key] = {
          key: key, id: str(r[gId]), date: serialToISO(d), seq: d != null && d < 20000 ? d : null,
          type: str(r[gT]) || '5v5', opp: str(opp), result: res, us: us, them: them
        };
      });
    } else warnings.push('No Games sheet found.');

    /* Player box-score lines */
    var pr = rows(XLSX, wb, 'Player_Data') || [];
    var seenPlayers = {};
    if (pr.length) {
      var p = colFinder(pr[0]);
      var C = {
        name: p('player name'), num: p('number'), date: p('date'), opp: p('opponent'), result: p('result'),
        min: p(abbr('min')), pm: p(function (h) { return h.indexOf('+/-') !== -1; }),
        pts: p(abbr('pts')), reb: p(abbr('reb')), ast: p(abbr('ast')), stl: p(abbr('stl')), blk: p(abbr('blk')),
        pf: p(abbr('f')), to: p(abbr('to')), fgm: p(abbr('fgm')), fga: p(abbr('fga')),
        tpm: p(abbr('3pm')), tpa: p(abbr('3pa')), ftm: p(abbr('ftm')), fta: p(abbr('fta')),
        oreb: p(abbr('oreb')), dreb: p(abbr('dreb')), sc: p(abbr('sc')), defl: p(abbr('d')), pto: p(abbr('pto'))
      };
      ['name', 'date', 'opp', 'pts'].forEach(function (k) { if (C[k] < 0) warnings.push('Player_Data is missing the "' + k + '" column.'); });
      var dropped = 0;
      pr.slice(1).forEach(function (r) {
        var n = str(r[C.name]);
        if (!n) return;
        var key = gameKey(r[C.date], r[C.opp]);
        if (!games[key]) {
          /* A game that is in Player_Data but not the Games sheet: build it from the lines if it looks real. */
          if (isRealOpponent(r[C.opp]) && /^[WL]$/i.test(str(r[C.result]))) {
            var d = num(r[C.date]);
            games[key] = { key: key, id: '', date: serialToISO(d), seq: d != null && d < 20000 ? d : null,
              type: '5v5', opp: str(r[C.opp]), result: str(r[C.result]).toUpperCase(), us: null, them: null };
          } else { dropped++; return; }
        }
        var L = { p: n, g: key, no: num(r[C.num]) };
        ['min', 'pm', 'pts', 'reb', 'ast', 'stl', 'blk', 'pf', 'to', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'oreb', 'dreb', 'sc', 'defl', 'pto']
          .forEach(function (k) { var v = C[k] >= 0 ? num(r[C[k]]) : null; L[k] = v; });
        out.lines.push(L);
        seenPlayers[n] = true;
      });
      if (dropped) warnings.push(dropped + ' Player_Data row(s) skipped because their game has no opponent or result yet.');
    } else warnings.push('No Player_Data sheet found.');

    /* Fill team score from lines when the Games sheet had none */
    Object.keys(games).forEach(function (k) {
      var gm = games[k];
      if (gm.us == null) gm.us = out.lines.filter(function (l) { return l.g === k; }).reduce(function (s, l) { return s + (l.pts || 0); }, 0);
    });

    /* Order: dated games chronologically, then games that only have a game number */
    out.games = Object.keys(games).map(function (k) { return games[k]; }).sort(function (a, b) {
      if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      if (a.date) return -1; if (b.date) return 1;
      return (a.seq || 0) - (b.seq || 0);
    });
    out.games.forEach(function (gm, i) { gm.n = i + 1; });
    var undated = out.games.filter(function (gm) { return !gm.date; }).length;
    if (undated) warnings.push(undated + ' game(s) have a game number instead of a date, so they are listed after the dated games.');

    /* Players: roster first, plus anyone who appears in the box scores */
    Object.keys(seenPlayers).forEach(function (n) { if (!roster[n]) roster[n] = { name: n, pos: '', shoots: '', status: '' }; });
    out.players = Object.keys(roster).map(function (n) { return roster[n]; });

    /* Shots */
    var sr = rows(XLSX, wb, 'Shot_Data') || [];
    if (sr.length) {
      var s = colFinder(sr[0]);
      var S = { p: s('player'), zone: s('zone'), res: s('result'), type: s('shot type'), sit: s('scoring situation'),
        contest: s('contest'), assisted: s('assisted'), assister: s('assister'), date: s('date'), opp: s('opponent') };
      sr.slice(1).forEach(function (r) {
        var n = str(r[S.p]); var z = str(r[S.zone]);
        if (!n || !z || n.toUpperCase() === 'SWISH') return;
        var res = str(r[S.res]);
        out.shots.push({ p: n, zone: z, made: /make/i.test(res), fouled: /foul/i.test(res),
          type: str(r[S.type]), sit: str(r[S.sit]), contest: str(r[S.contest]),
          ast: /^y/i.test(str(r[S.assisted])), by: str(r[S.assister]), date: serialToISO(num(r[S.date])) });
      });
    }
    return out;
  }

  var api = { parse: parse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SwishParser = api;
})(this);
