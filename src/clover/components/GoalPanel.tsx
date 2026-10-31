// @ts-nocheck
import { memo, useEffect, useState, type CSSProperties } from "react";
import { EVENT_DURATION, activeEvent, type Save } from "../game/data";
import { Block, PixelIcon, PxBar } from "./ui";

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h > 0 ? `${h}H ${String(m).padStart(2, "0")}M` : `${m}:${String(s).padStart(2, "0")}`;
};

/** The right-hand column: the live world event, or a countdown to the next one. */
export const GoalPanel = memo(function GoalPanel({ save }: { save: Save }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const event = activeEvent(save, now);
  return (
    <div className="goals" aria-label="World event">
      {event ? (
        <Block tone="tint" className="goal-event" faceClassName="goal-event-face" style={{ "--h": event.hue } as CSSProperties}>
          <PixelIcon name={event.icon} className="goal-event-icon" />
          <span className="goal-copy">
            <span className="tx-stroke goal-event-name">{event.name}</span>
            <span className="tx-label">{event.blurb}</span>
            <PxBar value={(save.event!.endsAt - now) / EVENT_DURATION} className="goal-bar" />
          </span>
          <span className="tx-stroke goal-event-time">{clock(save.event!.endsAt - now)}</span>
        </Block>
      ) : (
        <span className="tx-label goal-next-event">NEXT EVENT IN {clock(save.nextEventAt - now)}</span>
      )}
    </div>
  );
});
