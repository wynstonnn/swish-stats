import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context: any = vm.createContext({});
vm.runInContext(readFileSync('public/hub/development.js', 'utf8'), context);
const { badgeProgress } = context.Development;
const player = (name: string, value: number | null, records = 5, rows: any[] = []) => ({
  name, avg: { ast: value, reb: value, stl: value, blk: value },
  counts: { ast: records, reb: records, stl: records, blk: records }, rows: rows.length?rows:[{threeMade:value,threeAtt:records>=5?20:19}],
});
const rank = (p: any, peers: any[], name = 'Set and Fire') =>
  badgeProgress(p, [p, ...peers]).find((b: any) => b.name === name);

test('badges award the highest tier at inclusive team-percentile thresholds', () => {
  const p = player('Selected', 10);
  const peers = (lower: number) => Array.from({ length: 20 }, (_, i) => player(`Peer ${i}`, i < lower ? 5 : 15));
  for (const [lower, percentile, tier] of [[9, 45, null], [10, 50, 'Bronze'], [15, 75, 'Silver'], [18, 90, 'Gold'], [19, 95, 'Hall Of Fame'], [20, 100, 'Hall Of Fame']]) {
    const badge = rank(p, peers(lower as number));
    assert.equal(badge.percentile, percentile);
    assert.equal(badge.tier, tier);
    assert.equal(badge.peers, 20); // The selected player is excluded.
  }
});

test('ties get equal half credit and live teammate changes recalculate the rank', () => {
  const p = player('Selected', 3), peers = [player('A', 1), player('B', 3), player('C', 3), player('D', 5)];
  assert.equal(rank(p, peers).percentile, 50);
  assert.equal(rank(peers[1], [p, ...peers.filter(x => x.name !== 'B')]).percentile, 50);
  peers[3].rows[0].threeMade = 2;
  assert.equal(rank(p, peers).percentile, 75);
  assert.equal(rank(p, peers).tier, 'Silver');
});

test('missing, zero, and small samples do not earn misleading badges', () => {
  const peers = [player('A', 1), player('B', 2), player('C', 3)];
  assert.equal(rank(player('Selected', 4, 4), peers).percentile, null);
  assert.equal(rank(player('Selected', null), peers).tier, null);
  assert.equal(rank(player('Selected', 4), peers.slice(0, 2)).percentile, null);
  assert.equal(rank(player('Selected', 4), [...peers.slice(0, 2), player('D', 1, 4)]).tier, null);
  assert.equal(rank(player('Selected', 0), peers.map(x => player(x.name, 0))).tier, null);
});

test('shooting ranks use total paired attempts and the same minimum for every peer', () => {
  const p = player('Selected', 1, 5, [{ threeMade: 1, threeAtt: 2 }, { threeMade: 4, threeAtt: 18 }, { threeMade: 90, threeAtt: null }]);
  const shooter = (name: string, makes: number, attempts = 20) => player(name, 1, 5, [{ threeMade: makes, threeAtt: attempts }]);
  const peers = [shooter('A', 1), shooter('B', 2), shooter('C', 3), shooter('D', 10), shooter('Too Few', 0, 19)];
  const badge = rank(p, peers, 'Set and Fire');
  assert.equal(badge.value, .25);
  assert.equal(badge.sample, 20);
  assert.equal(badge.peers, 4);
  assert.equal(badge.percentile, 75);
  assert.equal(badge.tier, 'Silver');
  assert.equal(rank(shooter('Selected', 5, 19), peers, 'Set and Fire').tier, null);
  const finishers = ['A', 'B', 'C'].map(name => player(name, 1, 5, [{ twoMade: 5, twoAtt: 30 }]));
  assert.equal(rank(player('Selected', 1, 5, [{ twoMade: 15, twoAtt: 29 }]), finishers, 'Smooth Operator').tier, null);
  assert.equal(rank(player('Selected', 1, 5, [{ twoMade: 15, twoAtt: 30 }]), finishers, 'Smooth Operator').tier, 'Hall Of Fame');
});
