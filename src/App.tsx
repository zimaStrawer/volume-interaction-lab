import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import axisHandleDiagonal from './assets/axis-handle-diagonal.svg';
import axisHandleHorizontal from './assets/axis-handle-horizontal.svg';
import axisHandleVertical from './assets/axis-handle-vertical.svg';
import boxReference from './assets/illust-box-ref.webp';
import courier from './assets/illust-courier-default.webp';
import iconRefresh from './assets/icon-refresh.svg';
import sliderThumb from './assets/slider-thumb.svg';
import statusBattery from './assets/status-battery.svg';
import statusCellular from './assets/status-cellular.svg';
import statusWifi from './assets/status-wifi.svg';

type Axis = 'l' | 'w' | 'h';
type Volume = Record<Axis, number>;
type TickPosition = 'above' | 'below';

const DEFAULT_VOLUME: Volume = { l: 41, w: 30, h: 31 };
const MAX_CM = 150;
const MODES = [
  { title: '交互1：刻度在上滑杆', short: '刻度在上滑杆' },
  { title: '交互2：刻度在下滑杆', short: '刻度在下滑杆' },
  { title: '交互3：三维坐标', short: '三维坐标' },
] as const;

const AXES = [
  { key: 'l', label: '长度' },
  { key: 'w', label: '宽度' },
  { key: 'h', label: '高度' },
] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(MAX_CM, Math.round(value)));
}

function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span className="status-time">9:41</span>
      <span className="status-icons">
        <img src={statusCellular} alt="" />
        <img src={statusWifi} alt="" />
        <img src={statusBattery} alt="" />
      </span>
    </div>
  );
}

function StaticSwitch() {
  return (
    <span className="static-switch" aria-label="详细尺寸已开启，仅展示">
      <span />
    </span>
  );
}

function CardHeader() {
  return (
    <div className="card-header">
      <h2>体积/规格</h2>
      <div className="detail-setting">
        <span>详细尺寸</span>
        <StaticSwitch />
      </div>
    </div>
  );
}

function ReferenceIllustration({ volume }: { volume: Volume }) {
  const originX = 160;
  const originY = 207;
  // Calibrate every projected edge from the real delivery-box dimensions.
  // This keeps 0 cm at a true zero and makes 41 × 30 × 31 cm wrap the reference box.
  const length = (volume.l / DEFAULT_VOLUME.l) * 32;
  const height = (volume.h / DEFAULT_VOLUME.h) * 22;
  const depthX = (volume.w / DEFAULT_VOLUME.w) * 9;
  const depthY = (volume.w / DEFAULT_VOLUME.w) * 10;
  const frontTop = originY - height;
  const frontRight = originX + length;
  const backX = originX + depthX;
  const backY = originY - depthY;
  const hasVolume = volume.l > 0 && volume.w > 0 && volume.h > 0;

  return (
    <div className="reference-illustration" role="img" aria-label="骑手、配送箱与物品三边尺寸参照">
      <span className="height-reference">身高175厘米</span>
      <span className="courier-crop">
        <img src={courier} alt="" draggable={false} />
      </span>
      <span className="box-reference">
        <img src={boxReference} alt="" draggable={false} />
      </span>
      <svg viewBox="0 0 327 225" aria-hidden="true">
        <g className="reference-axis">
          <path d={`M${originX} 208V82`} />
          <path d={`M${originX} 208H${originX + 132}`} />
          <path d={`M${originX} 208L${originX + 90} 118`} />
        </g>
        <g className="reference-labels">
          <text x={originX} y="75" textAnchor="middle">高</text>
          <text x={originX + 138} y="211">长</text>
          <text x={originX + 95} y="115" transform={`rotate(-45 ${originX + 95} 115)`}>宽</text>
        </g>
      </svg>
      {hasVolume ? (
        <svg className="volume-overlay" viewBox="0 0 327 225" aria-hidden="true">
          <g className="volume-box">
            <path d={`M${originX} ${originY}H${frontRight}V${frontTop}H${originX}Z`} />
            <path d={`M${backX} ${backY}H${frontRight + depthX}V${frontTop - depthY}H${backX}Z`} />
            <path d={`M${originX} ${originY}L${backX} ${backY}M${frontRight} ${originY}L${frontRight + depthX} ${backY}M${frontRight} ${frontTop}L${frontRight + depthX} ${frontTop - depthY}M${originX} ${frontTop}L${backX} ${frontTop - depthY}`} />
          </g>
        </svg>
      ) : null}
    </div>
  );
}

function TickRow({ position }: { position: TickPosition }) {
  return (
    <div className={`tick-row tick-row-${position}`} aria-hidden="true">
      {[0, 50, 100, 150].map((tick) => (
        <span key={tick}>
          <b>{tick}</b>
          <i />
        </span>
      ))}
    </div>
  );
}

interface DimensionSliderProps {
  axis: Axis;
  label: string;
  value: number;
  tickPosition: TickPosition;
  onChange: (value: number) => void;
}

function DimensionSlider({ axis, label, value, tickPosition, onChange }: DimensionSliderProps) {
  const percent = (value / MAX_CM) * 100;
  const slider = (
    <div className="slider-control">
      <span className="slider-rail" aria-hidden="true">
        <span className="slider-fill" style={{ width: `${percent}%` }} />
      </span>
      <img
        className="slider-thumb"
        src={sliderThumb}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ left: `${percent}%` }}
      />
      <input
        className="dimension-range"
        type="range"
        min="0"
        max={MAX_CM}
        step="1"
        value={value}
        aria-label={`${label}，单位厘米`}
        onInput={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  );

  return (
    <div className="dimension-slider" data-axis={axis}>
      <div className="dimension-value">
        <span>{label}</span>
        <strong>{value}</strong>
        <span>厘米</span>
      </div>
      {tickPosition === 'above' ? <TickRow position="above" /> : null}
      {slider}
      {tickPosition === 'below' ? <TickRow position="below" /> : null}
    </div>
  );
}

function SliderCard({ volume, tickPosition, onChange }: {
  volume: Volume;
  tickPosition: TickPosition;
  onChange: (axis: Axis, value: number) => void;
}) {
  return (
    <section className="volume-card slider-card">
      <CardHeader />
      <ReferenceIllustration volume={volume} />
      <div className={`sliders sliders-${tickPosition}`}>
        {AXES.map(({ key, label }) => (
          <DimensionSlider
            key={key}
            axis={key}
            label={label}
            value={volume[key]}
            tickPosition={tickPosition}
            onChange={(value) => onChange(key, value)}
          />
        ))}
      </div>
      <ResetButton onReset={() => AXES.forEach(({ key }) => onChange(key, DEFAULT_VOLUME[key]))} />
    </section>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button className="reset-button" type="button" onClick={onReset}>
      <img src={iconRefresh} alt="" aria-hidden="true" />
      恢复默认
    </button>
  );
}

interface AxisPlotProps {
  volume: Volume;
  onChange: (axis: Axis, value: number) => void;
}

function AxisPlot({ volume, onChange }: AxisPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const dragAxis = useRef<Axis | null>(null);
  const origin = { x: 143, y: 197 };
  const lengthEnd = { x: 313, y: 197 };
  const heightEnd = { x: 143, y: 27 };
  const widthEnd = { x: 23, y: 317 };

  const pointFor = (axis: Axis) => {
    const ratio = volume[axis] / MAX_CM;
    const end = axis === 'l' ? lengthEnd : axis === 'h' ? heightEnd : widthEnd;
    return {
      x: origin.x + (end.x - origin.x) * ratio,
      y: origin.y + (end.y - origin.y) * ratio,
    };
  };

  const valueFromPointer = (axis: Axis, clientX: number, clientY: number) => {
    const bounds = plotRef.current?.getBoundingClientRect();
    if (!bounds) return volume[axis];
    const scaleX = 327 / bounds.width;
    const scaleY = 334 / bounds.height;
    const x = (clientX - bounds.left) * scaleX;
    const y = (clientY - bounds.top) * scaleY;

    if (axis === 'l') return clamp(((x - origin.x) / 170) * MAX_CM);
    if (axis === 'h') return clamp(((origin.y - y) / 170) * MAX_CM);
    const dx = x - origin.x;
    const dy = y - origin.y;
    const projection = (dx * -120 + dy * 120) / (120 * 120 * 2);
    return clamp(projection * MAX_CM);
  };

  const startDrag = (axis: Axis, event: PointerEvent<HTMLButtonElement>) => {
    dragAxis.current = axis;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(axis, valueFromPointer(axis, event.clientX, event.clientY));
  };

  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragAxis.current) {
      onChange(dragAxis.current, valueFromPointer(dragAxis.current, event.clientX, event.clientY));
    }
  };

  const endDrag = () => {
    dragAxis.current = null;
  };

  const handleKey = (axis: Axis, event: KeyboardEvent<HTMLButtonElement>) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? -1
        : 0;
    if (delta !== 0) {
      event.preventDefault();
      onChange(axis, clamp(volume[axis] + delta));
    }
  };

  // 三个手柄与高亮框共用同一套几何点，避免拖动位置与框体尺寸脱节。
  const lengthPoint = pointFor('l');
  const widthPoint = pointFor('w');
  const heightPoint = pointFor('h');
  const lengthHeightPoint = {
    x: lengthPoint.x + heightPoint.x - origin.x,
    y: lengthPoint.y + heightPoint.y - origin.y,
  };
  const lengthWidthPoint = {
    x: lengthPoint.x + widthPoint.x - origin.x,
    y: lengthPoint.y + widthPoint.y - origin.y,
  };
  const heightWidthPoint = {
    x: heightPoint.x + widthPoint.x - origin.x,
    y: heightPoint.y + widthPoint.y - origin.y,
  };
  const oppositePoint = {
    x: lengthPoint.x + heightPoint.x + widthPoint.x - origin.x * 2,
    y: lengthPoint.y + heightPoint.y + widthPoint.y - origin.y * 2,
  };

  const handleData = [
    { axis: 'l' as const, label: '拖动调整长度', asset: axisHandleHorizontal },
    { axis: 'w' as const, label: '拖动调整宽度', asset: axisHandleDiagonal },
    { axis: 'h' as const, label: '拖动调整高度', asset: axisHandleVertical },
  ];

  return (
    <div ref={plotRef} className="axis-plot">
      <svg viewBox="0 0 327 334" aria-hidden="true">
        <g className="axis-lines">
          <path d={`M${origin.x} ${origin.y}H${lengthEnd.x}`} />
          <path d={`M${origin.x} ${origin.y}V${heightEnd.y}`} />
          <path d={`M${origin.x} ${origin.y}L${widthEnd.x} ${widthEnd.y}`} />
        </g>
        <g className="axis-endcaps">
          <path d="M313 193V201" />
          <path d="M139 27H147" />
          <path d="M20 314L26 320" />
        </g>
        <g className="axis-dots">
          {[1 / 3, 2 / 3].map((fraction) => (
            <circle key={`l-${fraction}`} cx={origin.x + 170 * fraction} cy={origin.y} r="1.7" />
          ))}
          {[1 / 3, 2 / 3].map((fraction) => (
            <circle key={`h-${fraction}`} cx={origin.x} cy={origin.y - 170 * fraction} r="1.7" />
          ))}
          {[1 / 3, 2 / 3].map((fraction) => (
            <circle key={`w-${fraction}`} cx={origin.x - 120 * fraction} cy={origin.y + 120 * fraction} r="1.7" />
          ))}
        </g>
        <g className="axis-labels">
          <text x="194" y="181">50</text>
          <text x="248" y="181">100</text>
          <text x="303" y="181">150</text>
          <text x="314" y="202">长</text>
          <text x="116" y="143">50</text>
          <text x="111" y="87">100</text>
          <text x="111" y="31">150</text>
          <text x="139" y="18">高</text>
          <text x="92" y="232">50</text>
          <text x="53" y="273">100</text>
          <text x="12" y="314">150</text>
          <text x="7" y="329">宽</text>
        </g>
        <g className="axis-volume-box">
          <path
            d={`M${origin.x} ${origin.y}L${lengthPoint.x} ${lengthPoint.y}L${lengthHeightPoint.x} ${lengthHeightPoint.y}L${heightPoint.x} ${heightPoint.y}Z`}
          />
          <path
            d={`M${widthPoint.x} ${widthPoint.y}L${lengthWidthPoint.x} ${lengthWidthPoint.y}L${oppositePoint.x} ${oppositePoint.y}L${heightWidthPoint.x} ${heightWidthPoint.y}Z`}
          />
          <path
            d={`M${origin.x} ${origin.y}L${widthPoint.x} ${widthPoint.y}M${lengthPoint.x} ${lengthPoint.y}L${lengthWidthPoint.x} ${lengthWidthPoint.y}M${lengthHeightPoint.x} ${lengthHeightPoint.y}L${oppositePoint.x} ${oppositePoint.y}M${heightPoint.x} ${heightPoint.y}L${heightWidthPoint.x} ${heightWidthPoint.y}`}
          />
        </g>
      </svg>
      <img className="axis-box-reference" src={boxReference} alt="配送箱参照" draggable={false} />
      {handleData.map(({ axis, label, asset }) => {
        const point = pointFor(axis);
        return (
          <button
            key={axis}
            type="button"
            className={`axis-handle axis-handle-${axis}`}
            style={{ left: `${(point.x / 327) * 100}%`, top: `${(point.y / 334) * 100}%` }}
            aria-label={`${label}，当前${volume[axis]}厘米`}
            aria-valuemin={0}
            aria-valuemax={MAX_CM}
            aria-valuenow={volume[axis]}
            onPointerDown={(event) => startDrag(axis, event)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(event) => handleKey(axis, event)}
          >
            <img src={asset} alt="" draggable={false} />
          </button>
        );
      })}
    </div>
  );
}

interface AxisValueFieldProps {
  axis: Axis;
  label: string;
  value: number;
  onChange: (axis: Axis, value: number) => void;
}

function AxisValueField({ axis, label, value, onChange }: AxisValueFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const initialValue = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(String(value));
    }
  }, [editing, value]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const beginEdit = () => {
    initialValue.current = value;
    setDraft(String(value));
    setEditing(true);
  };

  const updateDraft = (nextDraft: string) => {
    if (nextDraft === '') {
      setDraft('');
      return;
    }

    const parsed = Number(nextDraft);
    if (!Number.isFinite(parsed)) return;
    const nextValue = clamp(parsed);
    setDraft(String(nextValue));
    onChange(axis, nextValue);
  };

  const finishEdit = () => {
    if (draft === '') {
      onChange(axis, initialValue.current);
      setDraft(String(initialValue.current));
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <label className="axis-value-editor">
        <span>{label.slice(0, 1)}</span>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          min="0"
          max={MAX_CM}
          step="1"
          value={draft}
          aria-label={`输入${label}，范围0到${MAX_CM}厘米`}
          onChange={(event) => updateDraft(event.currentTarget.value)}
          onBlur={finishEdit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              onChange(axis, initialValue.current);
              setDraft(String(initialValue.current));
              setEditing(false);
            }
          }}
        />
        <small>cm</small>
      </label>
    );
  }

  return (
    <button
      type="button"
      className="axis-value-trigger"
      aria-label={`编辑${label}，当前${value}厘米`}
      onClick={beginEdit}
    >
      <span>{label.slice(0, 1)}</span>
      <strong>{value}</strong>
      <small>cm</small>
    </button>
  );
}

function AxisCard({ volume, onChange }: {
  volume: Volume;
  onChange: (axis: Axis, value: number) => void;
}) {
  return (
    <section className="volume-card axis-card">
      <CardHeader />
      <div className="axis-values" aria-live="polite">
        {AXES.map(({ key, label }) => (
          <AxisValueField
            key={key}
            axis={key}
            label={label}
            value={volume[key]}
            onChange={onChange}
          />
        ))}
      </div>
      <AxisPlot volume={volume} onChange={onChange} />
      <ResetButton onReset={() => AXES.forEach(({ key }) => onChange(key, DEFAULT_VOLUME[key]))} />
    </section>
  );
}

function Navigation({ mode, onChange }: { mode: number; onChange: (mode: number) => void }) {
  const previous = mode > 0 ? MODES[mode - 1].short : '暂无';
  const next = mode < MODES.length - 1 ? MODES[mode + 1].short : '暂无';

  return (
    <nav className="comparison-nav" aria-label="切换体积录入交互方案">
      <button type="button" disabled={mode === 0} onClick={() => onChange(mode - 1)}>
        上一种：{previous}
      </button>
      <button type="button" disabled={mode === MODES.length - 1} onClick={() => onChange(mode + 1)}>
        下一种：{next}
      </button>
    </nav>
  );
}

export function App() {
  const [mode, setMode] = useState(0);
  const [volumes, setVolumes] = useState<Volume[]>(() =>
    MODES.map(() => ({ ...DEFAULT_VOLUME })),
  );
  const volume = volumes[mode];

  const updateVolume = (axis: Axis, value: number) => {
    setVolumes((current) =>
      current.map((item, index) =>
        index === mode ? { ...item, [axis]: clamp(value) } : item,
      ),
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
      if (event.key === 'ArrowLeft') setMode((current) => Math.max(0, current - 1));
      if (event.key === 'ArrowRight') setMode((current) => Math.min(MODES.length - 1, current + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="stage">
      <div className="device-shell">
        <StatusBar />
        <header className="screen-title">
          <h1>{MODES[mode].title}</h1>
        </header>
        {mode === 0 ? (
          <SliderCard volume={volume} tickPosition="above" onChange={updateVolume} />
        ) : null}
        {mode === 1 ? (
          <SliderCard volume={volume} tickPosition="below" onChange={updateVolume} />
        ) : null}
        {mode === 2 ? <AxisCard volume={volume} onChange={updateVolume} /> : null}
        <Navigation mode={mode} onChange={setMode} />
      </div>
    </main>
  );
}
