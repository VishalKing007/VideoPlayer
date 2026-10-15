import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  clampPlaybackRate,
  parseSubtitleTimestamp,
  parseSRT,
  parseVTT,
  getCurrentCue,
  getVideoFilterStyle,
  getVideoTransformStyle,
} from './playerUtils.ts';

test('formatTime formats seconds into mm:ss and hh:mm:ss correctly', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(3600), '1:00:00');
  assert.equal(formatTime(3665), '1:01:05');
  assert.equal(formatTime(-10), '00:00');
});

test('formatTime remaining mode calculates remaining duration', () => {
  assert.equal(formatTime(45, 'remaining', 100), '-00:55');
  assert.equal(formatTime(100, 'remaining', 100), '-00:00');
  assert.equal(formatTime(120, 'remaining', 100), '-00:00');
});

test('formatTime smpte timecode produces hh:mm:ss:ff', () => {
  const smpte = formatTime(10.5, 'smpte');
  assert.match(smpte, /^00:00:10:\d{2}$/);
});

test('clampPlaybackRate clamps speed within 0.25x and 4x', () => {
  assert.equal(clampPlaybackRate(0.1), 0.25);
  assert.equal(clampPlaybackRate(1.5), 1.5);
  assert.equal(clampPlaybackRate(5.0), 4.0);
  assert.equal(clampPlaybackRate(NaN), 1.0);
});

test('parseSubtitleTimestamp converts diverse timestamps accurately', () => {
  assert.equal(parseSubtitleTimestamp('00:01:30,500'), 90.5);
  assert.equal(parseSubtitleTimestamp('01:00:00.000'), 3600);
  assert.equal(parseSubtitleTimestamp('02:15'), 135);
});

test('parseSRT parses multi-line SRT subtitles', () => {
  const sampleSRT = `
1
00:00:01,000 --> 00:00:04,500
Hello world!
This is a test subtitle.

2
00:00:05,000 --> 00:00:09,000
Second cue appears here.
`;
  const cues = parseSRT(sampleSRT);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].startTime, 1);
  assert.equal(cues[0].endTime, 4.5);
  assert.equal(cues[0].text, 'Hello world!\nThis is a test subtitle.');
  assert.equal(cues[1].startTime, 5);
  assert.equal(cues[1].endTime, 9);
});

test('parseVTT parses WebVTT header and cues', () => {
  const sampleVTT = `WEBVTT - Demo

00:00:02.000 --> 00:00:05.000
VTT subtitle text line
`;
  const cues = parseVTT(sampleVTT);
  assert.equal(cues.length, 1);
  assert.equal(cues[0].startTime, 2);
  assert.equal(cues[0].endTime, 5);
  assert.equal(cues[0].text, 'VTT subtitle text line');
});

test('getCurrentCue finds cue active at given playback time', () => {
  const cues = [
    { startTime: 2, endTime: 5, text: 'First' },
    { startTime: 8, endTime: 12, text: 'Second' },
  ];

  assert.equal(getCurrentCue(cues, 1), null);
  assert.equal(getCurrentCue(cues, 3)?.text, 'First');
  assert.equal(getCurrentCue(cues, 6), null);
  assert.equal(getCurrentCue(cues, 10)?.text, 'Second');

  // with offset delay (+1s offset means video is at 4s, subtitle target is 3s -> First)
  assert.equal(getCurrentCue(cues, 4, 1)?.text, 'First');
});

test('getVideoFilterStyle generates valid CSS filter strings', () => {
  const defaultEffects = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    invert: false,
    sepia: 0,
    blur: 0,
    flipH: false,
    flipV: false,
    rotation: 0,
    aspectRatio: 'auto' as const,
  };
  assert.equal(getVideoFilterStyle(defaultEffects), 'none');

  const modifiedEffects = {
    ...defaultEffects,
    brightness: 130,
    contrast: 110,
    invert: true,
  };
  const filter = getVideoFilterStyle(modifiedEffects);
  assert.ok(filter.includes('brightness(130%)'));
  assert.ok(filter.includes('contrast(110%)'));
  assert.ok(filter.includes('invert(100%)'));
});

test('getVideoTransformStyle generates flip and rotation transforms', () => {
  const defaultEffects = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    invert: false,
    sepia: 0,
    blur: 0,
    flipH: true,
    flipV: false,
    rotation: 90,
    aspectRatio: 'auto' as const,
  };
  const transform = getVideoTransformStyle(defaultEffects);
  assert.ok(transform.includes('rotate(90deg)'));
  assert.ok(transform.includes('scaleX(-1)'));
});
