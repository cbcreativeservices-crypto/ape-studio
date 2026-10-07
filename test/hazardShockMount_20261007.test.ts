import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isHazardTerm } from '../src/lib/hazard.ts';

describe('hazard caution: mechanical shock mounts are not electrical (owner 2026-10-07)', () => {
  it('shock mounts carry no caution', () => {
    for (const t of ['Shock Mount', 'shock-mount', 'Microphone Shockmount', 'Shock Absorber', 'Shock Isolation']) assert.equal(isHazardTerm(t), false, t);
  });
  it('electrical shock terms still do', () => {
    for (const t of ['Electric Shock', 'Shock Hazard', 'Vacuum Tube', 'Shock-mounted tube preamp']) assert.equal(isHazardTerm(t), true, t);
  });
});
