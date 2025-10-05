interface TimelineEvent {
  content: string;
  start: number;
  end: number;
}

interface TimelineProps {
  events: TimelineEvent[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export default function Timeline({ events, currentTime, onSeek }: TimelineProps) {
  return (
    <div className="timeline space-y-4">
      {events.map((e, i) => {
        const active = currentTime >= e.start && currentTime <= e.end;

        return (
          <div
            key={i}
            onClick={() => onSeek(e.start)}
            className={`p-3 rounded-lg cursor-pointer transition border ${
              active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
            }`}
          >
            <div className="text-sm font-mono opacity-70">
              {formatTime(e.start)}–{formatTime(e.end)}
            </div>
            <div className="text-sm">{e.content}</div>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(t: number) {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
    alert(1);
  return `${m}:${s}`;
}
