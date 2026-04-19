interface Props {
  onClick: () => void;
}

export default function SnoozeButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white text-xl rounded-xl transition-colors"
    >
      Snooze 5 min
    </button>
  );
}
