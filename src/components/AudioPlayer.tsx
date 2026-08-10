/**
 * AudioPlayer — S12 player panel. Playback via `expo-audio` (owner 2026-08-10;
 * expo-av was removed earlier for breaking the EAS iOS build — expo-audio is
 * the SDK-57 successor). The locked S12 visual contract and `{ uri }` prop are
 * unchanged, so ScenariosScreen is untouched.
 *
 * GRACEFUL DEGRADATION: the native `ExpoAudio` module is only present once a
 * build that includes it ships. Until then (and on web) `AUDIO_AVAILABLE` is
 * false and the panel renders its disabled state — exactly as before — instead
 * of throwing. Because that flag is a stable module-level constant, branching
 * on it at the top never trips the rules of hooks (the hook-using <LivePlayer>
 * mounts consistently or not at all).
 *
 * Visuals (design-reference 20-s12-ear-training panel): 48px play/pause cap,
 * recessed progress bar, "N PLAYS" (left) + "m:ss / m:ss" mono (right).
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { fonts } from '../theme/tokens';

const AUDIO_AVAILABLE = requireOptionalNativeModule('ExpoAudio') != null;

const fmtTime = (s: number): string => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export function AudioPlayer({ uri }: { uri: string | null }) {
  // No native module in this build (or no source) → the historical disabled UI.
  if (!AUDIO_AVAILABLE || !uri) return <PlayerShell uri={uri} />;
  return <LivePlayer uri={uri} />;
}

/** The real player — only mounted when the native module is available. */
function LivePlayer({ uri }: { uri: string }) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [plays, setPlays] = useState(0);

  const ready = status.isLoaded;
  const playing = status.playing;
  const dur = status.duration || 0;
  const pos = Math.min(status.currentTime || 0, dur || Infinity);
  const pct = dur > 0 ? Math.max(0, Math.min(1, pos / dur)) : 0;

  const toggle = () => {
    if (!ready) return;
    if (playing) {
      player.pause();
    } else {
      // A finished track restarts from the top; count each fresh start.
      if (status.didJustFinish || pos >= dur - 0.05) player.seekTo(0);
      player.play();
      setPlays((n) => n + 1);
    }
  };

  return (
    <PlayerShell
      uri={uri}
      onToggle={toggle}
      playing={playing}
      enabled={ready}
      pct={pct}
      plays={plays}
      timeLabel={`${fmtTime(pos)} / ${ready ? fmtTime(dur) : '0:00'}`}
    />
  );
}

/** The panel chrome — shared by the live and disabled states so the layout is
 *  identical whether or not audio is available. */
function PlayerShell({
  uri,
  onToggle,
  playing = false,
  enabled = false,
  pct = 0,
  plays = 0,
  timeLabel = '–:–– / –:––',
}: {
  uri: string | null;
  onToggle?: () => void;
  playing?: boolean;
  enabled?: boolean;
  pct?: number;
  plays?: number;
  timeLabel?: string;
}) {
  const glyphColor = enabled ? '#e8e8e8' : '#666666';
  return (
    <View style={styles.card}>
      <View style={[styles.pilotDot, enabled && playing && styles.pilotDotLive]} />
      <View style={styles.mainRow}>
        <Pressable
          onPress={onToggle}
          disabled={!enabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: !enabled, selected: playing }}
          accessibilityLabel={playing ? 'Pause' : 'Play'}
        >
          <LinearGradient colors={['#3a3a3a', '#2a2a2a']} style={styles.playCap}>
            <Text style={[styles.playGlyph, { color: glyphColor }]}>{playing ? '❚❚' : '▶'}</Text>
          </LinearGradient>
        </Pressable>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{enabled ? `${plays} ${plays === 1 ? 'PLAY' : 'PLAYS'}` : uri ? 'LOADING…' : 'NO AUDIO'}</Text>
        <Text style={styles.meta}>{timeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#060606',
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  pilotDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4a4a4a',
    borderWidth: 1,
    borderColor: '#222222',
  },
  pilotDotLive: { backgroundColor: '#5bff85', borderColor: '#1f6b34' },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  playGlyph: { fontSize: 16, color: '#666666' },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#6f8fae', borderRadius: 3 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: '#8f8f8f' },
});
