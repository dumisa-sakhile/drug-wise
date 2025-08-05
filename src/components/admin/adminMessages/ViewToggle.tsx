interface ViewToggleProps {
  view: "compose" | "sent";
  setView: (view: "compose" | "sent") => void;
}

function ViewToggle({ view, setView }: ViewToggleProps) {
  return (
    <div className="flex gap-4 mb-8">
      <button
        className={`px-4 py-2 rounded-xl font-semibold ${
          view === "compose"
            ? "bg-gradient-to-r from-green-500 to-lime-500 text-white"
            : "bg-neutral-500/10 text-neutral-400 hover:bg-neutral-700"
        } transition-all duration-200`}
        onClick={() => setView("compose")}>
        Compose
      </button>
      <button
        className={`px-4 py-2 rounded-xl font-semibold ${
          view === "sent"
            ? "bg-gradient-to-r from-green-500 to-lime-500 text-white"
            : "bg-neutral-500/10 text-neutral-400 hover:bg-neutral-700"
        } transition-all duration-200`}
        onClick={() => setView("sent")}>
        Sent Messages
      </button>
    </div>
  );
}

export default ViewToggle;
