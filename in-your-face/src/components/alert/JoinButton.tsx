import type { ConferenceType } from "../../types";

interface Props {
  onClick: () => void;
  conferenceType?: ConferenceType;
}

export default function JoinButton({ onClick, conferenceType }: Props) {
  return (
    <button
      onClick={onClick}
      className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-xl transition-colors shadow-lg shadow-green-600/30"
    >
      Join {conferenceType === "Zoom" ? "Zoom" : conferenceType === "GoogleMeet" ? "Meet" : conferenceType === "Teams" ? "Teams" : "Meeting"}
    </button>
  );
}
