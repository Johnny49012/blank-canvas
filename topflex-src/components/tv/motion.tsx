import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, PressableProps, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Small, theme-agnostic motion kit for the DStv / GOtv screens.
 * Rules: only transform + opacity are animated; every loop stops when the component unmounts;
 * every piece renders a complete static state when the OS asks for reduced motion.
 */
export const USE_NATIVE = Platform.OS !== 'web';
export const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

/** Fade + rise entrance. Stagger siblings with `delay` (50-120 ms steps). */
export function Reveal({ children, delay = 0, distance = 18, style }: { children: React.ReactNode; delay?: number; distance?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    const a = Animated.timing(v, { toValue: 1, duration: 650, delay, easing: EASE, useNativeDriver: USE_NATIVE });
    a.start();
    return () => a.stop();
  }, [reduce, delay, v]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

type PressScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

/** Pressable with a spring press-scale (touch) and a small lift on hover (tablet / desktop pointer). */
export function PressScale({ children, style, containerStyle, scaleTo = 0.97, onPressIn, onPressOut, onHoverIn, onHoverOut, ...rest }: PressScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const spring = (v: Animated.Value, to: number) => Animated.spring(v, { toValue: to, speed: 30, bounciness: 6, useNativeDriver: USE_NATIVE }).start();
  return (
    <Pressable
      {...rest}
      style={containerStyle}
      onPressIn={(e) => { spring(scale, scaleTo); onPressIn?.(e); }}
      onPressOut={(e) => { spring(scale, 1); onPressOut?.(e); }}
      onHoverIn={(e) => { spring(lift, -3); onHoverIn?.(e); }}
      onHoverOut={(e) => { spring(lift, 0); onHoverOut?.(e); }}
    >
      <Animated.View style={[style, { transform: [{ translateY: lift }, { scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Concentric rings that expand and fade, like a signal leaving a dish. Decorative only. */
export function SignalRings({ color, size = 240, style }: { color: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const vals = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) { vals.forEach((v, i) => v.setValue(0.2 + i * 0.3)); return; }
    const run = (v: Animated.Value, from: number) => {
      v.setValue(from);
      Animated.timing(v, { toValue: 1, duration: 3600 * (1 - from), easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE })
        .start(({ finished }) => { if (finished) run(v, 0); });
    };
    vals.forEach((v, i) => run(v, i / 3));
    return () => vals.forEach((v) => v.stopAnimation());
  }, [reduce, vals]);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width: size, height: size, pointerEvents: 'none' }, style]}>
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color,
            opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }],
          }}
        />
      ))}
    </View>
  );
}

/** Slow looping ticker. Decorative: hidden from screen readers. */
export function Marquee({ items, bg, color, dot, radius = 0, textStyle }: { items: readonly string[]; bg: string; color: string; dot: string; radius?: number; textStyle?: StyleProp<TextStyle> }) {
  const reduce = useReducedMotion();
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    if (reduce || w <= 0) return;
    x.setValue(0);
    const a = Animated.loop(Animated.timing(x, { toValue: -w, duration: w * 30, easing: Easing.linear, useNativeDriver: USE_NATIVE }));
    a.start();
    return () => a.stop();
  }, [reduce, w, x]);
  const row = (key: string, measure: boolean) => (
    <View key={key} style={styles.mqRow} onLayout={measure ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
      {[...items, ...items].map((t, i) => (
        <View key={`${t}-${i}`} style={styles.mqItem}>
          <Text style={[styles.mqText, { color }, textStyle]}>{t.toUpperCase()}</Text>
          <View style={[styles.mqDot, { backgroundColor: dot }]} />
        </View>
      ))}
    </View>
  );
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.mq, { backgroundColor: bg, borderRadius: radius }]}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: x }] }}>{row('a', true)}{row('b', false)}{row('c', false)}</Animated.View>
    </View>
  );
}

/** Price that counts up once when it appears. Screen readers get the final value immediately. */
export function AnimatedPrice({ value, style, children }: { value: number; style?: StyleProp<TextStyle>; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reduce) { setShown(value); return; }
    const v = new Animated.Value(0);
    const id = v.addListener(({ value: n }) => setShown(Math.round(n)));
    Animated.timing(v, { toValue: value, duration: 700, easing: EASE, useNativeDriver: false }).start();
    return () => { v.removeListener(id); v.stopAnimation(); };
  }, [value, reduce]);
  return <Text accessibilityLabel={`GH₵ ${value} per month`} style={style}>GH₵ {shown}{children}</Text>;
}

/** Radio-style check that pops in with a spring when selected. */
export function PopCheck({ on, color, border, size = 26 }: { on: boolean; color: string; border: string; size?: number }) {
  const s = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(s, { toValue: on ? 1 : 0, friction: 5, tension: 170, useNativeDriver: USE_NATIVE }).start();
  }, [on, s]);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: on ? color : border, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center', opacity: s, transform: [{ scale: s }] }}>
        <Ionicons name="checkmark" size={size - 10} color="#ffffff" />
      </Animated.View>
    </View>
  );
}

/** A light sweep across a button every few seconds. Parent must be overflow: 'hidden'. */
export function ShineSweep({ width, tint = 'rgba(255,255,255,0.35)' }: { width: number; tint?: string }) {
  const reduce = useReducedMotion();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce || width <= 0) return;
    x.setValue(0);
    const a = Animated.loop(Animated.sequence([
      Animated.delay(2800),
      Animated.timing(x, { toValue: 1, duration: 900, easing: EASE, useNativeDriver: USE_NATIVE }),
      Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: USE_NATIVE }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduce, width, x]);
  if (reduce || width <= 0) return null;
  return (
    <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 70, pointerEvents: 'none', transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-90, width + 20] }) }, { skewX: '-20deg' }] }}>
      <LinearGradient colors={['rgba(255,255,255,0)', tint, 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mq: { overflow: 'hidden', height: 38, justifyContent: 'center' },
  mqRow: { flexDirection: 'row', flexShrink: 0, alignItems: 'center' },
  mqItem: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  mqText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6, paddingLeft: 18 },
  mqDot: { width: 5, height: 5, borderRadius: 3, marginLeft: 18, transform: [{ rotate: '45deg' }] },
});
