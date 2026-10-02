export interface WordTiming {
  text: string;
  startTime: number;
  endTime: number;
}

export interface LyricLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words?: WordTiming[];
}

export type KineticEffect =
  | 'emotional_soul'
  | 'stardust_sparkle'
  | 'tears_ripple'
  | 'dreamy_glow'
  | 'karaoke_glow'
  | 'beat_bounce'
  | 'cinematic_fade'
  | 'neon_pulse'
  | 'wave_float'
  | 'vertical_stack'
  | 'typewriter'
  | 'stomp_shake';

export type FontId =
  | 'Bebas Neue'
  | 'Syne'
  | 'Playfair Display'
  | 'Cinzel'
  | 'Montserrat'
  | 'Lobster'
  | 'Caveat'
  | 'Dancing Script'
  | 'Space Grotesk'
  | 'Righteous'
  | 'Orbitron'
  | 'Bangers';

export type BackgroundEffect =
  | 'ken_burns'
  | 'bass_pulse'
  | 'vinyl_spin'
  | 'particles_glow'
  | 'clean_cinematic';

export type VisualizerType = 'bars' | 'wave' | 'circle' | 'none';

export type ColorFilter =
  | 'none'
  | 'cinematic_teal'
  | 'cyberpunk'
  | 'vintage_warm'
  | 'moody_bw'
  | 'sunset';

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export interface TypographyConfig {
  fontFamily: FontId;
  fontSize: number; // in relative scale
  textColor: string;
  highlightColor: string;
  secondaryColor: string;
  textShadow: boolean;
  textStroke: boolean;
  strokeColor: string;
  letterSpacing: number; // px
  textCase: 'normal' | 'uppercase';
  textAlign: 'center' | 'left' | 'right';
  kineticEffect: KineticEffect;
  emotionalSparkles?: boolean;
  emotionalGradient?: boolean;
  wordBounceScale?: number; // 1.0 to 1.4x scale on singing
  wordTiltAngle?: number; // 0 to 12 deg tilt on beat
  pulseWithBass?: boolean; // dynamic bass bounce
}

export interface BackgroundConfig {
  imageUrl: string;
  effect: BackgroundEffect;
  dimOpacity: number; // 0 to 1
  blurAmount: number; // px
  filter: ColorFilter;
}

export interface VisualizerConfig {
  type: VisualizerType;
  color: string;
  opacity: number;
  barCount: number;
}

export interface SongMetadata {
  title: string;
  artist: string;
  genre?: string;
  mood?: string;
  bpm?: number;
}

export interface GenerativeElementProp {
  type: 'viewfinder_corners' | 'strobe_timecode' | 'hud_radar' | 'turntable_arm' | 'washi_tape' | 'audio_dock' | 'ambient_halo' | 'cinematic_bars' | 'laser_divider';
  xPercent?: number;
  yPercent?: number;
  color?: string;
  label?: string;
}

export interface GenerativeLayout {
  isFreeformAi?: boolean;
  artworkDisplay: {
    mode: 'side_card' | 'floating_vinyl' | 'centered_card' | 'fullscreen_immersive' | 'split_horizontal' | 'polaroid_badge' | 'freeform_custom';
    shape: 'rounded_square' | 'circle_vinyl' | 'polaroid' | 'pill' | 'frame';
    scale: number; // 0.25 to 0.9
    customPos?: { xPercent: number; yPercent: number; widthPercent?: number; heightPercent?: number };
    rotationDeg?: number;
    glowColor?: string;
    glowBlur?: number;
    showViewfinderCorners?: boolean;
    showVinylGrooves?: boolean;
    rotationEffect?: 'none' | 'slow_spin' | 'tilt_breath';
    borderStyle?: 'glass' | 'neon' | 'glow' | 'minimal' | 'polaroid' | 'double_ring' | 'none';
  };
  lyricsDisplay: {
    placement: 'right_side' | 'bottom_cinematic' | 'center_stage' | 'split_lower' | 'magazine_column' | 'freeform_custom';
    alignment: 'left' | 'center' | 'right';
    linesCount: number; // 1 to 4 lines visible
    customPos?: { xPercent: number; yPercent: number; maxWidthPercent?: number };
    showActiveAccentBar: boolean;
    accentBarColor?: string;
    boxStyle?: 'none' | 'frosted_pill' | 'dark_dock' | 'neon_bracket';
  };
  titleDisplay?: {
    customPos?: { xPercent: number; yPercent: number };
    alignment?: 'left' | 'center' | 'right';
    fontSizeScale?: number;
    badgeText?: string;
  };
  decorativeProps?: GenerativeElementProp[];
  keyframeMotion?: {
    wordScalePeak?: number; // 1.0 to 1.35
    wordTiltAngle?: number; // -15 to 15 deg
    pulseOnBeat?: boolean;
    sparkleIntensity?: number; // 0 to 1
  };
  visualizerPlacement: {
    position: 'under_artwork' | 'bottom_dock' | 'around_artwork' | 'under_lyrics' | 'vertical_bars' | 'freeform_custom';
    customPos?: { xPercent: number; yPercent: number; widthPercent?: number };
    style: 'bars' | 'wave' | 'ring' | 'dots';
    color?: string;
  };
  branding: {
    showTrackBadge: boolean;
    trackBadgeText?: string;
    titlePlacement: 'above_lyrics' | 'top_center' | 'under_artwork' | 'hidden';
  };
}

export type VideoLayoutMode = 'generative_ai' | 'rin_music_split' | 'kinetic_minimal' | 'vinyl_spin';

export interface VideoScene {
  id: string;
  name: string; // e.g. "Intro Khởi Đầu", "Verse 1", "Chorus Điệp Khúc", "Drop Cao Trào", "Outro Lắng Đọng"
  startTime: number;
  endTime: number;
  backgroundUrl: string;
  artMode?: 'side_card' | 'floating_vinyl' | 'centered_card' | 'fullscreen_immersive' | 'split_horizontal' | 'polaroid_badge';
  filter?: ColorFilter;
  effect?: BackgroundEffect;
  kineticEffect?: KineticEffect;
  highlightColor?: string;
  conceptPrompt?: string;
}

export interface ProjectData {
  title: string;
  artist: string;
  audioUrl: string;
  audioDuration: number;
  lyrics: LyricLine[];
  typography: TypographyConfig;
  background: BackgroundConfig;
  visualizer: VisualizerConfig;
  aspectRatio: AspectRatio;
  layoutMode?: VideoLayoutMode;
  generativeLayout?: GenerativeLayout;
  channelLogoText?: string;
  lyricOffset?: number; // Time shift in seconds (+/-) to micro-calibrate vocal sync
  scenes?: VideoScene[]; // Multi-scene cinematic storyboard
}

