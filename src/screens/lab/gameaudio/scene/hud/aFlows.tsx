/**
 * aFlows — the three strips that show something being SENT or CHOSEN:
 *
 *   chain (page 6)   the door's chain: the scene posts the event, the event
 *                    asks for a file for each of its layers, each file found
 *                    starts a voice, the voices reach the output. The voices
 *                    are drawn on the event's own clock (0 … 2 s), so the
 *                    rattle is seen to start one second after the door.
 *   sync  (page 8)   the four kinds of game information: the last trigger
 *                    and who sent it, each character's own switch, the
 *                    generator's speed, the state of the whole game
 *   takes (page 9)   the last eight takes: which take, with its real pitch
 *                    change (how high the bar sits) and level change (how
 *                    tall it is)
 *
 * What the model does in ONE instant (the post, the instance, the first
 * voice) lights in one instant here: nothing is staggered for effect. Only
 * the model's real delays and lengths are drawn in time.
 *
 * Every value comes from aModel (pure, tested). Read-only.
 */
import { memo, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { GA_EVENTS } from '../../model/gaDefs';
import { gaNow } from '../../model/gaStore';
import type { GaHudProps } from './gaHudTypes';
import {
  A_CHAIN_SPAN_S,
  A_SURFACE_WORD,
  A_TAKES_KEPT,
  A_TAKE_CENTS,
  A_TAKE_DB,
  aCentsWord,
  aChainMoving,
  aChainStep,
  aChainSummary,
  aLevelWord,
  aTakeDbWord,
  aNextStart,
  aNoteTakes,
  aPct,
  aRamping,
  aSyncAnyMarked,
  aSyncMark,
  aSyncNextUnmark,
  aSyncStep,
  aSyncSummary,
  aTakes,
  aTakesRun,
  aTakesSummary,
  type AChain,
  type AChainLane,
  type ASync,
  type ATake,
  aLegendFit,
} from './aModel';
import { Bar, Gauge, HUD, HUD_VALUE, HudFrame, Lamp, Lbl, Rule, Val, barX, hudK, useHudNow, type LampState } from './aParts';

/* ── chain (page 6) ─────────────────────────────────────────────────────── */

/** A link between two parts of the chain: bright once the request has
 *  really passed along it. */
function Link({ w, lit, k }: { w: number; lit: boolean; k: number }) {
  return <View style={{ width: w, height: lit ? 1.5 * k : 1, backgroundColor: lit ? HUD.value : HUD.slotRim }} />;
}

function VoiceLane({ k, w, h, lane, held }: { k: number; w: number; h: number; lane: AChainLane | null; held: boolean }) {
  const x = (sec: number) => Math.max(0, Math.min(1, sec / A_CHAIN_SPAN_S)) * w;
  const v = lane?.voice ?? 'not-started';
  const sounded = v === 'playing' || v === 'done';
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <View style={{ height: 8 * k, borderRadius: 1.5, backgroundColor: HUD.slot, borderWidth: 1, borderColor: HUD.slotRim, overflow: 'hidden' }}>
        {[0.5, 1, 1.5].map((t) => (
          <View key={t} style={{ position: 'absolute', left: Math.round(x(t)), top: 0, bottom: 0, width: 1, backgroundColor: t === 1 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.16)' }} />
        ))}
        {/* where a late layer will start */}
        {lane && v === 'waiting' ? <View style={{ position: 'absolute', left: x(lane.delayS), top: 0, bottom: 0, width: 1.5 * k, backgroundColor: HUD.legend }} /> : null}
        {/* the voice: from its start, for as long as it has really played */}
        {lane && sounded ? (
          <View
            style={{
              position: 'absolute',
              left: x(lane.delayS),
              top: 0,
              bottom: 0,
              width: Math.max(1.5 * k, x(lane.delayS + lane.playedS) - x(lane.delayS)),
              backgroundColor: v === 'playing' && !held ? HUD.value : 'transparent',
              borderWidth: v === 'playing' && !held ? 0 : 1,
              borderColor: HUD_VALUE,
            }}
          />
        ) : null}
      </View>
      {lane && v === 'missing' ? (
        <View style={{ position: 'absolute', left: 1, top: 0, bottom: 0, justifyContent: 'center' }}>
          <View style={{ backgroundColor: HUD.slot, paddingHorizontal: 4 * k }}>
            <Lbl k={k} color={HUD.red}>
              NOT IN THE BUILD
            </Lbl>
          </View>
        </View>
      ) : null}
      {lane && v === 'off' ? (
        <View style={{ position: 'absolute', left: 1, top: 0, bottom: 0, justifyContent: 'center' }}>
          <View style={{ backgroundColor: HUD.slot, paddingHorizontal: 4 * k }}>
            <Lbl k={k} color={HUD.idle}>
              LAYER OFF
            </Lbl>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const FILE_LAMP: Record<AChainLane['voice'], LampState> = { 'not-started': 'off', missing: 'cut', waiting: 'on', playing: 'on', done: 'ring', off: 'off' };

function ChainHud({ w, h, state: s }: GaHudProps) {
  const k = hudK(h);
  const chainRef = useRef<AChain | null>(null);
  const c = (chainRef.current = aChainStep(chainRef.current, s, gaNow()));
  const { now } = useHudNow(aChainMoving(c) || aRamping(s, gaNow()), aNextStart(s, gaNow()));
  const live = !!c?.live;
  const held = !!c && !c.live;
  const layers = GA_EVENTS.door_open.layers;
  const pad = 8 * k;
  const gap = 5 * k;
  const col = { scene: 40 * k, event: 52 * k, layer: 38 * k, file: 22 * k, out: 76 * k };
  const link = 8 * k;
  const voiceW = Math.max(60, w - 2 * pad - col.scene - col.event - col.layer - col.file - col.out - 2 * link - 4 * gap);
  const headH = 12 * k;
  const laneH = (h - 1 - headH - 3 * k) / Math.max(1, layers.length);
  const posted: LampState = live ? 'on' : held ? 'ring' : 'off';
  const master = Math.max(0, Math.min(1, s.master));
  const outBar = col.out - 36 * k;
  return (
    <HudFrame w={w} h={h} label={aChainSummary(c, s)} style={{ paddingHorizontal: pad, justifyContent: 'center' }}>
      {/* the legends */}
      <View style={{ height: headH, flexDirection: 'row', alignItems: 'center' }}>
        <Lbl k={k} style={{ width: col.scene + link }}>
          SCENE
        </Lbl>
        <Lbl k={k} style={{ width: col.event + link }}>
          EVENT
        </Lbl>
        <Lbl k={k} style={{ width: col.layer + gap }}>
          LAYER
        </Lbl>
        <Lbl k={k} style={{ width: col.file + gap }}>
          FILE
        </Lbl>
        {/* the voices' time scale: the event's own clock, 0 to 2 seconds */}
        <View style={{ width: voiceW, height: headH, justifyContent: 'center' }}>
          <Lbl k={k} style={{ alignSelf: 'flex-start' }}>
            VOICE
          </Lbl>
          <View style={{ position: 'absolute', left: voiceW / 2 - 12 * k, width: 24 * k, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Val k={k} color={HUD.legend}>
              1 s
            </Val>
          </View>
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center' }}>
            <Val k={k} color={HUD.legend}>
              2 s
            </Val>
          </View>
        </View>
        <Lbl k={k} style={{ width: col.out + gap, textAlign: 'right' }}>
          {held ? 'LAST PRESS' : 'OUTPUT'}
        </Lbl>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: laneH * layers.length }}>
        {/* the scene posts the event */}
        <View style={{ width: col.scene, flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
          <Lamp d={6 * k} state={posted} />
          <Lbl k={k} color={c ? HUD.live : HUD.idle}>
            DOOR
          </Lbl>
        </View>
        <Link w={link} lit={!!c} k={k} />
        <View style={{ width: col.event, flexDirection: 'row', alignItems: 'center', gap: 4 * k, paddingLeft: 3 * k }}>
          <Lamp d={6 * k} state={posted} />
          <Lbl k={k} color={c ? HUD.live : HUD.idle}>
            POSTED
          </Lbl>
        </View>
        {/* the event asks each of its layers */}
        <View style={{ width: link, height: laneH * (layers.length - 1) + 1.5 * k, borderLeftWidth: c ? 1.5 * k : 1, borderTopWidth: c ? 1.5 * k : 1, borderBottomWidth: c ? 1.5 * k : 1, borderColor: c ? HUD.value : HUD.slotRim }} />
        <View>
          {layers.map((layer, i) => {
            const lane = c?.lanes[i] ?? null;
            const v = lane?.voice ?? 'not-started';
            const made = v === 'waiting' || v === 'playing' || v === 'done';
            return (
              // a lane that says why it has no voice sits over the clock line
              <View key={layer.id} style={{ height: laneH, flexDirection: 'row', alignItems: 'center', zIndex: v === 'missing' || v === 'off' ? 2 : 0 }}>
                <Lbl k={k} color={c ? HUD.live : HUD.idle} style={{ width: col.layer, paddingLeft: 4 * k }}>
                  {layer.id.toUpperCase()}
                </Lbl>
                <View style={{ width: col.file + gap, paddingLeft: 5 * k }}>
                  <Lamp d={6 * k} state={held && FILE_LAMP[v] === 'on' ? 'ring' : FILE_LAMP[v]} color={v === 'missing' ? HUD.red : HUD.value} />
                </View>
                <View style={{ marginLeft: gap }}>
                  <VoiceLane k={k} w={voiceW} h={laneH} lane={lane} held={held || !made} />
                </View>
              </View>
            );
          })}
          {/* the event's clock, across both lanes */}
          {c && live ? (
            <View
              style={{
                position: 'absolute',
                left: col.layer + col.file + 2 * gap + Math.max(0, Math.min(1, (now - c.born) / A_CHAIN_SPAN_S)) * voiceW,
                top: 2 * k,
                bottom: 2 * k,
                width: 1,
                zIndex: 1,
                backgroundColor: HUD.live,
              }}
            />
          ) : null}
        </View>
        {/* what reaches the output, under the lab LEVEL */}
        <View style={{ width: col.out, marginLeft: gap, alignItems: 'flex-end', justifyContent: 'center', gap: 3 * k }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View>
              <Bar w={outBar} h={6 * k} level={c?.out ?? 0} />
              <View style={{ position: 'absolute', left: Math.round(barX(master, outBar)) - 0.75 * k, top: -2 * k, bottom: -2 * k, width: 1.5 * k, backgroundColor: HUD_VALUE }} />
            </View>
            <Val k={k} color={live ? HUD.value : HUD.idle} style={{ width: 36 * k, textAlign: 'right' }}>
              {live ? aLevelWord(c?.out ?? 0) : held ? 'ENDED' : 'OFF'}
            </Val>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
            <View style={{ width: 1.5 * k, height: 8 * k, backgroundColor: HUD_VALUE }} />
            <Lbl k={k}>{`LEVEL ${aPct(master)}`}</Lbl>
          </View>
        </View>
      </View>
    </HudFrame>
  );
}

/* ── sync (page 8) ──────────────────────────────────────────────────────── */

/** `mark` 0 … 1: how strongly the cell says SENT (it fades on the model's
 *  clock; with motion reduced it is shown whole until it goes out). */
function SyncCell({ k, w, kind, mark, children }: { k: number; w: number; kind: string; mark: number; children: ReactNode }) {
  const marked = mark > 0;
  return (
    <View style={{ width: w, justifyContent: 'center', gap: 1 * k }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
        <View>
          <Lamp d={6 * k} state="off" />
          {marked ? (
            <View style={{ position: 'absolute', left: 0, top: 0, opacity: mark }}>
              <Lamp d={6 * k} state="on" />
            </View>
          ) : null}
        </View>
        <Lbl k={k} color={marked ? HUD.value : HUD.legend}>
          {kind}
        </Lbl>
        {marked ? (
          <View style={{ opacity: Math.max(0.35, mark) }}>
            <Lbl k={k} color={HUD.value}>
              · SENT
            </Lbl>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function SyncHud({ w, h, state: s }: GaHudProps) {
  const k = hudK(h);
  const ref = useRef<ASync | null>(null);
  const y = (ref.current = aSyncStep(ref.current, s));
  const { now, still } = useHudNow(aSyncAnyMarked(y, gaNow()), aSyncNextUnmark(y, gaNow()));
  const mark = (at: number | null | undefined) => (still ? (aSyncMark(at, now) > 0 ? 1 : 0) : aSyncMark(at, now));
  const pad = 8 * k;
  const gap = 7 * k;
  const cellW = Math.floor((w - 2 * pad - 3 * (2 * gap + 1)) / 4);
  const t = y.trigger;
  // a legend that would be cut in a narrow cell takes its short form (at
  // 320 wide "GENERATOR 1 · OFF" was cut: bug test 2026-11-13, B-S2-06; the
  // lab's short name GEN 1 is the dock key's own)
  const fit = (long: string, short: string): string => aLegendFit(long, short, cellW, k);
  const who = (name: string) => (
    <Lbl k={k} style={{ width: 34 * k }}>
      {name}
    </Lbl>
  );
  return (
    <HudFrame w={w} h={h} label={aSyncSummary(y)} style={{ flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: pad }}>
      <SyncCell k={k} w={cellW} kind="TRIGGER" mark={mark(t?.t)}>
        <Lbl k={k}>{t ? `FROM ${t.from}` : fit('NONE SENT YET', 'NONE YET')}</Lbl>
        <Val k={k} color={t ? HUD.value : HUD.idle}>
          {t ? t.what : '—'}
        </Val>
      </SyncCell>
      <Rule k={k} style={{ marginHorizontal: gap }} />
      <SyncCell k={k} w={cellW} kind="SWITCH" mark={mark(y.switchAt)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {who('YOU')}
          <Val k={k} color={y.you ? HUD.value : HUD.idle}>{y.you ? A_SURFACE_WORD[y.you] : '—'}</Val>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {who('GUIDE')}
          <Val k={k} color={y.guide ? HUD.value : HUD.idle}>{y.guide ? A_SURFACE_WORD[y.guide] : '—'}</Val>
        </View>
      </SyncCell>
      <Rule k={k} style={{ marginHorizontal: gap }} />
      <SyncCell k={k} w={cellW} kind="PARAMETER" mark={mark(y.speedAt)}>
        <Lbl k={k}>{y.running ? fit('GENERATOR 1', 'GEN 1') : fit('GENERATOR 1 · OFF', 'GEN 1 · OFF')}</Lbl>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
          {/* a speed is not a level: one flat color, never the loudness ramp */}
          <Gauge w={cellW - 30 * k} h={6 * k} value={y.speed} color={y.running ? HUD.value : HUD.idle} hollow={!y.running} />
          <Val k={k} color={y.running ? HUD.value : HUD.idle} style={{ width: 26 * k, textAlign: 'right' }}>
            {aPct(y.speed)}
          </Val>
        </View>
      </SyncCell>
      <Rule k={k} style={{ marginHorizontal: gap }} />
      <SyncCell k={k} w={cellW} kind="STATE" mark={mark(y.moodAt)}>
        <Lbl k={k}>WHOLE GAME</Lbl>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
          {/* told by shape as well as by color: alert is a filled block */}
          <View style={{ width: 7 * k, height: 7 * k, borderWidth: 1.5, borderColor: y.mood === 'alert' ? HUD.warn : HUD.legend, backgroundColor: y.mood === 'alert' ? HUD.warn : 'transparent' }} />
          <Val k={k} color={y.mood === 'alert' ? HUD.warn : HUD.value}>
            {y.mood === 'alert' ? 'ALERT' : 'CALM'}
          </Val>
        </View>
      </SyncCell>
    </HudFrame>
  );
}

/* ── takes (page 9) ─────────────────────────────────────────────────────── */

/** One take: how high the bar sits is its pitch change, how tall it is its
 *  level change, both on fixed scales (±50 cents, ±2 dB). */
const TakePlot = memo(function TakePlot({ k, w, plotH, take, newest }: { k: number; w: number; plotH: number; take: ATake | null; newest: boolean }) {
  const barW = Math.min(9 * k, w - 8 * k);
  const unit = plotH / 32;
  const tall = take ? (13 + Math.max(-1, Math.min(1, take.gainDb / A_TAKE_DB)) * 6) * unit : 0;
  const lift = take ? Math.max(-1, Math.min(1, take.pitchCents / A_TAKE_CENTS)) * 6 * unit : 0;
  return (
    <View style={{ width: w, height: plotH, alignItems: 'center', justifyContent: 'center' }}>
      {take ? (
        <View style={{ width: barW, height: tall, borderRadius: 1.5, backgroundColor: newest ? HUD.value : '#b9bcc4', transform: [{ translateY: -lift }] }} />
      ) : (
        <View style={{ width: barW, height: 13 * unit, borderRadius: 1.5, borderWidth: 1, borderColor: HUD.slotRim }} />
      )}
      {/* a repeat the model says it avoided to choose this take */}
      {take?.avoided ? <View style={{ position: 'absolute', top: 0, width: 5 * k, height: 5 * k, borderWidth: 1, borderColor: HUD.legend, transform: [{ rotate: '45deg' }] }} /> : null}
    </View>
  );
});

function TakesHud({ w, h, state: s }: GaHudProps) {
  const k = hudK(h);
  const noted = useRef<readonly ATake[]>([]);
  noted.current = aNoteTakes(noted.current, s);
  const takes = aTakes(s, noted.current);
  const last = takes[takes.length - 1];
  const run = aTakesRun(takes);
  const pad = 8 * k;
  const gap = 6 * k;
  const keyW = 74 * k;
  const lastW = 66 * k;
  const slotW = Math.floor((w - 2 * pad - keyW - lastW - 2 * (2 * gap + 1)) / A_TAKES_KEPT);
  const labelH = 12 * k;
  const plotH = h - 1 - labelH - 4 * k;
  // the newest take is always the right-hand slot
  const slots: (ATake | null)[] = [...Array.from({ length: Math.max(0, A_TAKES_KEPT - takes.length) }, () => null), ...takes];
  return (
    <HudFrame w={w} h={h} label={aTakesSummary(takes, s.options.variation)} style={{ flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: pad }}>
      {/* the key to the drawing: always part of it */}
      <View style={{ width: keyW, justifyContent: 'center', gap: 1 * k }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
          <View style={{ width: 8 * k, height: 9 * k, alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: 0, height: 0, borderLeftWidth: 3 * k, borderRightWidth: 3 * k, borderBottomWidth: 3.5 * k, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: HUD.legend }} />
            <View style={{ width: 0, height: 0, borderLeftWidth: 3 * k, borderRightWidth: 3 * k, borderTopWidth: 3.5 * k, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: HUD.legend }} />
          </View>
          <Lbl k={k}>HIGHER: PITCH</Lbl>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
          <View style={{ width: 8 * k, alignItems: 'center' }}>
            <View style={{ width: 5 * k, height: 9 * k, borderRadius: 1, backgroundColor: HUD.legend }} />
          </View>
          <Lbl k={k}>TALLER: LEVEL</Lbl>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
          <View style={{ width: 8 * k, height: 2 * k, backgroundColor: HUD.warn }} />
          <Lbl k={k} color={run >= 2 ? HUD.warn : HUD.legend}>
            {run >= 2 ? `SAME TAKE ×${run}` : 'SAME TAKE'}
          </Lbl>
        </View>
      </View>
      <Rule k={k} style={{ marginHorizontal: gap }} />
      <View style={{ justifyContent: 'center' }}>
        <View style={{ height: plotH, flexDirection: 'row' }}>
          {/* no change in pitch: the line every bar is measured from */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: Math.round(plotH / 2), height: 1, backgroundColor: HUD.slotRim }} />
          {slots.map((t, i) => (
            <View key={t?.key ?? `empty-${i}`}>
              <TakePlot k={k} w={slotW} plotH={plotH} take={t} newest={!!t && i === slots.length - 1} />
              {/* the same take as the one before it: the two are joined */}
              {t?.same && i > 0 && slots[i - 1] ? <View style={{ position: 'absolute', left: -slotW / 2, width: slotW, bottom: 0, height: 2 * k, backgroundColor: HUD.warn }} /> : null}
            </View>
          ))}
        </View>
        <View style={{ height: labelH, flexDirection: 'row', alignItems: 'center' }}>
          {slots.map((t, i) => (
            <Val key={t?.key ?? `empty-${i}`} k={k} color={t ? (i === slots.length - 1 ? HUD.value : HUD.live) : HUD.idle} style={{ width: slotW, textAlign: 'center' }}>
              {t ? `${t.take}/${t.of}` : '·'}
            </Val>
          ))}
        </View>
      </View>
      <Rule k={k} style={{ marginHorizontal: gap }} />
      <View style={{ width: lastW, justifyContent: 'center', gap: 1 * k }}>
        {last ? (
          <>
            <Lbl k={k}>{`NEWEST · TAKE ${last.take}`}</Lbl>
            <Val k={k}>{aCentsWord(last.pitchCents)}</Val>
            <Val k={k}>{aTakeDbWord(last.gainDb)}</Val>
          </>
        ) : (
          <>
            <Lbl k={k} color={HUD.idle}>
              NO TAKE YET
            </Lbl>
            <Val k={k} color={HUD.idle}>
              — CENTS
            </Val>
            <Val k={k} color={HUD.idle}>
              — dB
            </Val>
          </>
        )}
      </View>
    </HudFrame>
  );
}

export const A_FLOW_HUDS = { chain: ChainHud, sync: SyncHud, takes: TakesHud };
